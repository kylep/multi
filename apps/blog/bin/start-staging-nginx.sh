#!/bin/bash
echo
echo "http://localhost:8080"
echo
echo
docker run --name blogdev -it -v $(pwd)/blog/out/:/usr/share/nginx/html -p 8080:80 --rm nginx:latest
