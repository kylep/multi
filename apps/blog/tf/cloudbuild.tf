provider "google" {
  project = "kylepericak"
  region  = "northamerica-northeast1"
}

resource "google_cloudbuild_trigger" "blog_merge_to_main" {
  name = "apps-blog-trigger"
  github {
    owner = "kylep"
    name  = "multi"
    push {
      branch = "^main$"
    }
  }
  filename = "apps/blog/cloudbuild.yaml"
  included_files = ["apps/blog/**"]
}

