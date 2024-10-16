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

# The build context needs to be the base of the repo so I can get the link
# to the git ref in the footer. That's also why I add the safe.directory to the git
# config. Let docker-compose handle it: docker-compose up --build
COPY .git /app/.git
RUN git config --global --add safe.directory /app

# This is in its own layer because troubleshooting it in the build is a nuisance
# The build was freezing on npm install when building on my mac arm64 for amd64,
# so verbose and maxsockets were added. Seems to have helped.
# The rm -rf node_modules slows this WAY down (~5s to ~40s), avoids intermitten issues.
RUN cd blog \
    && rm -rf node_modules \
    && npm install --verbose --maxsockets=1
