#!/bin/bash
# Copy E2E screenshots to public directory
# This script copies screenshots to public/tests/e2e/screenshots for deployment

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SOURCE_DIR="$PROJECT_DIR/tests/e2e/screenshots/daily"
TARGET_DIR="$PROJECT_DIR/public/tests/e2e/screenshots"

echo "=== Copy E2E Screenshots to Public ==="

# Create target directory
mkdir -p "$TARGET_DIR"

# Check if source exists
if [ ! -d "$SOURCE_DIR" ]; then
    echo "⚠️  Source directory not found: $SOURCE_DIR"
    echo "   Run E2E tests first to generate screenshots"
    exit 0
fi

# Copy all daily screenshots
if [ -d "$SOURCE_DIR" ]; then
    # Copy daily screenshots directory
    cp -r "$SOURCE_DIR" "$TARGET_DIR/daily"
    echo "✅ Copied screenshots to $TARGET_DIR"
    
    # List copied files
    echo "   Files:"
    find "$TARGET_DIR" -type f -name "*.png" | wc -l | xargs -I {} echo "   - {} PNG files"
else
    echo "⚠️  No screenshots found in $SOURCE_DIR"
fi

echo "✅ Screenshot copy complete!"
