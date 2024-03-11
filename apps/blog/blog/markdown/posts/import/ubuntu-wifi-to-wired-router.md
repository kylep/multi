title: Creating a Wireless Router for Wired Servers With Ubuntu Server
summary: Connecting wired servers, through a switch, to an ubuntu server with a wireless card.
slug: ubuntu-wifi-to-wired-router
tags: WiFi, Ubuntu
category: systems administration
date: 2019-08-20
modified: 2019-08-20
status: published
image: wifi.png
thumbnail: wifi-thumb.png


# Setup
This setup was done on an [Intel Nuc](https://www.intel.ca/content/www/ca/en/products/boards-kits/nuc.html).

The Nuc is running Ubuntu Server 18.04 Bionic, CLI only. It has a wired
connection to a rack switch on an access port, and a wireless connection to the
office WiFi.

The server will host 192.168.0.1 and act as a gateway for the wired servers.
It will do NAT just like a home router does to ensure there are no routing
problems with the upstream layer 3 devices.

This setup begins where my [Ubuntu WiFi Guide](ubuntu-bionic-wifi) left off.
Check it out if you're not sure how to connect to the WiFi from an Ubuntu
server.


# Enable IP Routing
Check if it's enabled in your config file. This command will just print the
file and ignore any comments or blank lines.
```
cat /etc/sysctl.conf | grep -v -e "#" -v -e "^$"
```

If you don't have this entry, edit the file and insert it:
```
net.ipv4.ip_forward=1
```

If you changed the file, apply your changes:
```
sysctl -p
```


# Configure Interfaces
Here's my netplan, with the wireless details changed:
```
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s25:
      dhcp4: false
      addresses:
        - 192.168.0.1/24
  wifis:
    wlp2s0:
      dhcp4: true
      access-points:
        "My SSID":
          password: "My Password"
```

If you changed your netplan file, apply the changes with
```
netplan try
```


# Configure NAT
We'll use `iptables` for NAT.

First, make a file that defines the rules you want:

## Define iptables rules file

These rules will take any traffic coming from 192.168.0.0/24 that are being
routed out the WiFi interface `wlp2s0` (the default gateway / default route),
and apply the MASQUERADE rule which will run port address translation, allowing
internet.

There are two tables, `nat` and `filter`. The NAT table does the translation,
the filter table defines what's allowed in and out. We need to specify that
traffic is allowed to go:
- From the Ethernet port to the WiFi port
- Back from WiFi to Ethernet, when it is `RELATED` or `ESTABLISHED`


`vi /etc/iptables_rules.sh`

```
#!/usr/bin/env bash
echo "Loading rules..."
iptables -t filter -A FORWARD -i enp0s25 -o wlp2s0 -j ACCEPT
iptables -t filter -A FORWARD -i wlp2s0 -o enp0s25 -m state \
  --state RELATED,ESTABLISHED -j ACCEPT
iptables -t nat -A POSTROUTING -s 192.168.0.0/24 -o wlp2s0 -j MASQUERADE
echo "Done"
```

Make the script executable

```bash
chmod +x /etc/iptables_rules.sh
```

## Load iptables rules now
Run the new file to apply the rules.
```bash
/etc/iptables_rules.sh
```

You can now use this device as a router without having to configure any special
routes.


## Configure iptables rules to load on boot

Add the following line to your rc.local file. If it doesn't exist, create it.

`vi /etc/rc.local`

```
/etc/iptables_rules.sh
```

If the file didn't exist, make sure that it starts with a shebang:

```
#!/usr/bin/env bash
```

Ensure that it's executable:

```
chmod +x /etc/rc.local
```
