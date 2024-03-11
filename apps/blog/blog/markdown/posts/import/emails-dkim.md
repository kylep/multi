title: SPF for Trusted Emails
summary: Configuring which hosts are trusted to send emails for any domain using SPF.
slug: email-dkim
category: guides
date: 2019-08-21
modified: 2019-08-21
status: draft
image: project-email.png
thumbnail: project-email-thumb.png


**This post isn't done. Doesn't work. Don't publish it.**

**This post is linked to from the [Automated Emails Project](/project-email.html)**


# What is DKIM
Domain Keys Identified Mail

![It's like SPF with extra steps](https://i.imgflip.com/37oxj1.jpg)


Instead of just specifying an expected sender's source address in the source
domain's DNS record, DKIM uses a public key in a DNS record. That key is then
used to decrypt a token included in an email header sent from your postfix
service. This prevents people from spoofing your IP to pretend they're allowed
to send emails from your domain.

You need to install and configure some extra software alongside postfix to make
postfix sign your outbound emails.


---


# How to use DKIM

## Install DKIM

On Ubuntu 18.04, run this to install opendkim:
```bash
apt-get install -y opendkim opendkim-tools
```



`vi /etc/opendkim.conf`

```bash
Syslog                  yes
UMask                   007
Socket                  local:/var/run/opendkim/opendkim.sock
PidFile                 /var/run/opendkim/opendkim.pid
OversignHeaders         From
TrustAnchorFile         /usr/share/dns/root.key
UserID                  opendkim
AutoRestart             Yes
AutoRestartRate         10/1h
UMask                   002
Syslog                  yes
SyslogSuccess           Yes
LogWhy                  Yes
Canonicalization        relaxed/simple
ExternalIgnoreList      refile:/etc/opendkim/TrustedHosts
InternalHosts           refile:/etc/opendkim/TrustedHosts
KeyTable                refile:/etc/opendkim/KeyTable
SigningTable            refile:/etc/opendkim/SigningTable
Mode                    s
PidFile                 /var/run/opendkim/opendkim.pid
SignatureAlgorithm      rsa-sha256
UserID                  opendkim:opendkim
Socket                  inet:12301@localhost
```

### Create the SigningTable and KeyTable files

```bash
mkdir -p/etc/opendkim/keys
cd /etc/opendkim
chmod 0600 /etc/opendkim/keys
```

Now create the *signing table*:


```text
*@example.com     sendonly._domainkey.example.com
```
