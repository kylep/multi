---
title: "Using a MacBook as an Ethernet Bridge"
summary: macOS Internet Sharing gets a headless wired device online through a Mac's
  Wi-Fi. It's a bootpd and pf NAT router under the hood, not a Layer 2 bridge, and
  a real bridge over Wi-Fi won't work. Here's why, and how to drive it.
slug: macbook-ethernet-bridge
category: systems administration
tags: macOS, networking, NAT, WiFi, Internet-Sharing
date: 2026-07-08
modified: 2026-07-08
status: published
imgprompt: A simple flat vector laptop linked by a cable to a small server box,
  minimal lines, solid pastel colors, no shading, clean geometric shapes on a
  plain background
keywords:
  - macos internet sharing
  - share wifi to ethernet mac
  - macbook ethernet bridge
  - macos bootpd pf nat
  - ssh headless device through mac
---


I have an Intel NUC that's headless and wired-only. It needs internet. The
MacBook sitting next to it is on Wi-Fi and has a spare Ethernet port through a
USB-C adapter. So the plan is to push the Mac's Wi-Fi out the Ethernet port and
into the NUC.

The word for that is "bridge," and it's in the title, but it's a lie. macOS will
not bridge Wi-Fi to Ethernet. What it gives you instead is a NAT router wearing a
friendly label. That's the part worth understanding, so start there.

# Why a real bridge doesn't work

A Layer 2 bridge would put the NUC on the same network as everything else on the
Wi-Fi, with its own address from the upstream DHCP server. Clean. The tools even
exist. macOS ships the BSD `if_bridge` driver, and you can build a bridge by hand:

```bash
sudo ifconfig bridge0 create
sudo ifconfig bridge0 addm en0 addm en1   # en0 Wi-Fi, en1 the USB-C Ethernet
```

`addm` adds a member interface and drops it into promiscuous mode so it forwards
every frame on the segment. Add two Ethernet ports this way and you get a working
bridge. Add the Wi-Fi interface and it falls apart.

