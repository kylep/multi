FROM kpericak/base:1.0.0

ADD ./ /app
WORKDIR /app

# Build the API/CLI image
# purposefully omitting poetry's --no-dev option, this image is sometimes the dev env
RUN poetry config virtualenvs.create false \
 && poetry install

