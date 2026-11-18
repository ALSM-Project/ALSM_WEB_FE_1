#!/usr/bin/env bash
# Read-only. Never print .env files, container environment, tokens or private keys.
set -euo pipefail
printf 'HOST\n'
hostname
uname -srmo
printf 'INSTANCE METADATA\n'
metadata_token="$(curl -fsS --max-time 3 -X PUT -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' http://169.254.169.254/latest/api/token || true)"
if [[ -n "$metadata_token" ]]; then
  for item in instance-id public-ipv4 placement/region; do
    printf '%s: ' "$item"
    curl -fsS --max-time 3 -H "X-aws-ec2-metadata-token: $metadata_token" "http://169.254.169.254/latest/meta-data/$item"
    printf '\n'
  done
fi
unset metadata_token
printf 'SERVICES\n'
systemctl is-active nginx docker
systemctl list-units --all --type=service 'actions.runner*' --no-pager
printf 'RUNNER ACCOUNT\n'
id alsmrunner 2>/dev/null || true
printf 'DIRECTORY PERMISSIONS\n'
ls -ld /opt/alsm /opt/alsm/deploy /var/www/alsm /var/www/alsm/*
for portal in user staff web3; do
  namei -l "/var/www/alsm/$portal/index.html"
done
printf 'DISK\n'
df -h /var/www/alsm
printf 'CONTAINERS (no environment variables)\n'
sudo -n docker ps --format '{{.Names}} {{.Image}} {{.Status}} {{.Ports}}'
printf 'BACKEND HEALTH\n'
curl -fsS --max-time 10 http://127.0.0.1:3000/api/v1/health
printf '\nNGINX CONFIGURATION\n'
sudo -n nginx -t
# Only emit routing/TLS file-path directives, not arbitrary header/auth values.
sudo -n awk '/^[[:space:]]*(listen|server_name|root|ssl_certificate|ssl_certificate_key)[[:space:]]/ { print } /^[[:space:]]*proxy_pass[[:space:]]+http:\/\/127\.0\.0\.1/ { print }' /etc/nginx/sites-available/alsm-portals
printf '\nCERTIFICATE IDENTITIES (no private keys)\n'
sudo -n find /etc/letsencrypt/live -maxdepth 2 -name cert.pem -exec openssl x509 -in '{}' -noout -dates -ext subjectAltName \; 2>/dev/null || true
printf 'TOOLS\n'
command -v rsync curl python3 || true
printf 'LISTENING PORTS\n'
ss -lnt