Apple states the rule flatly in its
[bridging docs](https://support.apple.com/guide/mac-help/bridge-virtual-network-interfaces-on-mac-mh43557/mac):
"You can't use bridging if the physical network device used for bridging is a
wireless device." No workaround, no toggle.

The reason is 802.11, not macOS. An infrastructure-mode station talks to the
access point with a three-address frame format: source, destination, and the AP
acting as relay. A station can only source frames from its own associated MAC. It
can't put a frame on the air claiming to come from the NUC's MAC, which is exactly
what transparent bridging requires. Real L2 bridging over Wi-Fi needs the
four-address frame format from Wireless Distribution System (WDS), and 802.11
never standardized how WDS is negotiated. It's AP-specific and needs the AP's
cooperation, which you don't have on someone else's network.

Note: old Intel-era Macs reportedly half-worked around this circa OS X 10.8, with
extra static routes papering over the gaps. Current drivers block it outright.
Don't chase it.

So the bridge is out. The router is in.

# What Internet Sharing actually is

Flip on Internet Sharing and macOS starts two things behind the panel:

- `bootpd`, the DHCP server, which hands the NUC an address and a default route.
- `pf`, the packet filter, which does NAT so the NUC's traffic masquerades behind
  the Mac's Wi-Fi address.

That's a home router. DHCP on the inside, NAT out the WAN. The `natd` daemon used
to do the translation, but Apple removed `natd` and `ipfw` back in OS X 10.10 and
moved NAT into `pf`. Apple doesn't document the pf detail anywhere I could find,
but the pieces line up: `natd` is gone from the system, Internet Sharing still
works, and `pf` is what's left to do the job.

If you've read my post on
[building the same thing by hand on Ubuntu](/ubuntu-wifi-to-wired-router.html),
this is the identical design: a NUC behind a Wi-Fi host doing NAT so the wired
side reaches the internet. The difference is that on Ubuntu you write the netplan,
the `ip_forward` sysctl, and the iptables MASQUERADE rules yourself. On macOS a
toggle writes them for you and hides the result. Same router, less visibility.

# Turning it on

The setting moved into System Settings on recent macOS. This is macOS 26 (Tahoe),
the current release as I write this.

1. Apple menu, then System Settings.
2. General in the sidebar, then Sharing.
3. Find Internet Sharing in the list. Click the info button next to it to
   configure before flipping the toggle.
4. Set **Share your connection from** to Wi-Fi.
5. Under **To devices using**, check your USB-C Ethernet adapter.
6. Turn the Internet Sharing toggle on. Confirm the prompt.

Apple's own [walkthrough](https://support.apple.com/guide/mac-help/share-internet-connection-mac-network-users-mchlp1540/mac)
uses the opposite direction (share from Ethernet to Wi-Fi), but the two pop-up
menus are symmetric. Wi-Fi in, Ethernet out is the same dialog with the menus set
the other way.

Note: if the Mac is enrolled in an MDM, Internet Sharing may be greyed out. That's
a policy control, not a bug.

Once it's on, the Mac takes 192.168.2.1 on the Ethernet side. bootpd leases the
NUC an address in 192.168.2.0/24, and the Mac itself is the gateway. That default
subnet has been Internet Sharing's behavior for years. I haven't re-confirmed the
exact range on Tahoe specifically, so check yours in the next step rather than
assuming.

# Finding the NUC and getting in

The NUC is headless, so you need its leased address. Two ways from the Mac.

The ARP table shows the neighbor:

```bash
arp -a
# use -n to skip name resolution and just print numbers
arp -an
```

Or read bootpd's lease database directly. It's a plain-text file:

```bash
cat /var/db/dhcpd_leases
```

Each lease is a brace-delimited record. The shape looks like this (values will be
yours, not these):

```
{
	name=nuc
	ip_address=192.168.2.2
	hw_address=1,aa:bb:cc:dd:ee:ff
	identifier=1,aa:bb:cc:dd:ee:ff
	lease=0x...
}
```

Static bindings, if you ever set any, live in `/etc/bootptab` instead and won't
show up here.

Because the Mac holds the gateway address on the same /24, there's no NAT between
you and the NUC from the Mac's own terminal. SSH straight to the leased IP:

```bash
ssh user@192.168.2.2
```

That's the whole point of doing this from the gateway host. One caveat that
follows directly from it being NAT: nothing else on the Wi-Fi can reach the NUC.
The 192.168.2.0/24 subnet lives behind the Mac's NAT, invisible upstream. Reaching
the NUC from another machine on the Wi-Fi means writing `pf` redirect rules, which
is a different and more involved job than this post.

# Looking under the hood

The router is real, so you can inspect it. While Internet Sharing is running, the
NAT rules are loaded into pf:

```bash
sudo pfctl -s nat     # currently loaded NAT rules
sudo pfctl -s all     # everything pf has loaded
```

macOS keeps these in dynamic anchors. `/etc/pf.conf` reserves anchor points for
`com.apple/*`, and system services insert their rules into those anchors only
while the service runs, then pull them on shutdown. So `pfctl -s nat` shows the
Internet Sharing NAT rule when sharing is on and shows nothing when it's off. If
you want to scope the query to a single anchor, `pfctl -a <anchor> -s nat` does
that, though I couldn't verify the exact anchor name Internet Sharing uses.

The DHCP side is just as legible. bootpd reads `/etc/bootpd.plist`, and
Internet Sharing regenerates that file every time it starts, driven by its own
settings in `/Library/Preferences/SystemConfiguration/com.apple.nat.plist`. The
plist carries the subnet, netmask, address range, and router, which is the same
information you'd hand-code into a `dnsmasq` or `isc-dhcp` config on Linux.

None of this is hidden, only unadvertised. The menu item says Sharing. The guts
say router. Now you know which one you're actually running.
