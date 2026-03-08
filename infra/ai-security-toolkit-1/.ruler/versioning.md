# Image Versioning

When rebuilding this Docker image, bump the version tag in
`docker-compose.yaml`. Update any references to the old tag in
`.ruler/security.md` and the blog post at
`apps/blog/blog/markdown/posts/ai-security-toolkit.md`, then run
`ruler apply` to propagate the change.
