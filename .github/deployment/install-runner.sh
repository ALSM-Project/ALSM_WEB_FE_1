#!/usr/bin/env bash
# Run as root ONLY after the organization runner group and workflow restrictions are verified.
# Supply the official short-lived GitHub registration token on stdin. Never enable shell tracing.
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
[[ "$EUID" -eq 0 ]] || { echo 'Run using the Ubuntu administrator'; exit 1; }
id alsmrunner >/dev/null
for group in sudo admin docker lxd disk; do
  if id -nG alsmrunner | tr ' ' '\n' | grep -qx "$group"; then
    echo 'Runner account has privileged groups; stop and inspect'; exit 1
  fi
done
base=/var/lib/alsmrunner/actions-runner
[[ ! -L /var/lib/alsmrunner && ! -L "$base" ]]
install -d -o alsmrunner -g alsmrunner -m 700 "$base"
if [[ ! -f "$base/config.sh" ]]; then
  archive="$(mktemp /var/tmp/alsm-runner.XXXXXXXX.tar.gz)"
  trusted="$(mktemp -d /var/tmp/alsm-runner-trusted.XXXXXXXX)"
  trap 'rm -f -- "$archive"; rm -rf -- "$trusted"' EXIT
  curl --fail --silent --show-error --location --proto '=https' \
    https://github.com/actions/runner/releases/download/v2.338.2/actions-runner-linux-x64-2.338.2.tar.gz \
    --output "$archive"
  echo "baebf204307bac6193480852732f0aba2ae97b6c5597c244f4d5558390147c40  $archive" | sha256sum --check
  # Root executes dependencies only from the verified root-owned temporary extraction.
  tar -xzf "$archive" -C "$trusted"
  NEEDRESTART_MODE=l DEBIAN_FRONTEND=noninteractive "$trusted/bin/installdependencies.sh"
  chmod 644 "$archive"
  runuser -u alsmrunner -- tar -xzf "$archive" -C "$base"
elif [[ ! -f "$base/.runner" ]]; then
  echo 'Partially installed runner requires inspection before accepting a token'; exit 1
fi
cd "$base"
if [[ ! -f .runner ]]; then
  IFS= read -r registration_token
  [[ -n "$registration_token" ]] || { echo 'Missing official registration token on stdin'; exit 1; }
  runuser -u alsmrunner -- ./config.sh --unattended \
    --url https://github.com/ALSM-Project --token "$registration_token" \
    --name ALSM-Production-Frontend --runnergroup alsm-frontend-production \
    --labels alsm-deploy --work _work
  unset registration_token
fi
# Never execute svc.sh (or any file writable by the runner) as root.
service=actions.runner.ALSM-Project.ALSM-Production-Frontend.service
cat > "/etc/systemd/system/$service" <<'UNIT'
[Unit]
Description=ALSM frontend deployment runner
After=network-online.target
Wants=network-online.target
[Service]
Type=simple
User=alsmrunner
Group=alsmrunner
WorkingDirectory=/var/lib/alsmrunner/actions-runner
ExecStart=/var/lib/alsmrunner/actions-runner/runsvc.sh
Restart=always
RestartSec=10
KillMode=control-group
TimeoutStopSec=90
[Install]
WantedBy=multi-user.target
UNIT
hardening="$script_dir/runner-hardening.conf"
[[ -f "$hardening" ]]
install -d -o root -g root -m 755 "/etc/systemd/system/$service.d"
install -o root -g root -m 644 "$hardening" "/etc/systemd/system/$service.d/override.conf"
systemctl daemon-reload
systemctl enable --now "$service"
systemctl is-active --quiet "$service"
echo "Runner service is active: $service"
echo 'Verify Online/Idle and workflow restrictions on GitHub before merging anything.'
