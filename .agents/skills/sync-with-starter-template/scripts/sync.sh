#!/bin/bash

# Exit on error
set -e

STARTER_URL="https://github.com/OpenK3vin/KevinStarter.git"
REMOTE_NAME="starter"
BRANCH="main"

# Check if the remote already exists
if ! git remote get-url $REMOTE_NAME &>/dev/null; then
  echo "Adding remote '$REMOTE_NAME' -> $STARTER_URL"
  git remote add $REMOTE_NAME $STARTER_URL
fi

echo "Fetching from $REMOTE_NAME..."
git fetch $REMOTE_NAME

echo "Initiating merge from $REMOTE_NAME/$BRANCH..."
# We use --no-commit because there will almost certainly be conflicts that need manual resolution
if git merge $REMOTE_NAME/$BRANCH --no-commit; then
  echo "Merge completed successfully with no conflicts!"
else
  echo ""
  echo "⚠️ Merge conflicts detected (this is expected when syncing with the starter template)."
  echo "Please follow the Conflict Resolution Protocol in the sync-with-starter-template SKILL.md to resolve these conflicts."
fi
