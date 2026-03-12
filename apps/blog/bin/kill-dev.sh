#!/bin/bash
echo "Stopping dev server..."
pkill -f "next dev" 2>/dev/null || true
echo "Done."
