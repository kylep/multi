"""Shared pytest fixtures for pai-responder tests."""

import sys
from pathlib import Path

# Make helm/files/ importable from tests
HELM_FILES = Path(__file__).resolve().parent.parent / "helm" / "files"
sys.path.insert(0, str(HELM_FILES))
