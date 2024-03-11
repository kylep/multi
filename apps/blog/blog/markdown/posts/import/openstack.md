title: Project: OpenStack Deep Dive
summary: An ongoing in-depth exploration of the various projects and features of OpenStack.
slug: openstack
tags: OpenStack
category: projects
date: 2019-11-25
modified: 2019-11-25
status: published
image: openstack.png
thumbnail: openstack-thumb.png


**This project is a "Deep Dive":** In a Deep Dive project I'll be investigating
as much about the subject as time allows and assembling the posts in some
orderly fashion. I'll also be writing high-level notes and opinions in the
project page itself.


---

[TOC]

---


# What is OpenStack?

[OpenStack](https://www.openstack.org/) is a collection of open-source projects
that work together to form a private cloud solution. It's by far the
biggest open source private cloud option available. The [OpenStack Foundation](https://www.openstack.org/foundation/)
has over 105,000 community members from 187 countries around the world.

At a high level, you can think of it as an abstraction layer that sits on top
of other popular cloud technologies such as storage clusters, hypervisors, and
network solutions. For example, KVM (the popular Linux hypervisor) is not part
of OpenStack, but it's used by **Nova**, a component of OpenStack which can
orchestrate against KVM, VMWare, HyperV, and Xen.


---

# Project Posts & Progress

This project includes, or will include, the following posts.
If any aren't finished, check back later! I'll also certainly be adding more
as time goes on.

<table class="project-table">
  <tr>
    <th>Status</th>
    <th>Article</th>
  </tr>
  <tr>
    <td>-</td>
    <th>
      Installing Openstack
    </th>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/openstack-aio-ka-metal.html">
        Install OpenStack on Metal - Intel NUC
      </a>
    </td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/openstack-aio-ka-vm.html">
        Install OpenStack inside a VM
      </a>
    </td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/openstack-kolla-custom-plugin.html">
        Modifying OpenStack Kolla Docker Images
      </a>
    </td>
  </tr>
  <tr>
    <td>-</td>
    <th>Kubernetes on OpenStack</th>
  </tr>
  <tr>
    <td>WIP - Paused</td>
    <td>Installing OpenStack Magnum for Kubernetes-as-a-service</td>
  </tr>
  <tr>
    <td>-</td>
    <th>Operating Openstack Clouds</th>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/openstack-ansible.html">
        Operating OpenStack from Ansible
      </a>
    </td>
  <tr>
    <td>Not Started</td>
    <td>OpenStack Command-Line Cheat-Sheet</td>
  </tr>
  <tr>
    <td>Not Started</td>
    <td>Using Heat: IAC for OpenStack</td>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="/openstack-cloudinit-powershell.html">
        OpenStack Cloud-Init Powershell Example
      </a>
    </td>
  </tr>
  <tr>
    <td>-</td>
    <th>OpenStack Images</th>
  </tr>
  <tr>
    <td>Done</td>
    <td>
      <a href="windows-kvm-drivers">
        Injecting KVM Drivers into Windows
      </a>
    </td>
  </tr>
</table>

---


# Why Use an OpenStack Private Cloud?

1. **Price at scale:** At small scales, private clouds lose on price
   against the public clouds. As you start to ramp up though, the public clouds
   start to really nickle and dime you. Private clouds have higher up-front
   costs but they win out in the long-run.
1. **Predictable Cost:** Spin up a few services on AWS or Azure. How much will
   they cost you each month? As it stands, you're guess is going to be wrong.
   After the free trial periods and special offers stop muddying the water,
   you'll usually discover you're spending more than you thought.
1. **Hardware Re-Use:** Many IT organizations already have hardware sitting
   around running expensive hypervisor software. OpenStack is free and can use
   that existing hardware, giving you more for less.
1. **Data Sovereignty:** For legal and security reasons, many organizations
   must know exactly where their data is sitting at rest. With private clouds,
   there's no ambiguity.
1. **Behind Your Firewall:** So you spent a ton of money on some next
   generation firewall technologies with intrusion detection/prevention, and
   trained the staff up to use it. You run an arguably well secured
   data-center. Running OpenStack keeps the cloud behind your existing security
   measures.
1. **Latency:** Particularly for edge clouds and VDI solutions, having the
   cloud located right on-premises can hugely improve user experience.
1. **Shadow IT:** Developers are going to develop, even if your organization
   can't get them the tools they need in time. By offering your own in-house
   cloud, you can help prevent
   [shadow IT](https://en.wikipedia.org/wiki/Shadow_IT) from emerging.
1. **Control:** This one is a double-edged sword. Having more control over your
   cloud can be its own benefit, but there's also value in letting the pros
   handle it.
1. **Business as usual, without VMWare:** Don't get me wrong, VMWare make a
   great product... I've never heard anyone say they were happy with their
   VMWare bill. It's insanely expensive when there's an open source alternative
   that can check all the same boxes.

---


# Complexity and OpenStack (Ad)

OpenStack is significantly more difficult to get started with than the public
clouds. You can't really install OpenStack without first understanding what
each of the main components does, and even then each one has its own quirks for
their installation. If you want to install in production, you also need to
figure out how to get it all highly available.

Unless you've got a huge team that's eager to tackle this complexity, I'm going
to use this opportunity to plug the software & solution I've helped build for
[Breqwatr](https://breqwatr.com). They'll stand up your cloud in a couple days
flat, teach your team how to use it, and keep the lights on - all while
charging significantly less than VMWare would cost for the same hardware.

Breqwatr, and companies like it, can be your trusted cloud partner and abstract
away that complexity by handling the installation, upgrades, monitoring, and
day-to-day operation of the cloud.


---


# Installing OpenStack

## Non-Production Installation Options

If you're not looking for a production deployment and instead want to try
OpenStack out to learn it, there are a few good options.


### DevStack

The standard developer option is probably [DevStack](https://docs.openstack.org/devstack/latest/).

In truth I haven't used this since I've always needed my OpenStack installs to
mirror a production-ready environment. If I try it out, I'll replace the above
link with one to a guide I write myself.

### Small Physical Server + Kolla-Ansible

Another option is to install OpenStack on a physical server. I've documented
my experience doing this using images from the [Kolla project](https://github.com/openstack/kolla),
and Ansible automation from the [Kolla-Ansible project](https://github.com/openstack/kolla-ansible).

The nice thing about this approach is you can use a server at home, and once
you're done it can be a VM host as your private house cloud.

**[Installing OpenStack on a physical server](/openstack-aio-ka-metal.html)**


### Virtual Server + Kolla-Ansible

This option is great for development use if you already have a cloud available
or want to use a public cloud for testing OpenStack. The VMs you launch on it
will perform terribly though, and there are some networking complications.

Don't bother trying to launch Windows VMs at all in a nested virtualisation
scenario, you'll be lucky if they even boot.

**[Installing OpenStack on a Virtual Server](/openstack-aio-ka-vm.html)**


---

# Containerized OpenStack

Managing OpenStack clusters is a pain. It has so many services, each with their
own dependencies and operating instructions, there's a lot that can go wrong.
One thing that's really helped with that is to containerize each service and
deploy them all using Docker.

The [Kolla project](https://github.com/openstack/kolla) does such a great job
of that, that there's no need to do it yourself. That is, until you need to
change an image, for instance to install a Cinder plugin.

**[Modifying OpenStack Kolla Docker Images](/copenstack-kolla-custom-plugin.html)**
