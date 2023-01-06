FROM ubuntu:jammy


# Poetry is pinned because ubuntu:jammy is not PEP440 compliant, newer Poetry releases and Canonical
# disagree about it...

RUN rm -rf export.sh \
 && apt-get update \
 && apt-get install -y \
      software-properties-common \
 && add-apt-repository -y ppa:deadsnakes/ppa \
 && apt-get update \
 && apt-get install -y \
      curl \
      nginx \
      jq \
      vim \
      tmux \
      npm \
      python3.10 \
      python-is-python3 \
      python3-pip \
 && pip install \
      httpie \
      poetry==1.1.15

ADD ./ /app
WORKDIR /app

# Inject the image's filesystem files
COPY image-files /

# Build the client
RUN cd /app/client \
 && npm install \
 && npm run build

# Build the API, client, CLI
# purposefully omitting poetry's --no-dev option, this image is sometimes the dev env
RUN poetry config virtualenvs.create false \
 && poetry install

