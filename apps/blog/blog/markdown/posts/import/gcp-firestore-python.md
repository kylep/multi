title: Google Cloud Firestore Basics - Python
summary: Reading and writing Firestore entries from local python, and some comparisons with Datastore
slug: gcp-firestore-python
category: cloud
tags: GCP, python
date: 2019-10-14
modified: 2019-10-14
status: published
image: google-firestore.png
thumbnail: google-firestore-thumb.png


**This post is linked to from the [GCP: Deep Dive Project](/gcp.html)**

---

This post covers how to interact with Google's Cloud Firestore, using examples
written in Python. The concepts should apply to any language.

Firestore is the newer version of Datastore. You can find the differences
[here](https://cloud.google.com/firestore/docs/firestore-or-datastore).
In this post, the  database is configured in Native mode.
Other than some extra language support, Native mode's coolest new feature seems
to be the ability to listen to a post. From what I can tell, this could replace
the need for pub/sub in some scenarios.

Throughout the post I'll use a project named "example". Be sure to replace this
with your own project name.


---


# Pricing

Official Firestore pricing data is [here](https://cloud.google.com/firestore/pricing).

**Note that Firestore mode is almost twice the price of Datastore mode.**
Datastore pricing can be found [here](https://cloud.google.com/datastore/pricing).

Every day a number of free operations are allowed, which for a small
application makes Datastore very affordable. Even after the free tier though,
the pricing is pretty good. Firestore and Datastore have the same free tiers.


## Summary of pricing: Datastore vs Firestore

- Storage: $/GB/Month
    - Datastore: 0.108
    - Firestore: 0.180
- Reads: $/100,000
    - Datastore: 0.036
    - Firestore: 0.060
- Writes: $/100,000
    - Datastore: $0.108
    - Firestore: $0.180
- Deletes: $/100,000
    - Datastore: 0.012
    - Firestore: 0.020

Max entity size and document size are both 1MB, so you could realistically just
use JSON strings in entities instead to save money if you don't need any of
Firestore's other features.


---


# Datastore/Firestore Concepts

Both options use a non-relational/NoSQL database. NoSQL databases in general
allow for the direct serialization of a programs objects/dictionaries.


## Firestore

[Official Firestore data model docs](https://cloud.google.com/firestore/docs/data-model)

Firestore uses a document database organized into documents and collections.
This is a change from the older Datastore model of Entities organized by Kinds.

Documents support nested data structures ("Maps"). Think of them like JSON
objects, but with more types supported. Documents are limited to 1MB each.

Documents are stored in Collections.
Collections are containers for documents, like a filesystem's directories.
Documents can also contain their own nested collections, which store other
documents. Nesting has a depth limit of 100.

Documents are identified by References. In python, a reference looks like
this:

```python
collection('collection1').document('document1')
```


## Datastore
In Datastore, objects are called Entities. The key-value data pairs stored by
entities are called properties.

Entities are uniquely identified by keys.
Entity Keys consists of the following components:

- *Namespace*: Basically a tenant identifier, like a user ID. By default, the
  namespace is an empty string. Any entity created as a "child" will inherit
  its parent's namespace.
- *Kind*: A string describing the category or purpose of the entity.
- *Identifier*: Unlike namespace and kind which are shared between like
  entities, the identifier is unique to each entity. This is either a string
  called a "key name", or an integer numeric ID.
- *Ancestor Path*: An optional component of the key, identifying its parents to
  form a database hierarchy.


---



# Create IAM Service Account

Before your code can access Datastore/Firestore, access needs to be configured
in the [Identity Access Management](https://console.cloud.google.com/iam-admin)
tool.

First, create a [Service Account](https://console.cloud.google.com/iam-admin/serviceaccounts):

1. Open the Service Account page
1. Select your project
1. Click "Create Service Account"
1. Service Account Details:
    1. Service account name: `PythonDatastoreAdmin`
    1. Service account ID: `pythondatastoreadmin`
    1. Service account description: SA with Full Datastore Access for Python
1. Grant this service account access to project (optional)
    1. Select a role: Datastore > Cloud Datastore Owner
    1. Continue
1. Grant users access to this service account (optional)
    1. Download a key file for Python to use. Use JSON as the key type.
    1. Done

I downloaded my key to `$HOME/gcp_keys/datastore_admin.json`


---


# Python Environment Setup

Build a virtualenv. If you're in a git repo, don't forget to ignore this
directory.

```bash
python3 -m venv env3
source env3/bin/activate
```

Write the requirement file

`vi requirements.txt`

```text
google-cloud-firestore
```

Install the requirements

```bash
pip install -r rqeuirements.txt
```


---


# Python Code Examples

A fake project name of "example" will be used. Be sure to use a valid one.

Some notes about the Firestore python API:

- `firestore.client().collection` returns a [CollectionReference](https://googleapis.dev/python/firestore/latest/collection.html),
  which allows you to operate on the named collection.
- `firestore.client().collection().list_documents` returns a [Page Iterator](google.api_core.page_iterator.GRPCIterator).
  Casting a page iterator to a list will trigger a read operation, returning a
  list of `DocumentReference` objects.
- `firestore.client().collection().document` returns
  a [DocumentReferece](https://googleapis.dev/python/firestore/latest/document.html),
  which interacts with the actual Firestore documents. The `DocumentReference`
  object can operate (get/set/create) on the actual Document.
- `firestore.client().collection().document().get()` will return
  a [DocumentSnapshot](https://developers.google.com/android/reference/com/google/firebase/firestore/DocumentSnapshot)
  of the document. The document snapshot is how you read data from a document.
  Document snapshots are a representation of the document state taken at the
  instant of their creation.
- `firestore.client().collection().document().create()` makes a new document.
  If the object already  existed, a `google.api_core.exceptions.AlreadyExists`
  exception is thrown.
- Write operations (create & set) return a [WriteResult](https://cloud.google.com/firestore/docs/reference/rest/v1/WriteResult).


```python
from os import environ
from google.cloud import firestore

# The key file is an exported JSON file from the IAM tool
key_file_path = '{}/gcp_keys/datastore_admin.json'.format(environ['HOME'])

# When running this on a local system, the cloud.google package from GCP
# expects the GOOGLE_APPLICATION_CREDENTIALS environment variable to be set
# to the exported IAM key file's path
environ['GOOGLE_APPLICATION_CREDENTIALS'] = key_file_path

# google.cloud.datastore.Client expects the project name as an argument
project = 'example'

# Instantiate the datastore client. This step authenticates to GCP.
# See the Credential Error note below if authentication fails
client = firestore.Client(project)

# Get a reference to the test collection. This returns a
# google.cloud.firestore_v1.collection.CollectionReference object
ref_col_test = client.collection('test')

# Get a reference to a document which may or may not exist. This returns a
# google.cloud.firestore_v1.document.DocumentReference object
ref_doc_document1 = ref_col_test.document('document1')

# Perform the actual database query to get the document. get() returns a
# google.cloud.firestore_v1.document.DocumentSnapshot object.
snapshot_document1 = ref_doc_document1.get()

# Note that there is no data
assert document1.to_dict() is None

# You can use document.exists to check if the document already exists.
# Here's an example of doing a safe insert of some sample data:
sample_data = {
    'nums': {'num1': 100, 'num2': 200},
    'strs': {'animal1': 'dog', 'animal2': 'cat'}}
if snapshot_document1.exists is False:
    createe_write_result = ref_doc_document1.create(sample_data)

document1_data = ref_doc_document1.get().to_dict()

# Finally, update the data
sample_data['strs']['animal3'] = 'bird'
set_write_result = ref_doc_document1.set(sample_data)

# List the documents in the collection. The iterator returns a paginated list
# of document references. You can then operate on those references.
doc_list_iterator = ref_col_test.list_documents()
doc_ref_list = list(doc_list_iterator)
sample_document_snapshot = doc_ref_list[0].get()

# Show that the changes were applied to the data. This will return 'bird'
animal3 = sample_document_snapshot.to_dict()['strs']['animal3']
```


## Troubleshooting

### Credentials Error

If your local google cloud authentication isn't set up correctly, you'll get an
error saying:

```text
google.auth.exceptions.DefaultCredentialsError: Could not automatically determine credentials. Please set GOOGLE_APPLICATION_CREDENTIALS or explicitly create credentials and re-run the application. For more information, please see https://cloud.google.com/docs/authentication/getting-started
```

If that happens, review the IAM Service account steps.


### Iterator has already started

If you try and cast a `GRPCIterator` to list twice, you get a `ValueError`.

```text
ValueError: ('Iterator has already started', <google.api_core.page_iterator.GRPCIterator object)
```

The `ValueError` is thrown because `._started` is `True` in the iterator. It has
already done its thing and won't work again. I didn't see any good way to
restart the iterator without discarding it.
You can see the details in the [page iterator source code](https://github.com/googleapis/google-cloud-python/blob/master/api_core/google/api_core/page_iterator.py).

Best course is just to get a new iterator from the reference object.
See in the following example how the ID changes. The `doc_list_iterator` var is
being pointed at a new iterator. The old iterator gets gc'd by Python as usual.

```
>>> id(doc_list_iterator)
4422123408
>>> doc_list_iterator = ref_col_test.list_documents()
>>> id(doc_list_iterator)
4422123472
```

It will work as expected.
