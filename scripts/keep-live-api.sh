#!/bin/zsh
# Keeps the local API reachable for the live site.
# Quick Cloudflare tunnels are deleted without notice. This restarts the
# tunnel and publishes the new address when the current one stops answering.
set -u

ROOT="/Users/mac/Desktop/Projects/srinivas/4tyrezz"
CF="/tmp/cloudflared"
LOG="/tmp/4tyrezz-live-api.log"
TUNNEL_LOG="/tmp/4tyrezz-cloudflared.log"
LOCK="/tmp/4tyrezz-live-api.lock"
PATH="/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"

if [[ -f "$LOCK" ]]; then
  old=$(cat "$LOCK" 2>/dev/null || true)
  if [[ -n "$old" ]] && kill -0 "$old" 2>/dev/null; then
    exit 0
  fi
fi
echo $$ > "$LOCK"

log() { echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) $*" | tee -a "$LOG"; }

api_up() {
  /usr/bin/curl -sf -m 5 http://127.0.0.1:5000/api/health >/dev/null
}

tunnel_up() {
  local url="$1"
  [[ -n "$url" ]] || return 1
  /usr/bin/curl -sf -m 12 "${url}/api/health" | grep -q '"ok":true'
}

ensure_api() {
  if api_up; then
    return 0
  fi
  log "local API is down, starting it"
  cd "$ROOT/backend" || return 1
  nohup node server.js >>/tmp/4tyrezz-api.log 2>&1 &
  local i
  for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
    if api_up; then
      log "local API is up"
      return 0
    fi
    sleep 1
  done
  log "local API did not start"
  return 1
}

configured_url() {
  python3 - <<'PY'
import re
text = open("/Users/mac/Desktop/Projects/srinivas/4tyrezz/vercel.json", errors="replace").read()
match = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", text)
print(match.group(0) if match else "")
PY
}

stop_api_tunnels() {
  ps aux | awk '/\/tmp\/cloudflared/ && /127\.0\.0\.1:5000/ {print $2}' | while read -r pid; do
    kill "$pid" 2>/dev/null || true
  done
  sleep 1
}

start_tunnel() {
  stop_api_tunnels
  : > "$TUNNEL_LOG"
  nohup "$CF" tunnel --url http://127.0.0.1:5000 --no-autoupdate --protocol http2 >>"$TUNNEL_LOG" 2>&1 &
  local i url
  for i in {1..30}; do
    url=$(python3 - <<'PY'
import re
text = open("/tmp/4tyrezz-cloudflared.log", errors="replace").read()
found = re.findall(r"https://[a-z0-9-]+\.trycloudflare\.com", text)
print(found[-1] if found else "")
PY
)
    if [[ -n "$url" ]]; then
      echo "$url"
      return 0
    fi
    sleep 1
  done
  return 1
}

publish() {
  local url="$1"
  python3 - "$url" <<'PY'
import re, sys, pathlib
url = sys.argv[1].rstrip("/")
root = pathlib.Path("/Users/mac/Desktop/Projects/srinivas/4tyrezz")
changed = False
for rel in ("vercel.json", "customer/vercel.json"):
    path = root / rel
    text = path.read_text()
    updated = re.sub(r"https://[a-z0-9-]+\.trycloudflare\.com", url, text)
    if updated != text:
        path.write_text(updated)
        changed = True
sys.exit(0 if changed else 2)
PY
  local status=$?
  if [[ "$status" == 2 ]]; then
    log "live config already uses this tunnel"
    return 0
  fi
  if [[ "$status" != 0 ]]; then
    log "failed to write the tunnel address"
    return 1
  fi
  cd "$ROOT" || return 1
  git add vercel.json customer/vercel.json
  git commit -m "$(cat <<'EOF'
Keep the live site connected to the local car API.

EOF
)" || return 1
  local branch
  branch=$(git branch --show-current)
  git push origin "$branch" || return 1
  if [[ "$branch" != "main" ]]; then
    git push origin "${branch}:main" || return 1
  fi
  log "published $url"
}

log "watch started"
while true; do
  ensure_api || { sleep 20; continue; }
  current=$(configured_url)
  if tunnel_up "$current"; then
    log "healthy $current"
  else
    log "tunnel is down ($current), opening a new one"
    url=$(start_tunnel) || { log "could not open a tunnel"; sleep 20; continue; }
    log "new tunnel $url"
    ready=0
    for i in {1..15}; do
      if tunnel_up "$url"; then
        ready=1
        break
      fi
      sleep 2
    done
    if [[ "$ready" == 1 ]]; then
      publish "$url" || log "could not publish the new tunnel"
    else
      log "new tunnel did not answer"
    fi
  fi
  sleep 40
done
