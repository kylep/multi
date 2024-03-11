title: Using GCP's Datastore from Cloud Functions
summary: Reading and writing Datastore entries from Google Cloud Functions
slug: gcp-datastore-from-functions
category: gcp
tags: gcp, api
date: 2019-10-14
modified: 2019-10-14
status: draft


Google Cloud Platform's Datastore is a NoSQL (non-relational)
database-as-a-service product. You can access it [here](https://console.cloud.google.com/datastore/).

As far as I can tell, its the cheapest database offering Google provides for
small applications.

For the record, I prefer relational databases. Every time I use non-relational
databases other than in ELK for logs, I end up treating it like a relational
database anyways. It looks like Google doesn't offer a relational DBaaS product
other than ones that spin up whole VMs though, which doesn't fit my primary
goal of minimizing costs.

If you've never used Cloud Functions, consider checking out my [earlier post](/gcp-cloud-functions),
where I create a simple Hello World function.

I've also written [another post](/gcp-datastore-python) showing how to interact
with GCP's Datastore from python outside of Cloud Functions.


---


# Build a Cloud Function


