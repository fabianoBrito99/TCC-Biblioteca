#!/usr/bin/env bash
set -euo pipefail

# Mata processos suspeitos de alto uso de CPU (ex.: mineradores com nome aleatório).
# Uso:
#   SCAN_INTERVAL=15 CPU_THRESHOLD=80 ./ops/cpu-guard.sh

SCAN_INTERVAL="${SCAN_INTERVAL:-15}"
CPU_THRESHOLD="${CPU_THRESHOLD:-80}"
LOG_FILE="${LOG_FILE:-/tmp/biblioteca-cpu-guard.log}"

is_suspicious() {
  local cmd="$1"
  local first_token base
  first_token="$(awk '{print $1}' <<< "$cmd")"
  base="$(basename "$first_token")"

  if grep -Eiq '(xmrig|minerd|kdevtmpfsi|kinsing)' <<< "$cmd"; then
    return 0
  fi

  if grep -Eq '(^|[[:space:]])(\./|/tmp/|/var/tmp/)' <<< "$cmd" \
    && grep -Eq '^[A-Za-z0-9]{6,12}$' <<< "$base"; then
    return 0
  fi

  return 1
}

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] cpu-guard iniciado (threshold=${CPU_THRESHOLD}%, interval=${SCAN_INTERVAL}s)" >> "$LOG_FILE"

while true; do
  while IFS=$'\t' read -r pid cpu cmd; do
    [[ -z "${pid:-}" ]] && continue
    [[ "$pid" == "$$" ]] && continue

    if is_suspicious "$cmd"; then
      ts="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
      echo "[$ts] suspeito detectado pid=$pid cpu=$cpu cmd=$cmd" >> "$LOG_FILE"
      kill -15 "$pid" 2>/dev/null || true
      sleep 1
      kill -9 "$pid" 2>/dev/null || true
      echo "[$ts] processo finalizado pid=$pid" >> "$LOG_FILE"
    fi
  done < <(
    ps -eo pid=,pcpu=,args= \
      | awk -v thr="$CPU_THRESHOLD" '($2 + 0) >= thr {
          pid=$1; cpu=$2;
          $1=""; $2="";
          sub(/^[ \t]+/, "", $0);
          print pid "\t" cpu "\t" $0
        }'
  )

  sleep "$SCAN_INTERVAL"
done
