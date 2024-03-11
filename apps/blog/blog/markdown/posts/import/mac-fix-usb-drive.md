title: Fix shrunken USB drive after using as boot disk
summary: How to fix formatting USB sticks after they shrink for burning .iso's to them.
slug: mac-fix-usb-drive
category: systems administration
tags: Mac OS
date: 2019-12-16
modified: 2019-12-16
status: published
image: mac.png
thumbnail: mac-thumb.png


When you use a tool like `dd` or [Etcher](https://www.balena.io/etcher/) to
turn a USB
stick into boot media, usually for installing an operating system, any attempt
at formatting that disk later will be met with a drive that only has a few GB
total. This is particularly annoying when you use something like a 100+GB USB
stick for that.

The cause of this problem is that a smaller partition is created on the drive
than the drive could potentially hold. To fix the drive you need to
removing all the partitions.


List your devices. Note your USB stick (example: `/dev/disk2`)

```bash
diskutil list
```

Try to fix it using diskutil:
```bash
diskutil eraseDisk free EMPTY /dev/disk2
```

Often that's good enough, and the drive now shows up in Disk Utility with its full capacity. 


---


If that fails, you can overwrite the partition/filesystem's metadata at the start of the disk with zeros.

If the drive is mounted, unmount it.

```bash
diskutil umountDisk /dev/disk2
```

Delete the partition. Note that I tried `gpt` first but it threw an error
saying `gpt show: error: bogus map`. Also, as far as I can tell, `diskutil`
won't actually erase a partition and instead will only reformat it. Strangely,
even `fdisk` seems to have hidden the option to delete a partition. Guess Apple
**REALLY** doesn't trust its users. That's too bad, since I ended up doing
something even more dangerous.

Overwrite the partition and filesystem data in the first 1GB of the USB drive
with zeros. Be **really really sure** that you select the right disk here.
You can 100% toast your workstation's boot disk if you accidentally specify it.

```bash
sudo dd if=/dev/zero of=/dev/disk2 count=1 bs=1GB
```

If that doesn't work, set `bs=1MB` and remove the `count=1`. You might need to
delete the end of it instead. That'll take a while.
