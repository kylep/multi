title: Postfix Send-Only Mail Service
summary: Deploy and configure Postfix as a local send-only mail server.
slug: emails-postfix-ubuntu
category: systems administration
tags: email,postfix
date: 2019-08-15
modified: 2019-08-15
status: published
image: postfix.png
thumbnail: postfix-thumb.png


**This post is linked to from the [Automated Emails Project](/project-email.html)**

---


In order to send emails from a VM you need a mail server. Often you can use
a public, corproate, or cloud mail server, but sometimes you might need to
deploy your own locally.

This guide covers how to configure Postfix as a local send-only mail service on
a dedicated Ubuntu VM.


---

[TOC]

---


# Create a send-only mail server with Postfix

## Find your external IP address

Many VMs use NAT to accesss the internet. Their `ifconfig` output won't match
the actual internet IP that the emails will send from.

To check your external IP address, execute:

```bash
dig +short myip.opendns.com @resolver1.opendns.com
```

Below, the output of this command will be used as `<ext_ip>`

If you have a static public IP address you can use it as `<ext_ip>`


## Set your hostname to an FQDN in /etc/hosts

This step is only required if you don't already have a local DNS server or
internet routed static IP with a valid FQDN.

Lets say that your mail will come from a server named alerts.example.com.
Set the hosts file like this:

`vi /etc/hosts`
```text
127.0.0.1 alerts.example.com
<ext_ip>  alerts.example.com
```


## Install Postfix

This is the software that manages your mail queue and handles SMTP.

```bash
apt-get install -y postfix mailutils
```

If it asks you which type of server to install, select Internet Site.
Give it an FQDN when prompted. If you will be sending emails from
noreply@alerts.example.com, enter `alerts.example.com`.


## Configure Postfix

Here's a configuration that's worked for me.
Be sure to change the `myhostname` field.

`vi /etc/postfix/main.cf`

```ini
myhostname = alerts.example.com

smtpd_banner = $myhostname ESMTP $mail_name (Ubuntu)
biff = no
append_dot_mydomain = no
readme_directory = no
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_use_tls = yes
smtpd_tls_session_cache_database = btree:${data_directory}/smtpd_scache
smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache
smtpd_relay_restrictions = permit_mynetworks permit_sasl_authenticated defer_unauth_destination
alias_maps = hash:/etc/aliases
alias_database = hash:/etc/aliases
mydestination = $myhostname, 63ec22ec9fc1, localhost.localdomain, , localhost
relayhost =
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128
mailbox_size_limit = 0
recipient_delimiter = +
inet_interfaces = loopback-only
inet_protocols = all
```

Once configured, restart Postfix:

```bash
systemctl restart postfix
```


## Send a test email from the command-line

Pipe some stdout to the [mail](https://linux.die.net/man/1/mail) command.
This will be used as the body of the email.

```bash
echo "Test alert please ignore" | mail \
  -a "FROM:noreply@alerts.example.com" \
  -s "Test alert" kyle@example.com
```


---


# Troubleshooting

Often emails don't go through. There are lots of reasons that can happen.

## Check for & remove mail stuck in the queue

Show the mail queue. It might tell you the error if the email is there.

```bash
mailq
```

If you've got a scheduled job that is adding emails, it can fill the queue up
and make you look like a spammer. Some mail servers will rate limit a sender,
especially if they haven't set up mechanisms by which they can be trusted.

To remove items from the mail queue by ID, run

```bash
# If you don't pass <ID> it will delete the all.
postsuper -d <ID>
```


### Outlook is blocking your emails
If you get a 500 error from outlook.\*, it could need a connector or a rule
exception for the filter. I haven't tested the connector.
 - [Disable the spam filter](https://docs.sophos.com/central/Customer/help/en-us/central/Customer/tasks/bypassingexchange.html)
 - [Use a connector (not tested)](https://docs.microsoft.com/en-us/exchange/mail-flow-best-practices/use-connectors-to-configure-mail-flow/set-up-connectors-to-route-mail)


# Other References
- [Postfix install guide from Digital Ocean](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-postfix-as-a-send-only-smtp-server-on-ubuntu-16-04)
- [Postfix setup guide from hostadvice.com](https://hostadvice.com/how-to/how-to-setup-postfix-as-send-only-mail-server-on-an-ubuntu-18-04-dedicated-server-or-vps/)
- [Basic Postfix config referece](http://www.postfix.org/BASIC_CONFIGURATION_README.html)
- [Detailed Postfix config docs](http://www.postfix.org/postconf.5.html)
- [Whats My IP from Curl](https://www.cyberciti.biz/faq/how-to-find-my-public-ip-address-from-command-line-on-a-linux/)
- [5 ways to send email from cli](https://tecadmin.net/ways-to-send-email-from-linux-command-line/)
- [DigitalOcean DKIM guide](https://www.digitalocean.com/community/tutorials/how-to-install-and-configure-dkim-with-postfix-on-debian-wheezy)
