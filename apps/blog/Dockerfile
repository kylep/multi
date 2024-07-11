# gcr.io/kylepericak/nodejs:latest
FROM ubuntu:noble
WORKDIR /app
COPY . /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
         git \
         nodejs \
    && rm -rf /var/lib/apt/lists/* \