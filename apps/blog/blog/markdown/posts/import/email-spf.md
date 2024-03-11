title: SPF for Trusted Emails
summary: Configuring which hosts are trusted to send emails for any domain using SPF.
slug: email-spf
category: systems administration
date: 2019-08-20
modified: 2019-08-20
status: published
image: project-email.png
thumbnail: project-email-thumb.png


**This post is linked to from the [Automated Emails Project](/project-email.html)**

# What is SPF?

Sender Policy Framework

SPF uses a DNS attribute assigned to the sending domain name that lists which
hosts are expected to send emails for that domain.


# How to use SPF

## Find your external IP address

Many VMs use NAT to accesss the internet. Their `ifconfig` output won't match
the actual internet IP that the emails will send from.

To check your external IP address, execute:

```bash
dig +short myip.opendns.com @resolver1.opendns.com
```

Below, the output of this command will be used as `<ext_ip>`

If you have a static public IP address you can use it as `<ext_ip>`


## Set the SPF DNS Record

There used to be a site with reference data at openspf.org but they ran out of
funding so it went offline. You can still get to its reference page from the
[WayBackMachine](http://web.archive.org/web/20190224184030/http://www.openspf.org/SPF_Record_Syntax).

To configure SPF, first
go to your domain registrar's website and create a new entry for your domain.
In Cloudflare, you just go to the DNS page. Cloudflare supports both SPF and
TXT records, some registrars will only offer TXT. If yours offers both, use
both for this.

Create a record for the domain your emails will send from. For instance, if
your emails will send from noreply@alerts.example.com, create an entry for
alerts.example.com.

Check the above linked reference for other options such as using A records,
but here's an example of an SPF record stating that emails are expected from
the IP address 1.2.3.4. You can also use subnet masks if you own a range.

```
v=spf ip4:1.2.3.4 -all
```

Set your DNS SPF record, and that's it, you're done. Receiving "milters"
might check this and add a few points or whatever towards your sender's
trustworthiness.
