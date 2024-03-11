title: Remote Access: Build a Dial-Home Device
summary: Building a remote jump-box that dials home to establish a session
slug: dial-home-device
category: systems administration
tags: remote access, Ubuntu
date: 2019-09-17
modified: 2019-09-17
status: published
image: gear.png
thumbnail: gear-thumb.png


You've deployed a server in a customer environment and you don't have remote
network access configured. The customer is OK with you being able to remote
into their network, but its not practical to set you up with a VPN. Enter the
"Dial-Home Device".

# What is the Dial-Home Device
It's just an Ubuntu server that repeatedly tries to dial an internet connected
jump box in order to open a reverse session. As soon as the networking is set
up, it will dial home and open itself up for remote administration.

Also, [this.](https://stargate.fandom.com/wiki/Dial_Home_Device)

---


# Deploy the Pivot Server

## What's a Pivot Server?
This is an internet-connected server such as a VPS that the DHD will SSH to.

You'll SSH to it, then from there you can SSH through the DHD's reverse tunnel.


## Steps to Deploy

### Launch a VPS
Using AWS, GCP, Azure, Linode, Digital Ocean, so on, launch an
internet-connected Ubuntu server. It needs to have a static, internet routed IP
address. Its not a bad idea to make a DNS entry for it too, so you can change
the IP down the road.

SSH to the server to confirm that it works.

### Configure Remote User
These steps will create a user named `remoteuser`

```bash
# Create the user
useradd remoteuser

# Set a password for the user
passwd remoteuser

# Create the home & ssh directories for the user
mkdir -p /home/remoteuser/.ssh
chown -R remoteuser:remoteuser /home/remoteuser

# Disable shell access to the user, so it can't run commands on the pivot
usermod -s /bin/false remoteuser
```


---


# Deploy the Dial-Home Device

Install Ubuntu Server on a physical server or VM at the remote location. This
server should have network connectivity to whatever resource you want to
manage, and outbound internet access (it can ping google).


## Create an SSH key on the DHD
On the DHD server, you may already have SSH keys. Look in `~/.ssh`. If not,
run the following to create one. Don't use a passphrase, just hit enter when
prompted.

```bash
ssh-keygen
```

Collect the public key for the next step:

```bash
cat ~/.ssh/id_rsa.pub
```

For convenience, I like to copy the key to the root user too. Optional.


## Authorize the SSH Public Key on the Pivot Serer

Back on the Pivot server, edit the remote user's `authorized_keys` file to
grant this SSH key-pair access. Paste the SSH key at the end of the file

```bash
vi /home/remoteuser/.ssh/authorized_keys
```


## Test a remote connection

### Initiate the connection
From the DHD server, open the reverse tunnel manually to make sure it works.

- Replace the username as needed
- The `$pivot` variable should be the IP or FQDN of the pivot server
- Pick a random port in the range 1024-49151 for the listen port.


```bash
user="remoteuser"
pivot="support.example.com"
port=22222
ssh -fN -R 0.0.0.0:$port:127.0.0.1:22 $user@$pivot
```

### Connect through the pivot

From the pivot server, SSH to the DHD. This example assumes your username
is `myuser`.

```bash
ssh -p 22222 myuser@127.0.0.1
```

Consider adding your public key to the `~/.ssh/authorized_keys` file now so
passwords aren't needed.

Now you can jump through the pivot into the DHD.


---


# Persist the Connection

## Build the dial-home command

From any directory, create the script:

`vi dial-home`

```bash
#!/usr/bin/env bash

# Check if the reverse tunnel  is already open
port=22222
if [[ $(ps aux | grep ssh | grep $port) ]]; then
  # reverse tunnel is open
  exit 0
fi

# tunnel is not open, open it
user="remoteuser"
pivot="support.example.com"
ssh -fN -R 0.0.0.0:$port:127.0.0.1:22 $user@$pivot
```

Make the script executable
```bash
chmod +x dial-home
```

Move the script to somewhere in the `$PATH`

```bash
sudo mv dial-home /usr/local/bin/
```

Now the `dial-home` command will open the tunnel.


## Make cron dial-home every minute


The connection will die for lots of reasons. Make it bring itself back online
automatically using cron.

From the DHD, make sure cron is running (by default, it is)

```bash
systemctl status cron
```

Edit the crontab

`sudo vi /etc/crontab`

and insert this line, where `myuser` is your username on the DHD.
If you use root, you have to also give root the ssh private key.

```text
* * * * *   myuser dial-home
```

Reload cron

```bash
service cron reload
```

Then kill the session (using `ps aux` and `kill`) then watch it come back.

Done. Now the server is a dial-home device. It will constantly dial your pivot
server and re-open the session whenever its closed. To lock the server out,
just remove its public key from `remoteuser`'s `authorized_keys` file.
