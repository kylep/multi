title: Authenticating with AWS IAM in AWS API Gateway
summary: Enabling IAM authentication on API Gateway and building a client
slug: aws-api-gateway-iam
category: cloud
tags: AWS, API Gateway, Python
date: 2020-01-21
modified: 2020-01-21
status: published
image: aws.png
thumbnail: aws-thumb.png


**This post is linked to from the [AWS: Deep Dive Project](/aws.html)**

---

[TOC]

---

In this post we allow registered IAM users with a given policy access to an
API Gateway endpoint. The API Gateway is front-ending another Lambda function
with privileged access.

---

# Build an API Gateway resource

## Build a Lambda function for it to run

Open the lambda console and create a function. Here's an example python
function that says hello to whoever sent the authenticated request.

```python
def lambda_handler(event, context):
    """ run a hello function """
    body = 'NO HTTP METHOD'
    if 'httpMethod' in event and event['httpMethod'] == 'POST':
        request_body = event['body']
        request_user = event['requestContext']['identity']['userArn']
        body = f'{request_user} sent a POST with body: {request_body}'
    elif 'httpMethod' in event and event['httpMethod'] == 'GET':
        request_user = event['requestContext']['identity']['userArn']
        body = f'{request_user} sent a GET'
    return {
        'statusCode': 200,
        'body': json.dumps(body)
    }
```


## Define the API

1. Go to the [API Gateway Console](https://ca-central-1.console.aws.amazon.com/apigateway/)
1. Create
1. Protocol: REST
1. New API
1. API Name: `<name>`
1. Endpoint type: Regional
1. Create API

Create a method:

1. Actions
1. Create Method
1. POST
1. Check mark
1. Integration Type: Lambda Function
1. Use Lambda Proxy Integration: Checked
1. Lambda Region: ca-central-1
1. Lambda Function: HelloWorld

Enable IAM Authorization

1. Click Method Request
1. Set authorization to `AWS_IAM`



# IAM Setup

## Create Policy

Collect the ARN of the API Gateway. Click your endpoint, then the method.
The ARN will display under Method Request in the Method Execution diagram.

Navigate to the IAM console and create a new policy.

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "execute-api:Invoke"
            ],
            "Resource": [
								"arn:aws:execute-api:ca-central-1:850047500507:42mydti3lg/*/POST/*"
            ]
        }
    ]
}
```

## Bind policy to a user

Here's how I do it:

1. Open the IAM console
1. If you don't have a group yet, make one
1. Attach the policy to the group
1. Attach the group to a user

Collect the key and key ID of that user.


# Test the API in Postman

Postman is nice since you know it works, and it natively handles building the
AWS request headers. It's the easiest way I know to run a one-off test of your
API.

Install [Postman](https://www.getpostman.com/).

1. New > Request - fill in some names.
1. Set the request type to POST
1. Enter the URL
1. Enter any request data
1. Go to the Authorization tab and choose AWS signature
1. Enter the key and key ID from your IAM user
1. Set the region, in my case ca-central-1
1. Send

You should get a valid response from your API. If you skip any of the
authorization steps you'll get an error instead.


# Execute the API from Python

End users don't use postman. Usually they'd be using JavaScript, and in my case
they use Python to access my API. This was **really complicated**.

[Here's an open source library that can do it](https://github.com/DavidMuller/aws-requests-auth).

I've written my own version of this for the Breqwatr deployment tool. I didn't
want to depend on the above link. Also I tried to rewrite the client as
functions with the hope of making it easier to read.

You can find it in [Breqwatr's GitHub](https://github.com/breqwatr/breqwatr-deployment-tool)
under `lib/aws`.

Here's the high level flow of how it gets the auth header:

```python
def get_authorization_header(time, key_id, secret_key, region, method, host,
                             body, uri, query):
    """ Return an aws authorization header """
    # canonical request is a multi-line string with a particular format
    canonical_headers = get_canonical_headers(host, time)
    payload_hash = get_payload_hash(body)
    canonical_request = get_canonical_request(
         method=method,
         uri=uri,
         query=query,
         canonical_headers=canonical_headers,
         payload_hash=payload_hash)
    # create a string-to-sign from the canonical requests' digest
    cr_digest = hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()
    credential_scope = get_credential_scope(time, region)
    string_to_sign = get_string_to_sign(time, credential_scope, cr_digest)
    # sign the String-To-Sign with a signing key derived from secret iam key
    signing_key = get_signing_key(secret_key, time, region)
    signature = get_signature(signing_key, string_to_sign)
    # return the headers all in one string
    return (
        f'AWS4-HMAC-SHA256 Credential={key_id}/{credential_scope}, '
        f'SignedHeaders=host;x-amz-date, '
        f'Signature={signature}')
```









