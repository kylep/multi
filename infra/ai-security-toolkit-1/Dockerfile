FROM aquasec/trivy:latest AS trivy
FROM zricethezav/gitleaks:latest AS gitleaks

FROM python:3.12-alpine

RUN apk add --no-cache nodejs npm git gcc musl-dev

COPY --from=trivy /usr/local/bin/trivy /usr/local/bin/trivy
COPY --from=gitleaks /usr/bin/gitleaks /usr/local/bin/gitleaks

RUN pip install --no-cache-dir semgrep

WORKDIR /workspace
ENTRYPOINT ["/bin/sh"]
