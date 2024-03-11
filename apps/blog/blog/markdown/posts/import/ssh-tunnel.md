title: Port Forwarding through SSH Tunnels
slug: ssh-tunnels
category: guides
date: 2019-08-18
modified: 2019-08-18
Status: draft

---

# Scenario

You have three machines:
A: a Macbook laptop connected to the internet
B: an Ubuntu 18.04 server on GCP or AWS used as a pivot server.
   Lets call it pivot.example.com, assuming it has a DNS A record.
C: an Ubuntu 18.04 Server at a remote datacenter/office with no inbound rules
   configured on the firewall there.

You need to administer server C, from your workstation A, but you're not on the
network of C.


# Solution: SSH Tunnels
SSH can tunnel traffic through a server, effectively proxying the connections.
Here's how this works:

- C connects to B with a [reverse tunnel](https://www.howtoforge.com/reverse-ssh-tunneling),
  so that any connection to port 2022 on B will be proxied to 22 on C.
- A connects to B with a reverse tunnel so that any connection to 2022 on A
  goes to 2022 on B (which then goes to 22 on C)
- Connections from A to 127.0.0.1 on port 22022 act as if they were going to
  port 22 on C.

This can be done for any TCP service, be it SSH, Web traffic, IPMI, so on.


## Disclaimer
Whoever runs the network you're connecting to might not be happy you did this.
I suggest you talk with them first. It could save you some trouble. There are
security implications to opening a "back door" to a network.

Consider asking for a VPN account to the target network.


# Commands
These examples use the above example port of 2022, but you can forward other
ports and even multiple ports at once as needed.


## Tunnel from target server to pivot server
From **C**, the remote server,
create the reverse tunnel to **B**, the pivot server.
```bash
ssh -fNT -R 2022:localhost:22 ubuntu@pivot.example.com
```

## Tunnel from workstation to pivot server

From **A**, your workstation,
Create a tunnel to **B**, the pivot server, so your own workstation listens
for the traffic.

The sudo is used so you can pick lower ports, if desired. It's optional. The
`-i` argument is because sudo won't use your regular private key file.
```bash
sudo ssh -i ~/.ssh/id_rsa -fNT -L 2022:localhost:2022 ubuntu@pivot.example.com
```

## Connection from workstation to target server
Now that you have the two tunnels up, you can connect through them.

On your workstation, SSH through the tunnels:
```bash
ssh -p 2022 ubuntu@localhost
```


# A Neat Trick
In my [x11 forwarding guide](x11-forwarding-ubuntu18), I showed how to open
Chrome on a remote Ubuntu server. You can actually do through through the
tunnels you've just made, allowing you to access internal resources at the
target network.

```bash
ssh -XC -c chacha20-poly1305@openssh.com -p 2022 ubuntu@localhost google-chrome
```
