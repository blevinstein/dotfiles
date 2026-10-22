#!/usr/bin/env bash
# Runs install-packages.sh in throwaway Linux containers and checks the results.
# Usage: test/install-packages.sh [image...]   (default: ubuntu:24.04 fedora:latest)

set -euo pipefail

cd "$(dirname "$0")/.."

IMAGES=("$@")
[[ ${#IMAGES[@]} -eq 0 ]] && IMAGES=(ubuntu:24.04 fedora:latest)

read -r -d '' CHECK <<'EOF' || true
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive TZ=UTC
if command -v apt-get >/dev/null; then
  apt-get update -qq && apt-get install -y -qq sudo
else
  dnf install -y -q sudo
fi >/dev/null
export PATH="$HOME/.local/bin:$PATH"
for run in 1 2; do
  ./install-packages.sh >/tmp/install.log 2>&1 || { tail -20 /tmp/install.log; exit 1; }
done
missing=0
for t in rg fzf jq node npm sqlite3 tmux vim curl wget git ssh uv; do
  command -v "$t" >/dev/null || { echo "MISSING $t"; missing=1; }
done
[[ -x /usr/sbin/sshd ]] || { echo "MISSING sshd"; missing=1; }
uv python install -q 3.12
uv run -q --python 3.12 python -V
exit $missing
EOF

failed=()
for image in "${IMAGES[@]}"; do
  echo "== $image"
  docker run --rm -v "$PWD/install-packages.sh:/d/install-packages.sh:ro" -w /d \
    "$image" bash -c "$CHECK" || failed+=("$image")
done

if [[ ${#failed[@]} -gt 0 ]]; then
  echo "FAILED: ${failed[*]}" >&2
  exit 1
fi
echo "All passed"
