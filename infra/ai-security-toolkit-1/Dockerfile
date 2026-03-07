FROM aquasec/trivy:0.69.3 AS trivy
FROM zricethezav/gitleaks:v8.30.0 AS gitleaks

FROM python:3.12.13-alpine

RUN apk upgrade --no-cache && apk add --no-cache nodejs git gcc musl-dev

COPY --from=trivy /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=gitleaks /usr/bin/gitleaks /usr/local/bin/gitleaks

RUN pip install --no-cache-dir semgrep

COPY .trivyignore /workspace/.trivyignore

RUN addgroup -S scanner && adduser -S scanner -G scanner
RUN mkdir -p /workspace && chown scanner:scanner /workspace

WORKDIR /workspace
USER scanner
ENTRYPOINT ["/bin/sh"]
