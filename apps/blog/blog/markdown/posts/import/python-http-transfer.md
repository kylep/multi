title: Transferring files to Windows through Python's SimpleHTTPServer
summary: Using SimpleHTTPServer to transfer files to Windows without a file-share or SCP
slug: python-http-transfer
category: systems administration
tags: Python
date: 2020-03-06
modified: 2020-01-13
status: published
image: python.png
thumbnail: python-thumb.png


# Problem Description

You need to transfer files to a locked down Windows server from a Linux server.
Sure, you could carve out a file-share. There's an easier way for a one-off
transfer.

This is a bit of an edge-case since newer Windows systems come with SCP
installed, but the image I needed to transfer to had it disabled. Older
versions like Server 2012 also don't support SCP without extra software.



# Hosting files with Python's web server

Make a directory and move your file into it. In my case, I'm transferring the
CloudBase-Init setup package.

**Note**: If you use the package itself inside either a python script or
an interactive Python session you can change things like the listen IP and
port. Using `python -m` is just easier.

```bash
# Move the file to a directory where it's the only thing there
mv CloudbaseInitSetup_1_1_0_x64.msi http/

# Change to that directory
cd http

# Start the web server. It will listen on 0.0.0.0:8000 by default.
python -m SimpleHTTPServer
```

# Downloading the file

Now the file can be downloaded from your Linux server. In your Windows system,
open Internet Explorer and navigate to the Linux IP address. Don't forget to
add the `:8000` to specify the port. From here you can easily download the
file. Be sure to close the server (`CTRL+c`) when you're done.
