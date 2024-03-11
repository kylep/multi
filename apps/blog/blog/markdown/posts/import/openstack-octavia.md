title: Deploying Openstack Octavia  with Kolla-Ansible
summary: How to install, configure, and operate Octavia to deploy load balancer
slug: openstack-octavia
category: openstack
tags: OpenStack
date: 2019-08-29
modified: 2019-08-30
status: draft


This guide is broken, don't follow it. Octavia is a pain in Pike and won't
work right.


[Octavia](https://wiki.openstack.org/wiki/Octavia)
is an OpenStack project used to deploy multi-tenant load balancers, "LBaaS".

The load balancers can be used by cloud workloads and other OpenStack services.
The Magnum service in particular uses Octavia for any services defined with
`type: LoadBalancer`.

The LBaaS features used to be part of the
[Neutron](https://docs.openstack.org/neutron/latest/)  project, but they've
since split it off to its own project.

This guide assumes OpenStack is installed using Kolla-Ansible. It isn't
currently possible to install Octavia entirely with Kolla-Ansible. It needs
to be installed, then reconfigured.

Check my [openstack posts](/category/openstack.html) to see how I've installed
my dev/test clusters.


---


# High Level Steps

Octavia is difficult to deploy. It's the most complicated OpenStack service I
deploy in my clouds. This is the only service I've worked with that can't
actually be installed on a new cloud, and instead must be deployed as an
upgrade to an already deployed cloud.

To deploy Octavia, first:

- Install OpenStack with Octavia (`enable_octavia: "yes"`). It won't work, but
  the Keystone user will be created which is needed to configure the OpenStack
  service.
- Clone the Octavia git repository and install some disk image building tools
  to create a new disk image which will be uploaded to Glance.
  The instances made from that image appear to be named *Amphora*.
  These VMs do the actual load balancing.
    - Upload the file as a Glance image. The glance image must have a tag for
      Octavia to select it.
- Create a VLAN provider network. It's ID is hard-coded in the config files,
  so it can't be changed later. Octavia uses this network to talk to the
  amphora VMs it creates. Port-security is required.
- Create a flavor which also will be hard-coded into the config files. The
  amphora VMs will be built using this flavor.
- Create an SSH key-pair in keystone named octavia\_ssh\_key. Cloud-init will
  inject this key into the amphora VMs to allow troubleshooting.
- Create an OpenStack security group named octavia for TCP 5555,9443. It's also
  hard-coded into the config files.
- Build a bunch of certificate files manually, there's no working automation to
  help. Then, copy some of them into KA's config directory.
    - Be sure to combine the client cert and key files into one file
- Update the Kolla-Ansible globals.yml and use Kolla-Ansible to reconfigure
  the cloud.


Also consider reading this
[glossary](https://docs.openstack.org/octavia/latest/reference/glossary.html#term-amphora),
as the term in the Octavia project are really arbitrary and unintuitive.


Once all of that is done you can have Kolla-Ansible reconfigure/deploy the
service in a functional way.



---


# Create Certificates

I probably did this wrong, in that some steps could be skipped. The official
guide suggests a more secure approach than what Kolla-Ansible appears to
support.

[Here's the official guide](https://docs.openstack.org/octavia/latest/admin/guides/certificates.html)

There's a script in the Octavia GitHub repo that supposedly makes the required
certificates, at least insecurely for testing. It doesn't work at the time of
my writing this. It will let Kolla-Ansible install the service but load
balancers will fail to create.


Create a certs directory

```bash
cd ~
mkdir certs
chmod 700 certs
cd certs
```

Make an openssl.cnf file. I don't get why you can't use `/etc/ssl/openssl.cnf`
but I also haven't tried to.

`vi openssl.cnf`

```ini
# OpenSSL root CA configuration file.

[ ca ]
# `man ca`
default_ca = CA_default

[ CA_default ]
# Directory and file locations.
dir               = ./
certs             = $dir/certs
crl_dir           = $dir/crl
new_certs_dir     = $dir/newcerts
database          = $dir/index.txt
serial            = $dir/serial
RANDFILE          = $dir/private/.rand

# The root key and root certificate.
private_key       = $dir/private/ca.key.pem
certificate       = $dir/certs/ca.cert.pem

# For certificate revocation lists.
crlnumber         = $dir/crlnumber
crl               = $dir/crl/ca.crl.pem
crl_extensions    = crl_ext
default_crl_days  = 30

# SHA-1 is deprecated, so use SHA-2 instead.
default_md        = sha256

name_opt          = ca_default
cert_opt          = ca_default
default_days      = 3650
preserve          = no
policy            = policy_strict

[ policy_strict ]
# The root CA should only sign intermediate certificates that match.
# See the POLICY FORMAT section of `man ca`.
countryName             = match
stateOrProvinceName     = match
organizationName        = match
organizationalUnitName  = optional
commonName              = supplied
emailAddress            = optional

[ req ]
# Options for the `req` tool (`man req`).
default_bits        = 2048
distinguished_name  = req_distinguished_name
string_mask         = utf8only

# SHA-1 is deprecated, so use SHA-2 instead.
default_md          = sha256

# Extension to add when the -x509 option is used.
x509_extensions     = v3_ca

[ req_distinguished_name ]
# See <https://en.wikipedia.org/wiki/Certificate_signing_request>.
countryName                     = Country Name (2 letter code)
stateOrProvinceName             = State or Province Name
localityName                    = Locality Name
0.organizationName              = Organization Name
organizationalUnitName          = Organizational Unit Name
commonName                      = Common Name
emailAddress                    = Email Address

# Optionally, specify some defaults.
countryName_default             = US
stateOrProvinceName_default     = Oregon
localityName_default            =
0.organizationName_default      = OpenStack
organizationalUnitName_default  = Octavia
emailAddress_default            =
commonName_default              = example.org

[ v3_ca ]
# Extensions for a typical CA (`man x509v3_config`).
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
basicConstraints = critical, CA:true
keyUsage = critical, digitalSignature, cRLSign, keyCertSign

[ usr_cert ]
# Extensions for client certificates (`man x509v3_config`).
basicConstraints = CA:FALSE
nsCertType = client, email
nsComment = "OpenSSL Generated Client Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer
keyUsage = critical, nonRepudiation, digitalSignature, keyEncipherment
extendedKeyUsage = clientAuth, emailProtection

[ server_cert ]
# Extensions for server certificates (`man x509v3_config`).
basicConstraints = CA:FALSE
nsCertType = server
nsComment = "OpenSSL Generated Server Certificate"
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid,issuer:always
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth

[ crl_ext ]
# Extension for CRLs (`man x509v3_config`).
authorityKeyIdentifier=keyid:always

```

Get the CA passphrase defined by K-A's password file

```bash
grep octavia_ca /etc/kolla/passwords.yml
```

Make the certificates described by Octavia's documentation.
When asked for the ca password, enter the password returned from the
passwords.yml file. If you don't have this file,
you aren't using Kolla-Ansible and this guide isn't going to work quite right
for you.

```bash
mkdir client_ca server_ca
cd server_ca
mkdir certs crl newcerts private
chmod 700 private
touch index.txt
echo 1000 > serial

# Use the password from passwords.yml
openssl genrsa -aes256 -out private/ca.key.pem 4096

# Use the same password. Answer the prompts with whatever.
openssl req -config ../openssl.cnf -key private/ca.key.pem -new -x509 \
    -days 7300 -sha256 -extensions v3_ca -out certs/ca.cert.pem

cd ../client_ca
mkdir certs crl csr newcerts private
chmod 700 private
touch index.txt
echo 1000 > serial

# Again, same password
openssl genrsa -aes256 -out private/ca.key.pem 4096
chmod 400 private/ca.key.pem

openssl req -config ../openssl.cnf -key private/ca.key.pem -new -x509 \
  -days 7300 -sha256 -extensions v3_ca -out certs/ca.cert.pem
openssl genrsa -aes256 -out private/client.key.pem 2048
openssl req -config ../openssl.cnf -new -sha256 -key private/client.key.pem \
  -out csr/client.csr.pem
openssl ca -config ../openssl.cnf -extensions usr_cert -days 7300 -notext \
  -md sha256 -in csr/client.csr.pem -out certs/client.cert.pem
openssl rsa -in private/client.key.pem -out private/client.cert-and-key.pem
```

Copy the files Kolla-Ansible expects into /etc/kolla/config/octavia

```bash
mkdir -p /etc/kolla/config/octavia
cp ~/certs/server_ca/private/ca.key.pem /etc/kolla/config/octavia/cakey.pem
cp ~/certs/server_ca/certs/ca.cert.pem /etc/kolla/config/octavia/ca_01.pem
cp ~/certs/client_ca/private/client.cert-and-key.pem \
  /etc/kolla/config/octavia/client.pem
```

Finally, you should be able to run `kolla-ansible reconfigure` to install
Octavia.


### OR just use the dev ones

```bash
cd /etc/kolla/config/octavia
cp ~/octavia/devstack/pregenerated/certs/ca_01.pem ./
cp ~/octavia/devstack/pregenerated/certs/private/cakey.pem ./
cp ~/octavia/devstack/pregenerated/certs/client.pem .
```

If you do this you have to set the passwords.yml value to
```yaml
octavia_ca_password: foobar
```


# Configure Overcloud Resources

## Deploy Provider Network

I use a VLAN network with VLAN id 4, but any vlan or even a flat network would
work.

**NOTE:** This network _MUST_ have port-security enabled. Otherwise the
load-balancers will fail to create and the octavia-worker process will throw
the following error: `Exceeded maximum number of retries.`

```bash
openstack network create --external --share \
  --provider-physical-network physnet1 --provider-network-type vlan \
  --provider-segment 4 vlan4-net

openstack subnet create \
  --dhcp --network vlan4-net \
  --subnet-range 10.254.4.0/24 \
  vlan4-subnet
```

## Deploy Octavia Cloud Image

I can't find where to download the glance image that Octavia needs. Looks like
you have to build it yourself.

Clone their GitHub checkout and build it yourself.

Note the `--tag amphora`, that's what's used by Octavia to select the image.

```bash
apt-get install kpartx debootstrap
pip install diskimage-builder
cd git clone https://review.openstack.org/p/openstack/octavia
cd octavia


./diskimage-create/diskimage-create.sh -i centos -s 5

# This image has broken SSH... Try...
./diskimage-create/diskimage-create.sh -i ubuntu-minimal -t raw \
  -d bionic -l disk-image-build.log -o amphora.raw

qemu-img convert -f qcow2 -O raw amphora-x64-haproxy.qcow2 amphora.raw
openstack image create --container-format bare --disk-format raw --public \
  --file amphora.raw --tag amphora Amphora
```

## Create Flavor for Octavia

From this [quick-start doc](https://docs.openstack.org/octavia/pike/contributor/guides/dev-quick-start.html)
Octavia seems to need 1GB RAM for the Amphora VM.

```bash
openstack flavor create --private --ram 1024 --disk 20 --vcpus 1 octavia
```

### Note:
Looks like private flavors break everything. Need to use a public one
openstack flavor create --disk 20 --ram 2048 --vcpus 1 --public pub-octavia


## Create Key-Pair


Kolla-Ansible hardcodes a keypair named `octavia_ssh_key` into octavia.conf.
This keypair needs to be created using the `octavia` user.
The keypair create command requires a pub key file.

```bash
octavia_pass=$(cat /etc/kolla/passwords.yml | \
  grep octavia_keystone_password | awk '{print $2}')
openstack --os-username octavia --os-password $octavia_pass \
  keypair create --public-key id_rsa.pub octavia_ssh_key
```



## Create Security Group

Octavia needs some ports open.

22 in particular is needed for cloud-init, else you get an error saying
`'tlsv1 alert unknown ca'`.

```bash
openstack security group create octavia
openstack security group rule create --protocol icmp octavia
for port in 22 80 5555 9443; do
  openstack security group rule create --protocol tcp --dst-port $port octavia
done
```


## Change the haproxy REST driver

I don't know what this does, I needed to do it to get past this error when
creating the load balancers:
`Error: [('PEM routines', 'PEM_read_bio', 'no start line'), ('SSL routines',
'SSL_CTX_use_PrivateKey_file', 'PEM lib')]`

`vi /etc/kolla/config/octavia/octavia.conf`

```ini
[controller_worker]
# amphora_driver = amphora_haproxy_rest_driver
amphora_driver = noop
```

That doesn't work though, because Octavia doesn't have KA steps to replace
the contents of its config files like the other Openstack services do.

Change it in /etc/kolla/octavia-worker, then restart the octavia-worker docker
container. This will get reverted when you do KA reconfigure again, but it's
something.

Never mind, that IRC comment was wrong at least in my case.
`No 'octavia.amphora.drivers' driver found, looking for 'noop'`...

...Maybe its a "DER format cert"?
Nope.

...Maybe "Correct, the [haproxy_amphora] client_cert file needs the key and cert concatenated"

Yeah that works but now I get
`Error([('SSL routines', 'ssl3_read_bytes', 'tlsv1 alert unknown ca')]`

---


# Reconfigure Cloud for Octavia

## Update Globals.yml

Get the IDs of the required overcloud entities

```bash
openstack network list | grep vlan3-net
openstack security group list | grep octavia
openstack flavor list --private | grep octavia
```

Insert those IDs into the globals file.

From [Octavia's config reference](https://docs.openstack.org/octavia/pike/configuration/configref.html):

- `octavia_amp_boot_network_list`: List of networks to attach to the Amphorae
   All networks defined in the list will be attached to each amphora.
    - These networks must have port-security enabled
		- If the gateway IP isn't reachable, the loadbalancer status gets hung as
      `PENDING_CREATE`
- `octavia_amp_secgroup_list`: List of security groups to attach to the Amphora
- `octavia_amp_flavor_id`: Nova instance flavor id for the Amphora

Where it says "list", a single ID value is what I tested.


```yaml
enable_octavia: "yes"
octavia_amp_boot_network_list:
octavia_amp_secgroup_list:
octavia_amp_flavor_id:
```


## Deploy the Changes

```bash
kolla-ansible -i /etc/kolla/inventory reconfigure
```


---


# Using Octavia

## General Commands


## Load Balancing Example

```bash
# Create 2 cirros VMs
openstack server create --image cirros --flavor tiny --network vlan3-net test1
openstack server create --image cirros --flavor tiny --network vlan3-net test2

# Create the loadbalancer
openstack loadbalancer create \
  --name cli-test --vip-network-id 03e8f436-81fe-4b42-9c41-cce347aaf95a

```

# Reference Links

- I found [this blog post](https://shreddedbacon.com/post/openstack-kolla/) to
  be way more useful than any official docs
