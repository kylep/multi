title: Adding Virtio drivers for KVM to RHEL's initrd
summary: RHEL images won't boot on OpenStack without KVM's Virtio drivers
slug: rhel-virtio-initrd
category: cloud
tags: OpenStack
date: 2020-10-21
modified: 2020-10-21
status: published
image: openstack.png
thumbnail: openstack-thumb.png


When you import a RedHat VM, say from VMWare, to a KVM environment like OpenStack it probably won't boot and instead goes straight to the dracut prompt.


This happens because the ramdisk doesn't have virtio drivers. You need to inject them. Import the volume and attach it to a running Linux server.
Personally I use Ubuntu, but it doesn't matter since you'll `chroot` in.


# Steps

## Mount the volume

1. In your cloud environment, mount the RedHat boot volume to your working Ubuntu (or whatever) machine. 
1. Find the boot and data volumes, and mount them too.
1. bind-mount your system paths into the root volume's mount point

```bash
mkdir /mnt/boot /mnt/root
mount <boot device> /mnt/boot
mount <root device> /mnt/root

for x in sys proc run dev tmp; do mount --bind /$x /mnt/root/$x; done
```

## Use Dracut to update the initrd file

1. chroot into the volume
1. Check `/etc/grub/grub.conf` to see which initrd file is being used. Something like `3.10.0-1062.1.2.el7.x86_64`.
1. check if the drivers are present
1. install the drivers
1. confirm they're present

```bash
# chroot in
cd /mnt
chroot root bash

# set the version
cat /etc/grub/grub.cnf
version=
# example: version=3.10.0-1062.1.2.el7.x86_64

# check for virtio drivers
lsinitrd /boot/initramfs-$version.img | grep virtio

# if not found, add them
cd /boot
dracut -f \
  /boot/initramfs-$version.img \
  $version \
  --add-drivers "virtio virtio_pci virtio_blk virtio_net"

# prove it worked
lsinitrd /boot/initramfs-$version.img | grep virtio

# leave the chroot
exit
```

This is a good time to do any other modifications you like, such as installing cloud-init or enabling DHCP.


## Clean up

Remove the mounts

```bash
for x in sys proc run dev tmp; do umount /mnt/root/$x; done
umount /mnt/root
umount /mnt/boot
```

## Validate

Now you should be able to boot your RedHat VM without dracut coming up.
