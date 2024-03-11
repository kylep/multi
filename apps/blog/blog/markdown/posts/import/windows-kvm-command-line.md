title: Create Windows KVM VM from Command Line
summary: Creating a Windows KVM VM without OpenStack using the command line on Ubuntu 18.04
slug: windows-kvm-command-line
category: systems administration
tags: Ubuntu, KVM
date: 2020-06-05
modified: 2020-06-05
status: published
image: ubuntu.png
thumbnail: ubuntu-thumb.png


# Install KVM

Install the packages

```bash
apt-get install -y qemu-kvm libvirt-bin bridge-utils
```

Package notes from [ubuntu.com](https://help.ubuntu.com/community/KVM/Installation):

- libvirt-bin provides libvirtd which you need to administer qemu and kvm instances using libvirt
- qemu-kvm (kvm in Karmic and earlier) is the backend
- ubuntu-vm-builder powerful command line tool for building virtual machines
- bridge-utils provides a bridge from your network to the virtual machines


Add users to groups

```bash
adduser `id -un` libvirt
adduser `id -un` kvm
```

Verify install

```bash
virsh list --all
```


---


# Networking

## Configure network bridge

Your network interfaces should be configured with NetPlan right now. 
Since bridge-utils is installed, you can use NetPlan to do the rest.

Before doing this, it's a good idea to double-check your IPMI/IDRAC/ILO is working.

```yaml
# Example netplan config defining bridge
network:
  version: 2
  renderer: networkd
  ethernets:
    eno1:
      dhcp4: no
    eno2:
      dhcp4: no
  bridges:
    br0:
      interfaces: [eno2]
      addresses: ["10.1.0.14/24"]
      gateway4: 10.1.0.1
      mtu: 1500
      nameservers:
        addresses: ["10.1.0.154"]
      parameters:
        stp: true
        forward-delay: 4
      dhcp4: no
      dhcp6: no
```



---




# Defining the VM using virt-install

Install virt-install - it's kind of big, about 160MB

```bash
apt-get install -y virtinst
```

## Optional - list os-variant options

```bash
apt-get install -y libosinfo-bin

osinfo-query os
```

## Create the VM

- `--disk bus=`: 'ide', 'scsi', 'usb', 'virtio' or 'xen'.


### Booting from an existing qcow2 image

```bash
virt-install \
  --name MyImportedVM \
  --description "Imported virtual machine" \
  --graphics vnc,listen=0.0.0.0 \
  --noautoconsole \  
  --os-type=linux \
  --memory 8192 \
  --vcpus=4 \
  --disk path=/var/lib/libvirt/images/importedVM.qcow2,bus=virtio\
  --boot hd \
  --network bridge:br0,model=virtio
```

### Building a new Windows VM

Windows can be difficult on KVM because it doesn't ship with Virtio drivers. Using the non-virtio
disk and network emulation is comparatively slow. Things are made harder because `virt-install`
doesn't let you use --cdrom twice. To mount two iso files at once (so virtio drivers can be installed),
use the --disk argument with device=cdrom. Also be sure to use bus=ide so Windows can read it before
installing the virtio drivers.

The virtio drivers can be downloaded [here](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso)


```bash
virt-install \
  --name Server2019 \
  --description "Windows Server 2019 Template" \
  --os-type=windows \
  --memory 8192 \
  --vcpus=4 \
  --disk path=/var/lib/libvirt/images/windows2019.qcow2,bus=virtio,size=30 \
  --disk /var/lib/libvirt/isos/WindowsServer2019StandardCore_1909.iso,device=cdrom,bus=ide \
  --disk /var/lib/libvirt/isos/virtio-win.iso,device=cdrom,bus=ide \
  --graphics vnc,listen=0.0.0.0 \
  --noautoconsole \
  --network bridge=br0,model=virtio
```

- When installing the OS through your VNC viewer, no drives will show up.
- Click the "Load Driver" button, and browse to the virtio iso that was mounted.
- Expand the `viostor` folder and choose your OS. Click the `amd64` subdirectory. Click OK.
- RedHat VirtIO SCSI Controller should show up, click Next
- Finish the install

Once the install finishes the server will turn off. 

Edit the server using `virsh edit` to remove the disk:

```bash
virsh edit Server2019
```

Choose your editor of choice (vim, obviously), and remove the boot `cdrom` disk.
Leave the virtio one, you stil need it. It looks like this:


```xml
    <disk type='file' device='cdrom'>
      <driver name='qemu' type='raw'/>
      <source file='/var/lib/libvirt/isos/WindowsServer2019StandardCore_1909.iso'/>
      <target dev='hda' bus='ide'/>
      <readonly/>
      <address type='drive' controller='0' bus='0' target='0' unit='0'/>
    </disk>
```

Turn it back on using `virsh start`:

```bash
virsh start Server2019
```

#### Fix the other drivers

The storage driver is now installed, but the network driver isn't there.
Since the VM was launched with `--network bridge=br0,model=virtio`, the VirtIO
driver is required. Not using the virtio NIC leads to some pretty terrible performance.

Log into the server and open up the device manager.
Navigate to "other devices". Right click the question marked network driver
and update the driver. Select your virtio disk and allow searching subdirectories,
it should find the driver and install it for you.

Do the same for the unidentified PCI device, that will install the VirtIO Baloon driver.

The server is now ready to use, or be made into a template. If you intend to use this server
with OpenStack later, consider installing cloud-init from [cloudbase-init](https://cloudbase.it/cloudbase-init/).

---


# Accessing the VM through the console

When defining the VM, `--graphics vnc,listen=0.0.0.0` was used. This enabled a VNC server underneath the
VM which can be used to connect in. To find the connection details, run `virsh vncdisplay`, which will show
the port offset of that VM's VNC console.

```bash
virsh vncdisplay Server2019
```

The output will be something like `:0` or `:1`. Add 5900 to that, and that's your listen port.
If you needed to use a different port, `--graphics` supports a `,port=` argument.



---

# Exporting to Glance

If you want to use this file in OpenStack Glance next, you need to convert it. It's not intuitive, but the file looks like it's basically a thick-provisioned qcow2 (somehow). Use qemu-img:

```bash
# thin provision the volume
qemu-img convert -f qcow2 -O qcow2 <boot-vol> <new-file.qcow2>
# upload it as an image
openstack image create --container-format bare --disk-format qcow2 --public --file <new-file.qcow2> "<image name>"
```
