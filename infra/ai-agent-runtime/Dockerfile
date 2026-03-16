FROM node:22-alpine

# hadolint ignore=DL3018
RUN apk upgrade --no-cache && apk add --no-cache \
    git \
    python3 \
    bash \
    curl \
    openssh-client

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install Python dependencies for MCP servers (discord)
# hadolint ignore=DL3018
RUN apk add --no-cache py3-pip \
    && pip install --no-cache-dir --break-system-packages "mcp[cli]>=1.2.0" "httpx>=0.27.0"

# Install OpenCode binary
ARG OPENCODE_VERSION=0.0.55
RUN curl -fsSL "https://github.com/opencode-ai/opencode/releases/download/v${OPENCODE_VERSION}/opencode-linux-x86_64.tar.gz" \
    | tar -xz -C /usr/local/bin opencode

# Use existing node user (uid 1000) from base image
RUN mkdir -p /workspace && chown node:node /workspace

WORKDIR /workspace
USER node
ENTRYPOINT ["/bin/sh"]
