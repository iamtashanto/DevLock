#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Bumping versions and publishing DevLock SDKs..."

echo "------------------------------------------------"
echo "📦 1. Bumping devlock-client (frontend-sdk)"
echo "------------------------------------------------"
cd packages/frontend-sdk
npm version patch --no-git-tag-version
npm publish --access public
cd ../..

echo ""
echo "------------------------------------------------"
echo "📦 2. Bumping devlock-sdk (backend-sdk)"
echo "------------------------------------------------"
cd packages/backend-sdk
npm version patch --no-git-tag-version
npm publish --access public
cd ../..

echo ""
echo "✅ Both SDK packages have been successfully updated and published to npm!"
