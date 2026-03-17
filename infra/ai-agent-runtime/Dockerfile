FROM mcr.microsoft.com/playwright:v1.58.2-noble

# System packages (some may already exist in Playwright base; apt is idempotent)
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    python3 \
    python3-pip \
    bash \
    curl \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# GitHub CLI
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
    | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

# Claude Code CLI + Playwright MCP
RUN npm install -g @anthropic-ai/claude-code @playwright/mcp

# Python MCP dependencies
RUN pip install --no-cache-dir --break-system-packages "mcp[cli]>=1.2.0" "httpx>=0.27.0"

# OpenCode binary
ARG OPENCODE_VERSION=0.0.55
RUN curl -fsSL "https://github.com/opencode-ai/opencode/releases/download/v${OPENCODE_VERSION}/opencode-linux-x86_64.tar.gz" \
    | tar -xz -C /usr/local/bin opencode

# Use pwuser (UID 1000) from Playwright base image
RUN mkdir -p /workspace && chown pwuser:pwuser /workspace

# Bake in onboarding bypass for headless Claude Code execution
RUN mkdir -p /home/pwuser/.claude && \
    echo '{"hasCompletedOnboarding":true}' > /home/pwuser/.claude.json && \
    chown -R pwuser:pwuser /home/pwuser/.claude /home/pwuser/.claude.json

WORKDIR /workspace
USER pwuser
ENTRYPOINT ["/bin/sh"]
