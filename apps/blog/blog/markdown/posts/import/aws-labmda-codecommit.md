title: AWS CodeBuild CICD - Deploy to Lambda
summary: Testing and automatically deploying lambda functions using CodeBuild
slug: aws-labmda-cicd
category: cloud
tags: AWS, Lambda, Python, CodeBuild
date: 2020-01-27
modified: 2020-01-27
status: published
image: aws.png
thumbnail: aws-thumb.png


**This post is linked to from the [AWS: Deep Dive Project](/aws.html)**

---


This post is a follow-up to my [authenticated API Gateway post](/aws-api-gateway-iam.html).

I've written a Lambda function and presented it using API Gateway. The API
uses Amazon's AIM keys for authentication. The next step is to write the code
to source control (AWS CodeBuild Git) and have it automatically deploy.

**Note**: [This official guide on AWS](https://docs.aws.amazon.com/lambda/latest/dg/build-pipeline.html)
is really good, and I copied big parts it. I use Python instead of
JavaScript in this post, and include my own experience while following the
guide.

---

[TOC]

---


# Create an S3 Bucket

Open the [S3 Console](https://s3.console.aws.amazon.com/s3/) and create a
bucket to store your build artifacts.


---





---


# Commit your function to source control

I'm using a dedicated repository on AWS CodeCommit to store the code, and
Python3 for the language. Here's a very simple Lambda function I use for
testing:

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


---


# Define an AWS SAM template

## Write the template file

This was my first time using AWS SAM, so consider these my observations and not
necessarily fact.

SAM stands for Serverless Application Model.

- [SAM Reference Page](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-resource-function.html)
- [API Event type](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-property-function-api.html)
- [What is SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [SAM Specification](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/sam-specification.html)

The fields I've changed from Amazon's example for this post:

- **Description** - string describing the serverless application. This
  description will be attached to the CloudFormation stack.
- **Resources.[resourceName]** - self-defined resource, my function.
  The resource is a Lambda function because it's type is
  `AWS::Serverless::Function`
- **Handler** - Which method will run in the function
- **Runtime** - The language to be used
- **CodeUri** - Path to my file defining the function
- **Resource.[resourceName].Events[eventName]** - Name of the event which
  triggers the function.
- **Resource.[resourceName].Events[eventName].path** - path for the URL

```yaml
# template.yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Sample Continuously deploy function
Resources:
  TestCicdFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: cicd-test.lambda_handler
      Runtime: python3.8
      CodeUri: ./cicd-test.py
      Events:
        TestCicdAPI:
          Type: Api
          Properties:
            Path: /Test
            Method: GET
```

## Test the template

Install the AWS SAM CLI application.

```bash
pip install --user aws-sam-cli
```

Build the package and upload it to your S3 bucket. From your project
root, set your bucket name then run the following.

```bash
# Set the bucket name first
BUCKET=''

aws cloudformation package \
  --template-file template.yml \
  --s3-bucket $BUCKET \
  --output-template-file outputtemplate.yml
```

The package command will upload your python file to S3 and output a new
template file with the S3 path replacing the `CodeUri`.

```text
Uploading to <ID>  381 / 381.0  (100.00%)
Successfully packaged artifacts and wrote output template to file outputtemplate.yml.
Execute the following command to deploy the packaged template
aws cloudformation deploy --template-file /home/vagrant/arcus-lambda/outputtemplate.yml --stack-name <YOUR STACK NAME>
```

Now deploy it. Since there's no CloudFormation stack created yet, I make a new
one named `test-cicd-lambda`. Note that in the above command output, the
example they give for deploy is wrong. You need to include the
`--capabilities CAPABILITY_IAM` argument for this template too.

```bash
aws cloudformation deploy \
  --capabilities CAPABILITY_IAM \
  --template-file /home/vagrant/arcus-lambda/outputtemplate.yml \
  --stack-name test-cicd-lambda
```

The application is now deployed.

- Stack is visible in the  [CloudFormation console](https://ca-central-1.console.aws.amazon.com/cloudformation)
- API is created in the [API Gateway console](https://ca-central-1.console.aws.amazon.com/apigateway/)
- Function is created in the [Lambda console](https://ca-central-1.console.aws.amazon.com/lambda/).
  The function also has an Application page in the web console now.


---


# Create a CodeBuild Project

I recently did a whole post on this [here](/aws-codepipeline-ecr.html), so I'm
going to be light on the details. Head over to that post to fill in any blanks.
In that post I was building Docker images and pushing them to ECR. This is
similar, except we push python files to Lambda instead.


## Write the buildspec.yml

Put this in the project root, it defines what CodeBuild will do. We'll use an
environment variable for the `BUCKET` definition.

If you're not sure what to pick for a runtime, check [this list](https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-available.html).

```yaml
# buildspec.yml
version: 0.2
phases:
  install:
    runtime-versions:
        python: 3.8
  build:
    commands:
      - aws cloudformation package --template-file template.yml --s3-bucket $BUCKET --output-template-file outputtemplate.yml
artifacts:
  type: zip
  files:
    - template.yml
    - outputtemplate.yml
```

Commit the file to source control.


## Create a role for CodeBuild

I use the role I defined for CodeBuild in my previous post. It's a bit overly
permissive but it works. Other than the policies which get created
automatically, mine has these:

- `AWSCodeCommitFullAccess`
- `AmazonEC2ContainerRegistryFullAccess`
- `AmazonS3FullAccess`
- `CloudWatchLogsFullAccess`
- `AWSCodeBuildAdminAccess`


## Define the build project

1. Open the [CodeBuild console](https://ca-central-1.console.aws.amazon.com/codesuite/codebuild/)
1. Create build project
1. Name the build and give it a description
1. Source: Add your repository
1. Environment
    1. Managed Image
    1. Operating system: Ubuntu
    1. Runtimes: Standard
    1. Image: the newest one
    1. Environment type: Linux
    1. Privileged: False
		1. Service Role: Existing role - choose the one you made above
    1. Additional Configuration - environment variables
        - name: BUCKET
        - value: Your bucket name
1. Buildspec: use buildspec file
1. Artifacts: no artifacts
1. Logs: set a group name for CloudWatch
1. Create build project


Test the build before moving on and make sure it works.


---


# Create a Pipeline

## Create IAM Policy for CodeDeploy

Open the IAM console and create a new policy.
Define the policy using the following JSON.
These wildcards will cover everything you need, though it might be a bit
permissive.

```json
{
    "Statement": [
        {
            "Action": [
                "apigateway:*",
                "codedeploy:*",
                "lambda:*",
                "cloudformation:CreateChangeSet",
                "iam:GetRole",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:PutRolePolicy",
                "iam:AttachRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:DetachRolePolicy",
                "iam:PassRole",
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:GetBucketVersioning"
            ],
            "Resource": "*",
            "Effect": "Allow"
        }
    ],
    "Version": "2012-10-17"
}
```


## Create IAM Role for CodeDeploy

In the role wizard of the IAM page:

1. Create role
1. Trusted Entity: `CloudFormation`
1. Permissions:
    1. `AWSLambdaExecute`
    1. Your new policy created above
1. Role Name: assign a name



## Create the Pipeline

When code is committed, you want CodeBuild to run and re-deploy your serverless
application.

1. Open the [CodePipeline console](https://ca-central-1.console.aws.amazon.com/codesuite/codepipeline/pipelines)
1. Click Create Pipeline
1. Name the pipeline
1. Service Role: Create a new service role for the pipeline. AWS will set sane
   permissions for it, no special role is needed. I like to have a consistent
   naming convention as you end up with a ton of IAM entities after a while.
1. Role Name: Pick a name
1. Allow AWS CodePipeline to create a role
1. Next
1. Source Provider: AWS CodeCommit
1. Repository Name: Select the repository name
1. Branch name: master
1. Change detection: Amazon CloudWatch Events
1. Next
1. Build Provider: AWS CodeBuild
1. Project Name: Choose the project you just made
1. Next
1. Deploy Provider: AWS CloudFormation
1. Action Mode: Create or replace a change set
1. Stack Name: choose a name. I used the one from the test above.
1. Change Set Name: choose a name
1. Template:
    - Artifact name: `BuildArtifact`
    - File name: `outputtemplate.yml`
1. Capabilities: `CAPABILITY_IAM`
1. Role Name: The role you defined for CodeDeploy above
1. Next
1. Create Pipeline


That should do it. Now whenever you push code to your master branch, the
serverless application will re-deploy.

