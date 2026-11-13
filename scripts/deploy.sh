#!/bin/sh
# Rebuild the static SPA and publish it to the gh-pages branch.
# Usage: bun run deploy   (or: sh scripts/deploy.sh)
set -e
cd "$(dirname "$0")/.."

REPO_URL=$(git remote get-url origin)
WORKTREE="$(mktemp -d)"

bun run build:pages

git worktree add --orphan -b gh-pages "$WORKTREE" 2>/dev/null || git worktree add "$WORKTREE" gh-pages
trap 'git worktree remove --force "$WORKTREE"; git worktree prune' EXIT

cp -r dist/client/. "$WORKTREE/"
(
  cd "$WORKTREE"
  if [ -n "$(git status --porcelain)" ]; then
    git add -A
    git commit -m "Deploy $(date -u '+%Y-%m-%d %H:%M UTC')"
  fi
  git push origin gh-pages
)
echo "Deployed. Live in ~1 minute: https://twentysixmoons.github.io/know-thyself-app/"
