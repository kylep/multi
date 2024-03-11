title: IAM Auth for Lambda
summary: Authenticating specific Lambda functions for use from Python
slug: aws-lambda-iam
category: cloud
tags: AWS, Lambda, Python
date: 2020-01-09
modified: 2020-01-09
status: published
image: aws-lambda.png
thumbnail: aws-lambda-thumb.png


**This post is linked to from the [AWS: Deep Dive Project](/aws.html)**

---

This post covers how to restrict access to a Lambda function using AWS IAM
roles. It builds on the function written [in my last post](/aws-lambda.html)

---

[TOC]

---


**A note about API Gateway**:
To me, the intuitive way to do this was to make an API in API Gateway and turn
the IAM authentication on for it. That went well until I tried to actually use
the API from curl with authentication enabled. It's not apparent how to derive
`Signature` HTTP header from your key id and secret key.
Also, in Python I didn't see any good client libraries. Instead I chose
to just directly use boto3 with Lambda and skip the REST API entirely. If you
know how to do this, *please let me know*!


---


# Create a policy for your lambda function

## Get the ARN of your function

Navigate to your function in the AWS Lambda Console. On the top right, the ARN
is displayed. Copy it, you'll use it in the policy.


## Create the policy

Open the IAM Console and create a new policy.
The JSON looks like this. Note the ARN copied from the Function.

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "LambdaInvokeHelloWorld",
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction",
                "lambda:InvokeAsync"
            ],
            "Resource": "arn:aws:lambda:ca-central-1:850047500507:function:HelloWorld"
        }
    ]
}
```

Name the policy and assign it to your user. This user should have a Key ID and
Secret Key.


---


# Invoke Lambda from Python

Note that the payloads are in byte format.

```python
import json
import boto3

key_id = 'XXXXXXXXXXXXXXXXX'
key_secret = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXX'

session = boto3.Session(
    aws_access_key_id=key_id,
    aws_secret_access_key=key_secret)

client = session.client('lambda')

body = {'name': 'Kyle'}
payload = str.encode(json.dumps(body))
response = client.invoke(FunctionName='HelloWorld', Payload=payload)
print(response['Payload'].read())
```

If the user identified by that key has the above permission, they'll be able
to execute this function. Otherwise they'll get a nice permissions error.
