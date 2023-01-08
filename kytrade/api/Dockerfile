FROM kpericak/

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

