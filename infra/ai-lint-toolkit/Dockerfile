FROM hadolint/hadolint:v2.14.0-alpine AS hadolint
FROM ghcr.io/terraform-linters/tflint:v0.61.0 AS tflint

FROM alpine:3.21

SHELL ["/bin/ash", "-o", "pipefail", "-c"]

ARG RUFF_VERSION=0.15.5
ARG BIOME_VERSION=2.4.6
ARG TARGETARCH

RUN apk upgrade --no-cache

COPY --from=hadolint /bin/hadolint /usr/local/bin/hadolint
COPY --from=tflint /usr/local/bin/tflint /usr/local/bin/tflint

# ruff: Python linter (Rust binary)
RUN if [ "$TARGETARCH" = "arm64" ]; then RUFF_ARCH="aarch64"; else RUFF_ARCH="x86_64"; fi \
    && wget -qO- "https://github.com/astral-sh/ruff/releases/download/${RUFF_VERSION}/ruff-${RUFF_ARCH}-unknown-linux-musl.tar.gz" \
    | tar xz --strip-components=1 -C /usr/local/bin

# biome: JS/TS linter (Rust binary)
RUN if [ "$TARGETARCH" = "arm64" ]; then BIOME_ARCH="linux-arm64-musl"; else BIOME_ARCH="linux-x64-musl"; fi \
    && wget -qO /usr/local/bin/biome \
    "https://github.com/biomejs/biome/releases/download/%40biomejs%2Fbiome%40${BIOME_VERSION}/biome-${BIOME_ARCH}" \
    && chmod +x /usr/local/bin/biome

RUN addgroup -S linter && adduser -S linter -G linter
RUN mkdir -p /workspace && chown linter:linter /workspace

WORKDIR /workspace
USER linter
ENTRYPOINT ["/bin/sh"]
