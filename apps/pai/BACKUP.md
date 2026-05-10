# Pai Memory Backup

Nightly K8s CronJob that snapshots `/data/` from the running
pai-responder pod to a Google Cloud Storage bucket. Runs at 04:00 UTC
(midnight EDT).

## Architecture

```
04:00 UTC nightly
  ↓
pai-memory-backup CronJob (ai-agents ns)
  ↓ kubectl exec pai-responder -- tar -czf - /data
  ↓ gcloud storage cp - gs://<bucket>/YYYY-MM-DD/data.tar.gz
  ↓ stdout JSON → Vector → OpenObserve k8s_logs
  ↓ Discord #status-updates only on failure
```

No PVC remount. The cron pod has `pods/exec` RBAC on
`pai-responder` and streams the tarball directly through
`kubectl exec` stdout into `gcloud storage cp -`.

## Cost ballpark

At ~1 MB per nightly snapshot × 365 day retention ≈ 365 MB stored.
At Coldline pricing (~$0.004/GB-month) that's roughly **$0.0015 per
month**. The 5 GB GCS free tier covers it 14× over. Egress is
zero unless you actually restore.

## Failure handling and self-improvement loop

The script logs structured JSON to stdout with `log_level` set
explicitly:

- `info` for normal progress
- `error` for any failure step

Vector parses container stdout and ingests it into OpenObserve's
`k8s_logs` stream. The `pai-self-improver` cron already mines
that stream for recurring failures (3+ recurrences in 24h
threshold) and files Linear proposals when it sees a pattern. So a
sporadic backup failure goes to Discord; a recurring one becomes
a Linear issue automatically through the self-improvement loop.

On failure the script also posts a 🔴 message to
`#status-updates` with the run id and reason. Silence on success.

## One-time setup

The bucket, service account, IAM binding, lifecycle rule, and
service-account key are all declared in `apps/pai/tf/backup.tf`.
You drive Terraform-the-config-language via OpenTofu from your
workstation. The `tofu` CLI ships from the `opentofu` brew package
in the mac-setup Ansible playbook (re-run
`ansible-playbook infra/mac-setup/playbook.yml` if it's missing).
Also expects `gcloud auth application-default login` already done.

All paths below are relative to the repo root. The TF lives in
this branch at `apps/pai/tf/`; once it lands on main the same paths
work from there. From a worktree, prefix with the worktree dir
(e.g. `cd .claude/worktrees/openclaw-features` first).

### 1. Apply the Terraform

```bash
cd apps/pai/tf
tofu init
tofu apply
```

Defaults: project `kylepericak`, region `northamerica-northeast1`,
bucket `kp-pai-memory-backups`, retention 365 days, storage class
COLDLINE. Override with `-var bucket_name=...` if the default name
is taken globally.

### 2. Push the key + bucket name into Vault

The Terraform state holds the service-account key. Pipe it through
to Vault without touching disk:

```bash
# Run from the same apps/pai/tf directory.
GCS_KEY_B64=$(tofu output -raw key_b64) \
GCS_BACKUP_BUCKET=$(tofu output -raw bucket_name) \
  ../../../infra/ai-agents/bin/store-secrets.sh
```

`store-secrets.sh` walks every secret bucket; for the ones already
populated it shows `[Already set]` and accepts an empty answer. The
GCS section reads the env vars without prompting.

### 3. Apply the K8s manifests

```bash
cd ../../../infra/ai-agents   # repo-root-relative: infra/ai-agents
helmfile sync
```

The `paiMemoryBackup.enabled: true` is already set in
`environments/pai-m1.yaml`. Confirm the CronJob and RBAC landed:

```bash
kubectl -n ai-agents get cronjob pai-memory-backup
kubectl -n ai-agents get role pai-pod-exec
kubectl -n ai-agents get rolebinding pai-pod-exec
```

### 4. Verify the first run manually

```bash
kubectl -n ai-agents create job pai-memory-backup-test \
  --from=cronjob/pai-memory-backup
kubectl -n ai-agents logs -f -l job-name=pai-memory-backup-test
```

You should see structured JSON like:

```json
{"ts":"2026-05-10T04:00:01Z","log_level":"info","agent":"pai-memory-backup","run_id":"a1b2c3d4","message":"[INFO] starting backup run"}
{"ts":"2026-05-10T04:00:08Z","log_level":"info","agent":"pai-memory-backup","run_id":"a1b2c3d4","message":"[INFO] source pod=pai-responder-xxx"}
{"ts":"2026-05-10T04:00:14Z","log_level":"info","agent":"pai-memory-backup","run_id":"a1b2c3d4","message":"[INFO] backup ok target=gs://.../data.tar.gz size_bytes=4823"}
```

Then verify in GCS (from `apps/pai/tf`):

```bash
gcloud storage ls "gs://$(tofu output -raw bucket_name)/$(date -u +%Y-%m-%d)/"
```

### Rotating the service-account key

From `apps/pai/tf`:

```bash
tofu taint google_service_account_key.pai_backup
tofu apply
# then re-run step 2 above to push the new key into Vault.
```

## Restoring from a backup

If the PVC ever gets corrupted or the pod loses /data:

```bash
# Pull the most recent backup.
gcloud storage cp "gs://${BUCKET}/2026-05-10/data.tar.gz" /tmp/pai-restore.tar.gz

# Scale pai-responder down, copy the tarball into the PVC via a
# debug pod, untar it, scale back up.
kubectl -n ai-agents scale deployment/pai-responder --replicas=0

kubectl -n ai-agents run pai-restore --rm -it --restart=Never \
  --image=alpine:3 \
  --overrides='{"spec":{"containers":[{"name":"pai-restore","image":"alpine:3","stdin":true,"tty":true,"volumeMounts":[{"name":"data","mountPath":"/restore"}]}],"volumes":[{"name":"data","persistentVolumeClaim":{"claimName":"pai-state"}}]}}' \
  -- sh
# inside the pod:
#   tar -xzf /tmp/pai-restore.tar.gz -C /
# (cp the tarball in via `kubectl cp` first)

kubectl -n ai-agents scale deployment/pai-responder --replicas=1
```

(Yes that's clunky; if it ever actually happens we'll write a proper
restore script.)

## Bumping the cloud-sdk image

The CronJob uses `google/cloud-sdk:528.0.0` pinned. Bump
deliberately. Run a security scan when you bump:

```bash
docker run --rm -v "$(pwd):/workspace:ro" --user root \
  -v /var/run/docker.sock:/var/run/docker.sock \
  kpericak/ai-security-toolkit-1:0.2 \
  -c "trivy image --severity HIGH,CRITICAL google/cloud-sdk:NEW_VERSION"
```
