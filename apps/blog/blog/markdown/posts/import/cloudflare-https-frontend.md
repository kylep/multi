title: CloudFlare HTTPS CDN
summary: Using Cloudflare to provide HTTPS to an HTTP static site
slug: cloudflare-https
category: development
tags: cloudflare
date: 2019-12-02
modified: 2019-12-02
status: published
image: Cloudflare.png
thumbnail: Cloudflare-thumb.png


**This post is linked to from the [Blog Website Project](/blog-website.html)**

---


This static website is hosted using Google Cloud Storage, which is great except
that it doesn't support HTTPS. There's no really good excuse to not support
HTTPS on a website today.

To close that gap, CloudFlare can handle the HTTPS negotiation for you and it
takes no time at all to set up.


# Configure HTTPS in CloudFlare

This guide assumes CloudFlare is already acting as a CDN for your site.

1. Go to the CloudFlare DNS page and find the A record or CNAME for your FQDN
1. Ensure that the cloud icon is yellow and not grey, indicating that the CDN
   is in use and not bypassing CloudFlare.
1. Click on the padlock labelled SSL/TLS
1. Go to the Overview tab
1. Select Flexible.... Basically that's it, you're good.
   HTTPS is now running on your site. CloudFlare is a really great product!
   There's more that can be done, though.
1. Go to the Edge Certificates tab
1. Set "Always Use HTTPS" to On

In my testing the "Always Use HTTPS" redirect change didn't take effect
immediately. After about 15 minutes 301's were coming back as expected.

```text
vagrant@dev-env:~/$ curl -i http://kyle.pericak.com
HTTP/1.1 301 Moved Permanently
Date: Tue, 03 Dec 2019 00:52:25 GMT
Transfer-Encoding: chunked
Connection: keep-alive
Cache-Control: max-age=3600
Expires: Tue, 03 Dec 2019 01:52:25 GMT
Location: https://kyle.pericak.com/
Server: cloudflare
CF-RAY: 53f18ecdec10b677-YWG
```

[You can find more details and official documentation here.](https://support.cloudflare.com/hc/en-us/articles/204144518)
