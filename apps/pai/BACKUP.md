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

You drive these steps from your workstation. Expects `gcloud`
installed and authed against your Google account.

### 1. Create the bucket

```bash
# Pick whatever bucket name you want — must be globally unique.
BUCKET="kp-pai-memory-backups"
PROJECT_ID=$(gcloud config get-value project)

gcloud storage buckets create "gs://${BUCKET}" \
  --project="${PROJECT_ID}" \
  --location=us-central1 \
  --default-storage-class=COLDLINE \
  --uniform-bucket-level-access
```

### 2. Set the 365-day lifecycle rule

```bash
cat > /tmp/lifecycle.json <<'EOF'
{
  "lifecycle": {
    "rule": [
      {
        "action": {"type": "Delete"},
        "condition": {"age": 365}
      }
    ]
  }
}
EOF

gcloud storage buckets update "gs://${BUCKET}" \
  --lifecycle-file=/tmp/lifecycle.json
```

### 3. Create a service account scoped to writes only

```bash
SA_EMAIL="pai-backup@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create pai-backup \
  --project="${PROJECT_ID}" \
  --display-name="Pai memory backup writer"

# storage.objectCreator: can create new objects in the bucket only.
# Cannot read existing objects, list, delete, or touch other buckets.
gcloud storage buckets add-iam-policy-binding "gs://${BUCKET}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/storage.objectCreator"
```

### 4. Generate a JSON key

```bash
gcloud iam service-accounts keys create /tmp/pai-backup-key.json \
  --iam-account="${SA_EMAIL}"
```

### 5. Stash the key + bucket name in Vault

```bash
GCS_KEY_FILE=/tmp/pai-backup-key.json \
GCS_BACKUP_BUCKET="${BUCKET}" \
  /Users/kp/gh/multi/infra/ai-agents/bin/store-secrets.sh

# Securely shred the local key file when done.
rm -P /tmp/pai-backup-key.json
```

This populates `secret/ai-agents/gcs` with `key` (the JSON) and
`bucket` (the name).

### 6. Apply the cronjob

If pai-m1 environment is set in your helmfile rotation, the next
`helmfile sync` picks up the new template and the new RBAC. The
`paiMemoryBackup.enabled: true` is already set in
`environments/pai-m1.yaml`. Confirm:

```bash
kubectl -n ai-agents get cronjob pai-memory-backup
```

### 7. Verify the first run manually

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

Then verify in GCS:

```bash
gcloud storage ls "gs://${BUCKET}/$(date -u +%Y-%m-%d)/"
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
