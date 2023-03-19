FROM kpericak/base:1.0.0

ADD ./ /app
WORKDIR /app

# Inject the image's filesystem files
COPY image-files /

# Build the client
RUN cd /app \
 && npm install \
 && npm run build
