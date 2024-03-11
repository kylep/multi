title: Tuning a Windows 10 Workstation
summary: Making windows 10 less terrible to work with
slug: windows10-tuning
category: systems administration
tags: Windows
date: 2019-12-16
modified: 2019-12-16
status: draft
image: windows.png
thumbnail: windows-thumb.png


Windows Client is a neccesity in the business world and still probably the best
gaming PC OS out there. Here's what I've done to make working on it less
painful.

This post will be updated frequently as I find more stuff I feel aught to be
changed.

[TOC]

---

# Fix the Start Menu

Since Windows 7, Microsoft has failed to make a good start menu out of the box.
You don't need to install Classic Shell this time though. You do need to reboot
for some of these.


## Disable Start Web Search

In regedit, find:
`HKLM\SOFTWARE\Policies\Microsoft\Windows\Windows Search`

The `Windos Search` key didn't exist for me so I had to make it.

Find/Create `ConnectedSearchUseWeb` as a DWORD(32 bit) and set it to 0.


## Remove Suggested Apps

These are the games and such that they advertise in the start menu.

Had to do a few things before this worked.


In regedit, open:
`HKCU\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager`

Set `SystemPaneSuggestionsEnabled` to 0.

Also in regedit, open
`HKCU\Software\Policies\Microsoft\Windows\CurrentVersion\PushNotifications`

and make the 32-bit DWORD `NoTileApplicationNotification` and set it to 1

**Note**: On pro you had to do the gpedit.msc version of this.

## Prevent Silent App Installation

In regedit, open:
`HKCU\Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager`

Set `SilentInstalledAppsEnabled` to 0. Also, what the heck right? Silent
installed apps? No thanks.


---


# Cortana

Cortana might be worth playing with some day, but I super do not appreciate
having it forced upon me.

## Remove Cortana from the Lock Screen

Click Start and type "Cortana". Open **Cortana & Search Settings**.
Disable **Use Cortana even when my device is locked**.


---

# Enable Hyper-V

Probably the best thing about Windows is its Hypervisor. If you don't have Pro,
you can't do this.

Open the Windows Features tool and check Hyper-V. Next through the wizard.
That's it, pretty painless.


---



---

# Other

## Fix the time zone

Right click the time > Adjust Time & date, change the time zone drop-down.


## Enable SSH

Actually, this natively works now. About time, right? Woo!
