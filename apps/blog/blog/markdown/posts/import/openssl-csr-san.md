title: Creating a CSR with a SAN - openssl
summary: Certs aren't valid without SubjectAltName (SANs) now, openssl makes it hard
slug: openssl-csr-san
category: systems administration
tags: https, openssl
date: 2020-10-20
modified: 2020-10-20
status: published
image: gear.png
thumbnail: gear-thumb.png


Normally when I need to make a CSR, I would use `openssl` to generate one like you'll see all over the internet:

```bash
openssl req -new -key example.com.key -out example.com.csr
```

This generates a CSR and asks you to provide the Common Name (URL) of your site.


Recently I've noticed that certs from the above CSR don't work. 
From some research, Chrome's version 58 (2017) is when it changed, so I guess it took me a while to catch on.


Using the CommonName (CN) instead of SubjectAltName (SAN) in your cert was deprecated in RFC 2818 (forever ago). 
For a long time for browsers didn't enforce that requirement and could fall back to CN, but it seems like that allows homograph attacks 
(fake "a" in apple.com, for instance), where the SAN field somehow does not.

Even if you add and trust the issuing and root CA certs, Chrome will still throw `ERR_CERT_COMMON_NAME_INVALID`.

Generating a CSR with a SAN is not intuitive. Unless you want to use heredoc, you need to create a file first.

- The `req_distinguished_name` values set the prompts during the CSR questionairre. 
- The DNS.x values are the SAN entries. If you have one URL, then commonName and DNS.1 will match, and you'll have no others (no DNS.2, ect).

`vi san.ini`

```
[ req ]
default_bits       = 2048
distinguished_name = req_distinguished_name
req_extensions     = req_ext

[ req_distinguished_name ]
C = Country Name (2 letter code)
ST = State or Province Name (full name)
L = Locality Name (eg, city)
O = Organization Name (eg, company)
OU = Organization Unit (eg, IT)
CN = Common Name (server FQDN)

[ req_ext ]
subjectAltName = @alt_names

[alt_names]
DNS.1 =
DNS.2 =
DNS.3 =
```

Now with this file and your private key in hand, you can create your CSR:

```bash
# Set the name of your domain
domain=
# Generate the private key and CSR
openssl req -new -newkey rsa:2048 -nodes -keyout $domain.key -out $domain.csr -config san.ini
```

Check your work:

```bash
openssl req -in $domain.csr -noout -text
```

That's it. Send the CSR off to the CA admin or whoever carves out your certificates.
