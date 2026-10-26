#!/usr/bin/env bash
# Sends a new over-the-air update to people who already installed Isoko.
#
#   bash scripts/publish-update.sh preview      -> testers only
#   bash scripts/publish-update.sh production   -> everyone
#
# Use this for changes to screens, text, colours, logic (JavaScript/TypeScript).
# For new native libraries or a new app version number, make a store build instead
# (bash scripts/build-app.sh production). See updates/README.md.
set -e

CHANNEL="${1:-preview}"
if [[ "$CHANNEL" != "preview" && "$CHANNEL" != "production" ]]; then
  echo "Channel must be 'preview' or 'production'."
  exit 1
fi

cd "$(dirname "$0")/.."

echo "1/3 Checking the code for mistakes..."
npx tsc --noEmit

VERSION=$(node -p "require('./app.json').expo.version")
read -r -p "2/3 Short message for this update (e.g. 'Fixed price on car cards'): " MESSAGE
MESSAGE="${MESSAGE:-Update for $VERSION}"

if [[ "$CHANNEL" == "production" ]]; then
  read -r -p "This goes to ALL users. Type 'yes' to continue: " OK
  [[ "$OK" == "yes" ]] || { echo "Cancelled."; exit 1; }
fi

echo "3/3 Publishing to '$CHANNEL'..."
npx eas-cli@latest update --channel "$CHANNEL" --message "$MESSAGE" --non-interactive

echo "Done. Users get it the next time they open the app (or via Profile → About → Check for updates)."
