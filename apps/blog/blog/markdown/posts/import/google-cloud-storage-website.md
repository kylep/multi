title: Google Cloud Storage: Website Hosting
summary: How to host a static website using Google Cloud Storage buckets.
slug: google-cloud-storage-website
tags: GCP
category: cloud
date: 2019-08-09
modified: 2019-08-09
status: published
image: google-cloud-storage.png
thumbnail: google-cloud-storage-thumb.png


**This post is linked to from the [Blog Website Project](/blog-website)**

**This post is linked to from the [GCP: Deep Dive Project](/gcp.html)**

---

Google Cloud Storage has a feature where storage buckets can be used as a cost
effective web server. It can only host static sites, but that works just fine
for anything with all the logic on the client side.

Hosting a static website using Cloud Storage is **extremely affordable**.

This site is using this approach for hosting.

[The official documentation can be found here](https://cloud.google.com/storage/docs/hosting-static-website).

---


[TOC]


---


# Pricing

[Find the latest pricing data from Google here](https://cloud.google.com/storage/pricing).

Google doesn't seem to actually charge for the static website hosting feature
of Cloud Storage. Instead, it just bills you for the storage usage. Notable is
that the operation usage cost will be far higher, and the data storage cost far
lower than in a typical Cloud Storage use case.

These prices are rough and there are lots of edge cases:

- **Data Storage**: Free for the first 5GB, which will cover basically any
  website. After that it's around  $0.026 US / GB / Month.
- **Network Egress**: Around $0.12/ GB
- **Operations**: This one will be higher. Every file served is an operation.
  This includes the .html files, each image, the .css files, and so on. A CDN
  such as [Cloudflare](https://dash.cloudflare.com/) can help reduce the number
  of read operations. After the first 50,000 free reads, Cloud Storage will
  charge $0.004 / 10,000 operations.

As you can see, for anything but hugely popular sites this will usually work
out to *almost free*.


---


# Add the Domain to Google Search Console

A DNS TXT record containing a special string needs to be assigned to the domain
name that will be applied to the storage bucket. This is used to confirm
ownership of the domain.

**To add the domain to the search console:**

1. Open the [Google Search Console](https://search.google.com/search-console/welcome)
1. Enter your domain name
1. Copy the TXT record they gave you and apply it to your domain. In Cloudflare
   you go to your site, click DNS, Add Record, TXT. For kyle.pericak.com I used
   `kyle` as the "Name" and the string from Google as the "Content". TTL Auto.
1. Go back to the search console page and verify
1. Click the link to go to your domain

The domain name can now be bound to a Cloud Storage bucket.

**Note:** I had a really hard time doing this with GoDaddy. The TXT change
would not propagate even after over 24 hours. I transferred my domain to
[Cloudflare](https://cloudflare.com/). Their updates apply basically right
away!

See also: [How I transferred the domain from GoDaddy to Cloudflare](/dns-xfer-godaddy-cloudflare).


---

# Link the Domain Name to Your Storage Bucket

## Update DNS CNAME Record

Update the subdomain CNAME record to point to Google's API URL.
In Cloudflare I made a CNAME entry for `kyle.pericak.com` that looked like
this:

- Name: `kyle`
- Content: `c.storage.googleapis.com`

## Create a Storage Bucket with Matching Name

Go to the [Google Cloud Storage Browser](https://console.cloud.google.com/storage/browser).
Click Create Bucket up at the top.

1. Enter your FQDN in the bucket name. For example, I used `kyle.pericak.com`
1. Location Type: Region
1. Location: northamerica-northeast1
1. Storage Class: standard
1. Access Control: Per-object (not bucket-only)
1. Encryption: Google managed keys
1. Create

The storage bucket now exists and is ready to host the static content.


## Configure Storage Bucket for Access Control & Index File

### Update Cloud Storage Bucket Permissions

Permit everyone to read the website files from Cloud Storage:

1. From the sidebar go Storage
1. Click the 3 dots to the right of this storage bucket
1. Edit Bucket Permissions
1. New Members: `allUsers`
1. Add the role `Storage Object Viewer`


### Configure index.html as the MainPageSuffix

Cloud Storage doesn't know where the page root is by default. Define it:

1. Click on the 3 dots to the right of the bucket name
1. Click Edit Website Configuration
1. Main page: index.html


### Set the default ACL for the bucket

If this isn't done then the website will show XML with an error stating
`Anonymous caller does not have storage.objects.list access`.

**Option 1: Using gsutil:**

```bash
gsutil defacl ch -u AllUsers:R gs://kyle.pericak.com
```

**Option 2: From the web UI:**

1. Open [console.cloud.google.com/storage/](https://console.cloud.google.com/storage/).
1. Go to the bucket named after the domain
1. Permissions
1. The permissions can be modified here.


---


# Push Site Content to Cloud Storage

While its possible to manually upload each file using the web UI, it would be
super tedious.

Run the `gsutil rsync` module to upload files at all once.
 Note that `$dst_url` is pointing at my domain-associated cloud storage bucket.

```bash
# -r    recurse - sync directories
# -c    compare checksums instead of mtime
# -d    Delete extra files under dst_url not found under src_url
src_url="./output"
dst_url="gs://kyle.pericak.com"
gsutil -m rsync -r -c -d $src_url $dst_url
```
