title: CodePipeline: Continuous Delivery to AWS ECR
summary: Automatically rebuild and deploy docker images on AWS
slug: aws-codepipeline-ecr
category: cloud
tags: AWS, Docker, CICD, CodePipeline, CodeCommit, CodeBuild
date: 2020-01-15
modified: 2020-01-15
status: published
image: aws.png
thumbnail: aws-thumb.png


**This post is linked to from the [AWS: Deep Dive Project](/aws.html)**

---


# Workflow

1. Commit code to AWS CodeCommit
1. CloudWatch rule triggers CodePipeline
1. CodePipeline uses CodeBuild to build the Docker image
1. CodePipeline pushes the image to ECR


---


# Deploy Code to CodeCommit

1. Open [CodeCommit](https://ca-central-1.console.aws.amazon.com/codesuite/codecommit/repositories).
1. Create a repository
1. Go to your IAM page and edit your user.
    1. Look for "HTTPS Git credentials for AWS CodeCommit"
    1. click Generate Credentials
    1. Save your credentials.
1. Grab the HTTPS URL for your repository and `git clone` it. Use your new
   credentials.
1. Commit your code (including a Dockerfile) to the CodeCommit repository.


---


# Write buildspec.yml

AWS CodeBuild will look for a `buildspec.yml` file to dictate its actions.
This is where we define how the image will be built. Put it in your CodeCommit
project's root directory.

Here's mine. This will build a docker image and tag it with a timestamp, then
push it to ECR as the timestamp and latest. The variables are defined inside
the build as Environment Variables.

```yml
# buildspec.yml
version: 0.2

phases:
  install:
    runtime-versions:
      docker: 18
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - $(aws ecr get-login --no-include-email --region ca-central-1)
      - IMAGE_TAG=$(date +%Y.%m.%d.%I.%M)
  build:
    commands:
      - echo Build started on `date`
      - echo "Building the Docker image."
      - docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
      - docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:latest
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:latest
```


---


# Define the Pipeline

## Cloud Build Role

**Bad Practice Alert**: These steps don't apply the principal of least
privilege. You should lock down your role to be allowed to do only the minimum
that it needs to do.

1. In the IAM page, create a new role.
1. It will be used by CodeBuild.
1. Assing the following policies (again, more than it needs)
    - CloudWatchLogsFullAccess
    - AWSCodeBuildAdminAccess
    - AmazonS3FullAccess
    - AmazonEC2ContainerRegistryFullAccess
    - AWSCodeCommitFullAccess
1. Name: Assign a name, such as `CloudBuild-Admin`


## Define CloudBuild project

1. Navigate to the [CloudBuild Console](https://ca-central-1.console.aws.amazon.com/codesuite/codebuild/projects)
1. Create build project
1. No build badge
1. Source provider: CodeCommit
1. Choose your repository
1. Choose your branch
1. Managed Image
1. Operating System: Ubuntu
1. Runtime: Standard
1. Image: aws/codebuild/standard:3.0
1. Image version: latest
1. Environment type: Linux
1. Privileged: true
1. Service Role: Existing service role. Use the one you just made.
1. Allow CodeBuild to modify this role: False (we gave it admin)
1. Additional Configuration - Environment variables (click Add to get more)
		- IMAGE_REPO_NAME: (your image name)
		- AWS_ACCOUNT_ID: (your numeric AWS account iD)
		- AWS_DEFAULT_REGION: ca-central-1
1. Buildspec: Use a buildspec file
1. Artifacts: No artifacts
1. Logs: Give a group and stream name for CloudWatch
1. Create Build Project


Now test the build by clicking "Start build". It should create your image.
You'll need to disable artifacts.

Once the build works and your image is pushed successfully to ECR, you can move
on to setting up a pipeline so this happens automatically.



## Create Pipeline Role

**Bad Practice Alert**: These steps don't apply the principal of least
privilege. You should lock down your role to be allowed to do only the minimum
that it needs to do.

1. In the IAM page, create a new role.
1. It will be used by CodeBuild.
1. Assing the following policies (again, more than it needs)
    - CloudWatchLogsFullAccess
    - AWSCodeBuildAdminAccess
    - AmazonS3FullAccess
    - AmazonEC2ContainerRegistryFullAccess
    - AWSCodeCommitFullAccess
1. Name: Assign a name, such as `CloudBuild-Admin`


## Define the pipeline

1. Open the [CodePipeline console](https://ca-central-1.console.aws.amazon.com/codesuite/codepipeline/pipelines)
1. Click Create Pipeline
1. Name the pipeline
1. Service Role: New service role
1. Role Name: Pick a name
1. Allow AWS CodePipeline to create a role
1. Next
1. Source Provider: AWS CodeCommit
1. Repository Name: Select the repository name
1. Branch name: master
1. Change detection: Amazon CloudWatch Events
1. Next
1. Build Provider: AWS CodeBuild
1. Region: Canada (Central)
1. Project Name: Create Project
    1. Project Name: Choose a name
    1. Description: Add a description
    1. Environment image: Managed Image
    1. Operating System: Ubuntu
    1. Runtimes: Standard
    1. Image: aws/codebuild/standard:3.0
    1. Image version: Always use the latest
    1. Environment type: Linux
    1. Privileged: True
    1. Service Role: New service role
    1. Role Name: default name is fine
    1. Advanced Configuration - Environment variables (click Add to get more)
        - IMAGE_REPO_NAME: (your image name)
        - AWS_ACCOUNT_ID: (your numeric AWS account iD)
        - AWS_DEFAULT_REGION: ca-central-1
    1. Build specifications: Use a buildspec file
    1. Buildspec name: Leave it blank so it uses buildspec.yml
    1. CloudWatch logs: True
    1. Group name: pick a name
    1. Stream name: pick a name
    1. S3 logs: false
    1. Continue to CodePipeline
1. Next
1. Skip deploy stage, pushing to ECR is enough
1. Create pipeline

This will re-run the build that you tested before. It should pass again.
