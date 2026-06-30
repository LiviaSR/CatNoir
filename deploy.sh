#!/usr/bin/env bash
# Deploy CatNoir static site.
#
# Typical workflow (repo already cloned on server via GitHub):
#   1. cp deploy.env.example deploy.env   # once, edit with your paths
#   2. ./deploy.sh                        # from your Mac: SSH → pull → build → publish
#
# Or, when already logged into the server:
#   cd /path/to/CatNoir && ./deploy.sh --on-server
#
# Other modes:
#   ./deploy.sh --local-only   # build + stage in ./public/ (smoke test, no upload)
#   ./deploy.sh --help

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

MODE="remote"
STAGING="$ROOT/.deploy-staging"

# Defaults (override in deploy.env)
: "${DEPLOY_SSH:=}"
: "${DEPLOY_REMOTE_REPO:=}"
: "${DEPLOY_TARGET:=}"
: "${DEPLOY_GIT_PULL:=1}"

if [[ -f "$ROOT/deploy.env" ]]; then
  # shellcheck source=/dev/null
  source "$ROOT/deploy.env"
fi

usage() {
  cat <<'EOF'
Usage: ./deploy.sh [OPTION]

  (no args)       SSH to server, optional git pull, build, publish to DEPLOY_TARGET
  --on-server     Run on the server (after git pull): build and publish
  --local-only    Build and assemble ./public/ locally (no SSH)
  --help          Show this help

Configuration: copy deploy.env.example → deploy.env

Required variables:
  DEPLOY_TARGET          Web document root on the server

For remote mode (default), also set:
  DEPLOY_SSH             e.g. user@server.example.org
  DEPLOY_REMOTE_REPO     Path to git clone on the server

Optional:
  DEPLOY_GIT_PULL=1      Pull latest from GitHub before building (default: 1)
EOF
}

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Error: '$1' is required but not installed." >&2
    exit 1
  fi
}

validate_target() {
  if [[ -z "$DEPLOY_TARGET" ]]; then
    echo "Error: DEPLOY_TARGET is not set. Copy deploy.env.example to deploy.env." >&2
    exit 1
  fi
}

assemble_release() {
  local dest="$1"

  echo "→ Installing npm dependencies…"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi

  echo "→ Building site (vite + assemble)…"
  npm run build

  echo "→ Assembling release in staging…"
  rm -rf "$STAGING"
  mkdir -p "$STAGING"

  # Complete build output (dist already includes css/ and images/)
  cp -R dist/. "$STAGING/"
  find "$STAGING" -name '.DS_Store' -delete 2>/dev/null || true

  echo "→ Publishing to $dest"
  mkdir -p "$dest"
  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete "$STAGING/" "$dest/"
  else
    rm -rf "${dest:?}/"*
    cp -R "$STAGING/." "$dest/"
  fi

  rm -rf "$STAGING"
  echo "✓ Deploy complete → $dest"
}

deploy_on_server() {
  validate_target
  require_cmd npm
  require_cmd node

  if [[ "$DEPLOY_GIT_PULL" == "1" ]] && [[ -d "$ROOT/.git" ]]; then
    echo "→ Pulling latest from git…"
    git pull --ff-only
  fi

  assemble_release "$DEPLOY_TARGET"
}

deploy_local_only() {
  : "${DEPLOY_TARGET:=$ROOT/public}"
  require_cmd npm
  require_cmd node
  assemble_release "$DEPLOY_TARGET"
  echo "  Preview with: npm run preview  (serves site/, not public/)"
  echo "  Or: cd public && python3 -m http.server 8080"
}

deploy_remote() {
  if [[ -z "$DEPLOY_SSH" || -z "$DEPLOY_REMOTE_REPO" ]]; then
    echo "Error: DEPLOY_SSH and DEPLOY_REMOTE_REPO must be set in deploy.env" >&2
    exit 1
  fi
  validate_target
  require_cmd ssh

  echo "→ Deploying via SSH to $DEPLOY_SSH…"
  ssh "$DEPLOY_SSH" \
    "DEPLOY_TARGET=$(printf '%q' "$DEPLOY_TARGET") DEPLOY_GIT_PULL=$(printf '%q' "$DEPLOY_GIT_PULL") bash -s" \
    <<EOF
set -euo pipefail
cd $(printf '%q' "$DEPLOY_REMOTE_REPO")
./deploy.sh --on-server
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --on-server)  MODE="on-server" ;;
    --local-only) MODE="local-only" ;;
    --help|-h)    usage; exit 0 ;;
    *)            echo "Unknown option: $1" >&2; usage; exit 1 ;;
  esac
  shift
done

case "$MODE" in
  on-server)   deploy_on_server ;;
  local-only)  deploy_local_only ;;
  remote)      deploy_remote ;;
esac
