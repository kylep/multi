title: Free HTTPS Certs with LetsEncrypt's Certbot
summary: Installing and using certbot from LestEncrypt to get a free HTTPS cert
slug: certbot
category: systems administration
tags: HTTPS
date: 2020-01-13
modified: 2020-01-13
status: published
image: LetsEncrypt.png
thumbnail: LetsEncrypt-thumb.png



# Getting the certificate

So far as I can tell, certbot works in the following way:

1. Certbot is executed from the web-server CLI, and told to download a cert for
   an FQDN. Let's say it's getting a cert from `example.com`.
1. Certbot opens up a port, I think 443, and listens for requests from the
   LetsEncrypt service.
1. Certbot calls out to LetsEncrypt's service, letting the service know it's
   listening on `example.com` and ready to prove it owns that domain.
1. LetsEncrypt sends some secret, or maybe collects some secret from the
   listening certbot service, proving that certbot's server does indeed own
   this domain name.
1. LetsEncrypt signs a cert and makes it available. Certbot downloads the cert
   to the local server.

## Configure DNS

First, ensure that your DNS A record, such as `example.com`, resolves to
the IP address your server is using. This needs to be an internet accessible
IP address, not an internal RFC-1918 address.


## Install Certbot

This guide assumes you're using Ubuntu Server.

```bash
add-apt-repository ppa:certbot/certbot
apt-get update
apt-get install certbot
```

## Download the certificate

Set the `site` variable here to your DNS entry which will point to this server.

```bash
site="example.com"
certbot certonly --standalone --preferred-challenges http -d $site
```

## Use the certificate

You can find the certificates as files on your server.

```bash
> cd /etc/letsencrypt/live/$site
README  cert.pem  chain.pem  fullchain.pem  privkey.pem
```

Copy these certs to your web service and use them like any other cert.

Note that if you want to use these certs for HAProxy, you need to combine
`cert.pem` and `privkey.pem` into a single file.

```bash
cat cert.pem privkey.pem > haproxy-$site.pem
```
