title: VLAN Tagging Mac Thunderbolt NIC IP Traffic
summary: Configuring the external Thunderbolt MAC NIC to encapsulate its traffic in a VLAN
slug: mac-vlan-thunderbolt
category: systems administration
tags: Mac OS
date: 2020-07-23
modified: 2020-07-23
status: published
image: mac.png
thumbnail: mac-thumb.png


Sometimes you want to test a switch's trunk port without having to carve our an access port to plug your MacBook into. 

Here's how:

1. Open System Preferences
1. Click Network
1. Select your Thunderbolt Ethernet adapter
1. Click the gear below the sidebar listing the interfaces
1. Click Manage Virtual Interfaces
1. Click the + button
1. New VLAN
1. Enter a name, such as "VLAN-200"
1. Enter a VLAN ID in the Tag field, such as 200
1. Choose Tunderbolt Ethernet for your Interface
1. Click Create
1. On the sidebar, your new vlan ("VLAN-200") is now an option. Click it.
1. Configure as needed.
