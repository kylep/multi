title: Ubuntu: Blindly Trusting the Corporate CA
summary: Trusting a CA-signed certificate from a companies firewall on Ubuntu
slug: ubuntu-trust-corporate-ca
category: systems administration
tags: Ubuntu, HTTPS
date: 2020-01-08
modified: 2020-01-08
status: published
image: gear.png
thumbnail: gear-thumb.png


**Note:** This is usually a bad idea. You should really get the team who runs
the CA to send you the certificate in case some *bad guy* is doing the MITM and
not the local security team. Use this procedure with caution.


---

# Get the signing certificate

Use `openssl` to print the certificate data.

```bash
openssl s_client -connect google.com:443 -showcerts
```
In the output you'll see, among other things, some certificates.
They look like this:

```text
-----BEGIN CERTIFICATE-----
blaBLAbla
-----END CERTIFICATE-----
```

Find the one signed by your local CA. Copy and paste it into a new file,
such as `example.com.crt`. The `.crt` file extension is required.
Don't copy anything before or after the BEGIN and END lines.


---


# Trust the certificate

As root, move the certificate file to `/usr/local/share/ca-certificates`,
then run `update-ca-certificates`.

```bash
mv example.com.crt /usr/local/share/ca-certificates
update-ca-certificates
```

That's it. Now your system will trust certs signed by that CA too.
