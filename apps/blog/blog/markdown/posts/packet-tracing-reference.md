---
title: Packet Tracing Reference
summary: "Quick reference for capturing and filtering network traffic on Ubuntu
  using tcpdump and tshark. Covers port filters, host filters, combined
  expressions, and tshark HTTP capture."
slug: packet-tracing-reference
category: systems administration
tags: Ubuntu, HTTP, API, tshark, tcpdump
date: 2020-06-04
modified: 2020-06-04
status: published
image: gear.png
thumbnail: gear-thumb.png
keywords:
  - tcpdump filter examples
  - tshark capture http traffic
  - packet capture ubuntu
  - tcpdump filter by port and host
  - wireshark command line tshark
---


# Regular TCPDUMP

Since tcpdump is installed by default, it's the first thing to use

```bash
# Only listen on one interface
tcpdump -i <interface/any>

# Filter to a host
tcpdump 'host <ip address/fqdn>'

# filter to a port
tcpdump 'tcp port 5000'

# combine filters
tcpdump '(tcp port 5000 or tcp port 35357) and host 192.168.0.100'

# print packets in ascii (basically always want this)
tcpdump -A

```

# Using tshark

Another option is wireshark's command line, tshark:

```bash
apt-get install tshark
```

Note that tshark is really slow to get started compared to tcpdump, you need to wait a good while
until it says something like "Capturing on 'eno1'"
```bash
# show interfaces
tshark -D

# Capture everything from a given source and interface
tshark -i eno1 -Y "ip.src == 10.1.0.76"

# Capture HTTP to and from a given source
tshark -i eno1 -Y "ip.addr == 10.1.0.76 and http"
```

---

**See also:** [Operations Reference Page](/ops.html) for more Linux ops
recipes: vim find-and-replace, passwordless sudo, loopback volumes,
journalctl, and bash exit traps.
