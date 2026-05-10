terraform {
  required_version = ">= 1.5"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ----- Inputs -----

variable "project_id" {
  type    = string
  default = "kylepericak"
}

variable "region" {
  type    = string
  default = "northamerica-northeast1"
}

variable "bucket_name" {
  type        = string
  description = "GCS bucket for Pai memory backups. Must be globally unique."
  default     = "kp-pai-memory-backups"
}

variable "retention_days" {
  type        = number
  description = "Days before backed-up objects are deleted by GCS lifecycle."
  default     = 365
}

# ----- Bucket -----

resource "google_storage_bucket" "pai_memory_backups" {
  name                        = var.bucket_name
  location                    = var.region
  storage_class               = "COLDLINE"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  # Safer default. Flip to true if you ever actually want `terraform
  # destroy` to wipe the bucket and its history.
  force_destroy = false

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = var.retention_days
    }
  }
}

# ----- Service account scoped to write-only on this bucket -----

resource "google_service_account" "pai_backup" {
  account_id   = "pai-backup"
  display_name = "Pai memory backup writer"
  description  = "Used by the pai-memory-backup CronJob to upload nightly snapshots."
}

# objectCreator: can create new objects in the bucket only. Cannot read,
# list, delete, or touch any other bucket. The CronJob never needs to
# read its own writes.
resource "google_storage_bucket_iam_member" "pai_backup_writer" {
  bucket = google_storage_bucket.pai_memory_backups.name
  role   = "roles/storage.objectCreator"
  member = "serviceAccount:${google_service_account.pai_backup.email}"
}

# ----- Long-lived JSON key -----
# The key value lives in terraform.tfstate (sensitive). State is local
# by default; keep it gitignored. Rotate by tainting this resource and
# re-applying.

resource "google_service_account_key" "pai_backup" {
  service_account_id = google_service_account.pai_backup.name
  public_key_type    = "TYPE_X509_PEM_FILE"
}

# ----- Outputs -----

output "bucket_name" {
  value = google_storage_bucket.pai_memory_backups.name
}

output "service_account_email" {
  value = google_service_account.pai_backup.email
}

# Sensitive output: only retrievable via `terraform output -raw key_b64`.
# Already base64-encoded; pipe into base64 -d for the raw JSON.
output "key_b64" {
  value     = google_service_account_key.pai_backup.private_key
  sensitive = true
}
