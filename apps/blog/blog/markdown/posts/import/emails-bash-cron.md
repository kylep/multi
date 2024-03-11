title: Scheduled Availability Email Alerts
summary: Sending cron-scheduled ping failure alerts using a bash script
slug: emails-bash-cron
category: systems administration
date: 2019-08-18
modified: 2019-08-18
status: published
image: clock.png
thumbnail: clock-thumb.png


**This post is linked to from the [Automated Emails Project](/project-email.html)**

---


This post covers how to create a bash script that runs every minute to send an
email when a ping fails.

You could use [Pingdom](https://www.pingdom.com/) but there's no need to pay
someone else if you have compute resources available. Also, this works from
inside your local network, so it can ping [RFC1918](https://tools.ietf.org/html/rfc1918)
addresses.

This script watches for ICMP (ping) availability.
You can replace the ping command with a netcat call to watch a port, or run
whatever other test you like.


---

[TOC]

---


# Building the Alert Tool

Before you begin, consider [setting up a local send-only postfix service](/emails-postfix-ubuntu).


## Test the mail command

Emails in this script will send using the `mail` command. Make sure it works
before continuing.


```bash
echo "Test alert please ignore" | mail \
    -a "FROM:noreply@alerts.example.com" \
    -s "Test alert" \
    alerts@example.com
```


## Create the bash script

Create a directory to place the script.

```bash
mkdir -p /etc/cronjobs && cd /etc/cronjobs
chmod +x ping_alert.sh
```

Create the script. Here's a commented example of one I wrote:

`vi ping_alert.sh`
```bash
#!/usr/bin/env bash

# Positional arguments. If debug is set to '1', debug will echo to stdout
target_ip=$1
debug_enabled=$2

# debug function for troubleshooting
function debug () {
    if [[ "$debug_enabled" == "1" ]]; then
        echo $1
    fi
}

# The token file will be written when an email has been sent, and ensure that
# another email doesn't get sent again too soon. This helps prevent your emails
# from being marked as SPAM and is also way less annoying.

token_file='/etc/cronjobs/.email_sent'
sent_recently=false
now_ts=$(date +%s)
if [ -f $token_file ]; then
    file_ts=$(cat $token_file)
    # hour_in_seconds defined how long between emails to wait before another
    # can be sent.
    hour_in_seconds=3600
    hour_from_file_ts=$(($file_ts+$hour_in_seconds))
    if [[ $now_ts -le $hour_from_file_ts ]]; then
        sent_recently=true
    fi
fi

# The script will gracefully exit if its within the cooldown window.
if [[ $sent_recently == true ]]; then
    debug "sent recently, exiting. Check $token_file"
    exit
fi

# Ping the target IP and collect the return code. If the return code is 0 then
# the ping was OK and this script will exit.
debug "Pigning $target_ip..."
ping -c 1 $target_ip >/dev/null
if [[ $? == 0 ]]; then
    debug "ping ok, exiting"
    exit
fi

# Since the script hasn't exited, the ping failed. Send the warning email.
debug "Sending warning email"
msg="Warning: Ping to IP $target_ip failed."
echo $msg | mail \
    -a  "FROM:noreply@alert.example.com" \
    -s "Test alert" \
    alerts@example.com

# Update the token file to reset the cooldown.
debug "Writing new timestamp $now_ts"
# Write the new timestamp
echo $now_ts > $token_file
```

Make the script executable:

```bash
chmod +x ping_alert.sh
```

Give the script a test run against a valid and invalid IP. It should send an
email for the invalid IP but not the valid one.

```
# test that should pass
/etc/cronjobs/ping_alert.sh 1.1.1.1
# test that should fail
/etc/cronjobs/ping_alert.sh 10.2.3.4
```


---


# Create cron job

We'll run this script every minute. Since it has a cool-down timer it won't
send spam.

This example will ping [Cloudflare's DNS](https://new.blog.cloudflare.com/announcing-1111/),
`1.1.1.1`, so replace the IP with one that you actually watch to watch.

`vi /etc/crontab`
```
# Keep whatever is currently there
*  *    * * *   root    /etc/cronjobs/ping_alert.sh 1.1.1.1 0 | tee -a /var/log/ping_alert.log
```

### Restart Cron to apply the changes
```
systemctl restart cron
```

Now the job will run every minute, and send emails at most every hour.
