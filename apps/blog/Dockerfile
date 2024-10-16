# gcr.io/kylepericak/kylepericakdotcom:latest
FROM ubuntu:noble
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
         nodejs \
         npm \
         git \
    && rm -rf /var/lib/apt/lists/*

COPY apps/blog/ /app/
# Note: The build context needs to be the base of the repo so I can get the link
# to the git ref in the footer. That's also why I add the safe.directory to the git
# config. Let docker-compose handle it: docker-compose up --build
COPY .git /app/.git
RUN cd blog \
    && git config --global --add safe.directory /app \
    && npm install
