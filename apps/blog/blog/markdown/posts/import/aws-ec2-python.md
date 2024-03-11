title: Create & Terminate EC2 Instances from Python
summary: Creating and destroying VMs on EC2 from Python
slug: aws-ec2-python
category: cloud
tags: AWS, EC2, Python
date: 2020-01-09
modified: 2020-01-09
status: published
image: aws.png
thumbnail: aws-thumb.png


**This post is linked to from the [AWS: Deep Dive Project](/aws.html)**


# Create & Terminate an EC2 Instance from Python

The IAM user tested for this task has the `AmazonEC2FullAccess` policy.

## Create

Before you begin, determine the following:

- Image AMI: The example I provide here works, it's for Ubuntu 18.04 in Canada
- Security group name
- Instance name
- Instance type

```python
import boto3

key_id = 'XXXXXXXXXXXXXX'
key_secret = 'XXXXXXXXXXXXXXXXXXXXXXXXXXX'

session = boto3.Session(
    aws_access_key_id=key_id,
    aws_secret_access_key=key_secret)

# Define the VM properties
image_id='ami-0d0eaed20348a3389' # bionic ca-central LTS
instance_name='Test9'
security_group_name = 'SupportService'
instance_type = 't2.micro'

# Put the properties into the expected format
tag_spec = [{
    'ResourceType': 'instance',
    'Tags': [{
        'Key': 'Name',
        'Value': instance_name }]}]
security_groups=[security_group_name]

# Reserve the instance
ec2_client = session.client('ec2')
reservation = ec2_client.run_instances(
        ImageId=image_id,
        MinCount=1,
        MaxCount=1,
        InstanceType=instance_type,
        KeyName='bwsupport',
        TagSpecifications=tag_spec,
        SecurityGroups=security_groups )

# Now the VM is creating. Optionally you can wait and inspect the instace
instance_data = reservation['Instances'][0]
iid = instance_data['InstanceId']
print(f'Reserved instance "{instance_name}" as {iid}. Waiting until running.')
ec2_resource = session.resource('ec2')
instance = ec2_resource.Instance(iid)
instance.wait_until_running()
state = instance.state['Name']
print(f'Instancei {iid} is {state} - Public IP: {instance.public_ip_address}')
```

## Terminate

You can use the same code as above to get the `instance` variable.
From there, it's this easy:
```python
instance.terminate()
instance.wait_until_terminated()
```
