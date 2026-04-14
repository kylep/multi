#!/bin/bash
echo "Stopping llm-client dev server..."
pkill -f "next dev.*--port" 2>/dev/null || true
echo "Done."
