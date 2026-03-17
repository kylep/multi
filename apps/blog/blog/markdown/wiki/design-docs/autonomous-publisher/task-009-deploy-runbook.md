---
title: "TASK-009: Build, Deploy, and End-to-End Test"
status: draft
date: 2026-03-17
---

# TASK-009: Build, Deploy, and End-to-End Test

Status: **Ready for deployment**

All code changes from TASK-001 through TASK-008 are complete. This runbook covers building, pushing, deploying, and verifying the autonomous publisher system.

## Step 1: Build and push runtime image

```bash
cd infra/ai-agent-runtime
docker build -t kpericak/ai-agent-runtime:0.3 .
docker push kpericak/ai-agent-runtime:0.3
```

## Step 2: Build and push controller image

```bash
cd infra/agent-controller
docker build -t kpericak/agent-controller:0.6 .
docker push kpericak/agent-controller:0.6
```

## Step 3: Update controller image tag in values.yaml

Bump `controller.image.tag` from `"0.5"` to `"0.6"` in `infra/agent-controller/helm/values.yaml`.

## Step 4: Patch secrets

```bash
kubectl -n ai-agents patch secret agent-secrets --type merge -p '{
  "stringData": {
    "CLAUDE_CODE_OAUTH_TOKEN": "<token>",
    "GITHUB_TOKEN": "<pat>",
    "DISCORD_WEBHOOK_URL": "<url>"
  }
}'
```

## Step 5: Helm upgrade

```bash
helm upgrade agent-controller infra/agent-controller/helm/ -n ai-agents
```

## Step 6: Verify controller is running

```bash
kubectl -n ai-agents rollout status deployment/agent-controller
kubectl -n ai-agents logs -l app.kubernetes.io/name=agent-controller --tail=20
```

## Step 7: Journalist regression test

Trigger a journalist run and confirm it still works with the new image and network policy.

## Step 8: Publisher end-to-end test

```bash
curl -X POST http://localhost:8080/webhook \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"agent":"publisher","prompt":"Write a blog post about autonomous AI agent pipelines in Kubernetes","runtime":"claude"}'
```

## Step 9: Verification checklist

- [ ] Job pod created in ai-agents namespace
- [ ] Publisher run completes (job succeeds)
- [ ] Branch pushed, PR created on GitHub
- [ ] Discord notification received
- [ ] Blog post builds and renders (check PR)
- [ ] Claude.ai usage dashboard shows Max billing
- [ ] Network policy active (from debug pod: `curl -s https://api.anthropic.com` works, `curl -s http://192.168.1.1` blocked)
