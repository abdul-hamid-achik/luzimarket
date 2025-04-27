#!/usr/bin/env bash
set -euo pipefail

# Navigate to the src directory
cd "$(dirname "$0")/../apps/frontend/src"

# Rename all files and directories to snake_case using git mv
find . -depth | while IFS= read -r old; do
  # Skip current directory marker
  [ "$old" = "." ] && continue
  base=${old##*/}
  dir=${old%/*}
  # Compute snake_case name
  new_base=$(echo "$base" \
    | sed -E 's/([a-z0-9])([A-Z])/\1_\2/g; s/-/_/g' \
    | tr '[:upper:]' '[:lower:]')
  if [ "$base" != "$new_base" ]; then
    target_dir=${dir:-.}
    echo "Renaming: $old -> $new_base"
    mv -v "$old" "$target_dir/$new_base"
  fi
done

# Return to project root
cd - > /dev/null

# Update import paths based on new file names
node "$(dirname "$0")/snake_case_rename.js"

echo "Full snake_case refactor complete."