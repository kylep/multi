title: Transfer Domain from GoDaddy to Cloudflare
summary: How I moved my main domain from GoDaddy to Cloudflare, making life easier.
slug: dns-xfer-godaddy-cloudflare
category: systems administration
date: 2019-08-8
modified: 2019-08-8
status: published
image: Cloudflare.png
thumbnail: Cloudflare-thumb.png


I owned some domain names that used godaddy.com as their registrar. With
Godaddy it takes **forever** for changes to propagate, which can be a real
problem when you need to update TXT records.

Cloudflare is awesome in that they're really affordable for domains, have
really nice CDN capabilities, don't charge you for "protection", and their DNS
changes replicate super fast.

Here's how to move a domain from Godaddy to Cloudflare.

# Steps

## Unlock the Domain

1. Log into Godaddy
1. Go to [My Domains](https://dcc.godaddy.com/domains/) and select your domain
1. Click "Edit" next to `Domain lock: On` to show the slider. Set it to "off".


## Get your transfer authorization code

1. Log into Godaddy
1. Go to [My Domains](https://dcc.godaddy.com/domains/) and select your domain
1. Click 'Transfer domain away from GoDaddy'
1. Continue with transfer
1. Skip whatever annoying ads they give you
1. Go to your email and get your registration code


## Transfer the Domain to Cloudflare

If you haven't added your site yet, add it now in Cloudflare. You need to add
the nameserver settings too before you can transfer it. This tripped me up,
since I hadn't redirected the nameservers from GoDaddy's default ones to
Cloudflare's yet.

1. From Cloudflare's dashboard, go to Domain Registration
2. It should let you choose your domain here. If it says there are none
   available, you haven't set up your existing domain with them yet.
3. Enter your auth code, click Confirm Authorization Codes
4. Fill out the contact info, Confirm and Finalize Transfer

That's it, your domain is now transferred to Cloudflare


# References

- [Cloudflare transfer guide](https://developers.cloudflare.com/registrar/transfer-instructions/godaddy/)
- [GoDaddy unlock for xfer](https://ca.godaddy.com/help/unlock-my-domain-for-transfer-410)

