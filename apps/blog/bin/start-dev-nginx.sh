#!/bin/bash
docker run --name blogdev -it -v $(pwd)/blog/out/:/usr/share/nginx/html -p 8080:80 --rm nginx:latest
