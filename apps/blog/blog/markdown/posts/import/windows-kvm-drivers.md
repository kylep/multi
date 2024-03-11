title: Injecting KVM Drivers to Windows 10 for OpenStack
summary: How to inject KVM drivers into a Windows 10 image for use in OpenStack Glance
slug: windows-kvm-drivers
category: cloud
tags: OpenStack, Windows
date: 2019-12-17
modified: 2019-12-17
status: published
image: windows.png
thumbnail: windows-thumb.png


**This post is linked to from the [OpenStack Deep Dive Project](/openstack.html)**

---

[TOC]

---


**Note**: While these steps were tested against Windows 10, they should also
work against Windows 7 and the various Windows Servers. Be sure to run a newer
Windows OS than the one you're importing though - Don't try and import Windows
10 from a Windows 8 workstation, for instance.


---


# Prepare the image in-guest

From VMWare or HyperV, launch your template Windows VM and log in as an
administrative user. Make any firewall changes you need, install any packages,
and ensure that RDP is enabled.


## Remove VMWare Tools

If the guest has VMWare tools installed, remove them. They won't be needed
where we're going.


## Install cloudbase-init & sysprep (if needed)

This isn't so much for KVM as it is for OpenStack, but cloudbase-init is the
Windows version of cloud-init. This will set your hostname and such when the VM
is created.

1. [Download the Cloudbase-init installer](https://cloudbase.it/cloudbase-init/)
1. Run through the installer.
    1. Don't run as Local System.
    1. Don't name your user Administrator, the named user is made by this
       service to run the startup tasks.
1. At the end of the installation, you'll be prompted to sysprep. If this VM
   will be re-used as a template and not just a one-off VM, then sysprep it.


## Shut down the VM & Export the drive

Shut down the VM and grab the VMDK or VHDX file it booted from. Copy that file
to a directory on your computer, such as `C:\Temp`.


---


# Inject the KVM Drivers

1. [Download the VirtIO ISO](https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/latest-virtio/virtio-win.iso)
1. Mount the ISO to your workstation. In these examples, it's E:
1. Open PowerShell as admin and verify that the file is where you put it. You
   can show some basic info about it like this: `get-vhd C:\Temp\Win10.vhdx`
1. Create a mount-point for Dism: `mkdir C:\mount`
1. Mount the volume with Dism:
   `Dism /mount-image /ImageFile:C:\Temp\Win10.vhdx /Index:1 /MountDir:C:\mount`
1. Inject the `viostor` driver:
   `Dism /image:C:\mount /Add-Driver /Driver:E:\viostor\w10\amd64 /Recurse`
1. Inject the `Baloon` driver:
   `Dism /image:C:\mount /Add-Driver /Driver:E:\Balloon\w10\amd64 /Recurse`
1. Inject the `NetKVM` driver:
   `Dism /image:C:\mount /Add-Driver /Driver:E:\NetKVM\w10\amd64 /Recurse`
1. Confirm the drivers injected: `Dism /image:C:\mount /Get-Drivers`
1. Unmount the image: `Dism /Unmount-image /MountDir:c:\mount /commit`


Now the image is ready to be converted to raw/qcow2 and uploaded to OpenStack.

**Note**: CloudBase has released a Windows version of `qemu-img` so you can do
the conversions on Windows now without VirtualBox tools. You can download it
[here](https://cloudbase.it/qemu-img-windows/)
