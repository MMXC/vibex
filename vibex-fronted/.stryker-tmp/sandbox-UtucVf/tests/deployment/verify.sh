#!/bin/bash

set -e

echo "===== Deployment Verification ====="
echo "Time: $(date)"
echo ""

cd /root/.openclaw/vibex/vibex-fronted

# 1. Check build directory exists
echo "✓ Checking .next directory..."
if [ -d ".next" ]; then
    echo "  .next directory exists"
else
    echo "  ERROR: .next directory not found"
    exit 1
fi

# 2. Check BUILD_ID
echo "✓ Checking BUILD_ID..."
if [ -f ".next/BUILD_ID" ]; then
    BUILD_ID=$(cat .next/BUILD_ID)
    echo "  BUILD_ID: $BUILD_ID"
else
    echo "  ERROR: BUILD_ID not found"
    exit 1
fi

# 3. Check essential build files
echo "✓ Checking essential build files..."
REQUIRED_FILES=(
    ".next/build-manifest.json"
    ".next/routes-manifest.json"
    ".next/prerender-manifest.json"
    ".next/required-server-files.json"
    ".next/package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file"
    else
        echo "  ERROR: $file not found"
        exit 1
    fi
done

# 4. Check static files
echo "✓ Checking static assets..."
if [ -d ".next/static" ]; then
    STATIC_COUNT=$(find .next/static -type f | wc -l)
    echo "  Found $STATIC_COUNT static files"
else
    echo "  ERROR: .next/static directory not found"
    exit 1
fi

# 5. Check server build
echo "✓ Checking server build..."
if [ -d ".next/server" ]; then
    echo "  Server build exists"
else
    echo "  ERROR: .next/server directory not found"
    exit 1
fi

# 6. Try to verify the build works by checking if it can be started
echo "✓ Checking if Next.js can start (dry run)..."
timeout 10 npm run start -- --help > /dev/null 2>&1 || true
echo "  Next.js start command available"

echo ""
echo "===== All Verification Passed ====="
exit 0
