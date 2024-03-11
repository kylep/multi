title: AWS Lambda: Basics
summary: Basics of creating a simple API-driven AWS Lambda function
slug: aws-lambda
category: cloud
tags: AWS, Lambda
date: 2020-01-08
modified: 2020-01-08
status: published
image: aws-lambda.png
thumbnail: aws-lambda-thumb.png


**This post is linked to from the [AWS: Deep Dive Project](/aws.html)**

---

This post covers the basics of using AWS Lambda functions.

[TOC]

---


# Pricing

For the most accurate data, see the [official pricing documentation](https://aws.amazon.com/lambda/pricing/).


Lambda charges you for each request invocation, and also for how long the
request took to run. These prices are probably in USD.

- **Region**: Canada (Central)
- **Requests**: $0.20 / 1M Requests, or $0.0000002 / Request
- **Duration (General)**: $0.000016667 for every GB-second
- **Duration (128MB)**: $0.00000208/sec, or ~$0.0075/hour.
  I think if it as 3/4 of a cent per hour.


---


# Hello World Lambda Function

## Create the function

1. In your browser, open the AWS console [Lambda Page](https://console.aws.amazon.com/lambda).
1. Click the orange Create Function button
1. Author from scratch
1. Function name: HelloWorld
1. Runtime: Python 3.7
1. Permissions: Create a new role with basic lambda permissions
1. click Create Function on the bottom right


## Define a test event

1. In the dropdowns along the top, one is called "Select a test event".
1. Click it, and choose Configure test events
1. Event template: Hello World
1. Event name: `HelloWorldTest1`
1. Enter some sample data and click Create.

**Sample Data**:
```JSON
{
  "body": "{\"name\": \"Test User\"}"
}
```


## Write the function code

Click on the orange lambda icon with the text "HelloWorld" to open the
"Function code" form. Expand it to full screen (button on top right) so the
Save and Test buttons appear along the top.

Write your Hello World function. This was the shortest one I could come up with
that wouldn't throw 500's if you called it with the wrong data.

```python
import json

def lambda_handler(event, context):
    name = 'UNDEFINED'
    if 'body' in event:
        try:
            ebody = json.loads(event['body'])
            name = ebody['name']
        except:
            pass
    greeting = f'Hello {name}!'
    body = json.dumps(greeting)
    return {
        'statusCode': 200,
        'body': body
    }
```

Click Save, then Test. You should get a response with body `'Hello TestUser'`.


## Define a trigger

1. Click the "+ Add trigger" button.
1. API Gateway
1. REST API
1. Security: Open (in this case)
1. Additional Settings: Leave the defaults


Now if you click on the purple API Gateway button it will open the API Gateway
form. In there, you can get the URL. Copy the link address.

### Test the API

From bash:

```bash
curl \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"name": "MyName"}' \
  https://wg8p74asah.execute-api.us-east-1.amazonaws.com/default/HelloWorld
```

It should reply "Hello MyName".

## ...What are layers?

Prominently displayed beneath the function's name in the Designer form
is a button to manage Layers.

[Here's their official documentation](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html).

Layers are dependencies like archives and libraries.
Any one function can use up to 5 of them, and they have a 250MB limit.
They land in `/opt` when extracted.

We don't need layers for this Hello World app.
