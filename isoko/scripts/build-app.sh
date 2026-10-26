#!/usr/bin/env bash
# Builds the real iPhone and Android apps in the cloud (no Mac or Android Studio needed).
#
#   bash scripts/build-app.sh preview      -> installable test app for your own phone
#   bash scripts/build-app.sh production   -> files for the App Store and Google Play
#   bash scripts/build-app.sh production submit   -> build AND send to the stores
set -e

PROFILE="${1:-preview}"
SUBMIT="${2:-}"

cd "$(dirname "$0")/.."

echo "Checking the code for mistakes..."
npx tsc --noEmit

if [[ "$SUBMIT" == "submit" ]]; then
  npx eas-cli@latest build --profile "$PROFILE" --platform all --auto-submit
else
  npx eas-cli@latest build --profile "$PROFILE" --platform all
fi
