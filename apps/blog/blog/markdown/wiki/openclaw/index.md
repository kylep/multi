---
title: "OpenClaw"
summary: "Self-hosted AI agent platform running on macOS and Kubernetes. Connects to Telegram for chat interface and supports custom skills."
keywords:
  - openclaw
  - ai-agent
  - self-hosted
  - telegram
  - kubernetes
  - skills
related:
  - wiki/ai-tools
  - wiki/mcp/linear
  - openclaw-mvp
scope: "Covers OpenClaw architecture, deployment, and skill development. Does not cover the underlying LLM providers (see wiki/ai-tools)."
last_verified: 2026-03-10
---


OpenClaw is a self-hosted AI agent that runs on macOS or Kubernetes.
It connects to Telegram as a chat interface and supports custom
skill plugins for task automation.

## Architecture

- Agent runtime on macOS or K3s cluster
- Telegram bot integration for user interaction
- Skill system for extensible capabilities
- LLM backend via OpenRouter or direct provider APIs
