title: Launching Chrome from a Remote Ubuntu Server over SSH
summary: Launching chrome on a remote Ubuntu server using a local X11 graphics server
slug: x11-forwarding-ubuntu
category: systems administration
tags: remote access, Ubuntu, Chrome
date: 2019-08-19
modified: 2019-08-19
status: published
image: x-windows.png
thumbnail: x-windows-thumb.png


One pain point I often have is SSH forwarding the ports for a bunch of web
services and IPMI/IDRAC/ILO/Whatever connections through my pivot server to my
workstation. Its really tedious, and having a web UI right on the jump server's
subnet can be really helpful.

In this guide, I show how I launch Chrome on a remote Ubuntu server without
ever installing any graphics tools like Ubuntu Desktop on that server, and
without needing VNC/RDP/PCOIP/etc. X11 forwarding lets the XQuarts process on
a MacBook render the browser, while it still uses the networking on the Ubuntu
server it launched from.


---

[TOC]

---


# Configure Workstation (MacBook) SSH Settings for X11 Forwarding
If you're not using a MacBook, this won't apply.


## Set XAuthLocation
The workstation needs to allow X11 forwarding. Some brilliant update broke it
in my version of Mac OS I had to set the XAuthLocation in `ssh_config`.

`vi /etc/ssh/ssh_config`

```bash
Host *
  SendEnv LANG LC_*
  XAuthLocation /usr/X11/bin/xauth
  ServerAliveInterval 60
  ForwardX11Timeout 596h
```


## Enable ForwardAgent and ForwardX11

My hostname was `adc-bmc` and its IP was 192.168.2.2. Alter this as needed.
On your workstation:

`vi ~/.ssh/config`

```bash
Host adc-bmc
  HostName 192.168.2.2
  ForwardAgent yes
  ForwardX11 yes
```


# Remotely Launch Graphical Apps with XWindows

## Install Chrome

You can use Firefox or whatever instead. Chrome's install will fail due to
missing dependencies, but apt can sort it out.

```bash
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
dpkg -i google-chrome-stable_current_amd64.deb
apt-get install -f
dpkg -i google-chrome-stable_current_amd64.deb
```

## Install X11-apps for xeyes

This is just for fun and testing. Xeyes is kind of neat.

```
apt-get install -y x11-apps
```


---


# Launch Forwarded XWindows Session

## Open SSH session with X11 Forwarding Enabled.

XWindows can be passed through SSH. Open a new terminal window and connect to
the server using the `-X` flag to enable X forwarding on the client.

The xeyes application is a fun test.

```bash
ssh -X myuser@192.168.2.2 xeyes
```

If that works, try Chrome. The extra flags enable compression and use a faster
encryption algorithm. If they cause problems, just use `-X`.

```bash
ssh -XC -c chacha20-poly1305@openssh.com myuser@192.168.2.2 google-chrome
```



# Troubleshooting
## xauth:  timeout in locking authority file ~/.Xauthority

As your not-root user, remove and `chmod` some files.

```bash
sudo rm ~/.Xauthority-c
sudo rm ~/.Xauthority-l
sudo rm -r ~/.Xauthority
mkdir ~/.Xauthority
chmod 0600 ~/.Xauthority
```


## $DISPLAY is Empty, No xauth program
On your mac, if you connect with `ssh -v -X ...` and you get an error line
saying `No xauth program`, then you need to edit your SSH config to specify
the xauth path. Mine was `/usr/X11/bin/xauth`.


## X11 connection rejected because of wrong authentication.
If you're on Mac, this can happen when you didn't set the `XAuthLocation` ssh
configuration.


# Reference Links
- [linuxize.com - Install chrome](https://linuxize.com/post/how-to-install-google-chrome-web-browser-on-ubuntu-18-04/)
- [github.com - x11 forwarding tshooting](https://github.com/dnschneid/crouton/issues/2676)
