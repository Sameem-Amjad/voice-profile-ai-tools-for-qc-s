#!/usr/bin/env bash
# setup-ec2.sh — one-time setup for a fresh Ubuntu 22.04 t2.micro EC2 instance
#
# Run as: bash setup-ec2.sh your-domain.com
# After this script finishes, run deploy.sh to push your first build.

set -euo pipefail

DOMAIN="${1:-}"
if [[ -z "$DOMAIN" ]]; then
  echo "Usage: bash setup-ec2.sh <your-domain-or-ip>"
  exit 1
fi

echo "==> [1/7] System update"
sudo apt-get update -y && sudo apt-get upgrade -y

echo "==> [2/7] Install dependencies"
sudo apt-get install -y \
  docker.io \
  docker-compose-plugin \
  nginx \
  certbot \
  python3-certbot-nginx \
  curl \
  git \
  ffmpeg

# Allow current user to run docker without sudo
sudo usermod -aG docker "$USER"

echo "==> [3/7] Enable Docker on boot"
sudo systemctl enable docker
sudo systemctl start docker

echo "==> [4/7] Create secrets directory"
sudo mkdir -p /etc/voicecheck
sudo chown "$USER":"$USER" /etc/voicecheck
sudo chmod 700 /etc/voicecheck

# Create the .env file from the example if it doesn't exist yet
if [[ ! -f /etc/voicecheck/.env ]]; then
  echo "  → /etc/voicecheck/.env not found."
  echo "  → Copy deploy/.env.production.example to /etc/voicecheck/.env and fill in all values."
  echo "  → Then re-run deploy.sh."
fi

echo "==> [5/7] Configure Nginx"
# Copy nginx config and substitute the domain
sudo cp "$(dirname "$0")/nginx.conf" /etc/nginx/sites-available/voicecheck
sudo sed -i "s/YOUR_DOMAIN_OR_IP/$DOMAIN/g" /etc/nginx/sites-available/voicecheck
sudo ln -sf /etc/nginx/sites-available/voicecheck /etc/nginx/sites-enabled/voicecheck
sudo rm -f /etc/nginx/sites-enabled/default

# Test nginx config before reload
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

echo "==> [6/7] Obtain SSL certificate (Let's Encrypt)"
# Skip if domain is an IP address or if cert already exists
if [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "  → Domain is an IP address — skipping SSL. Use a domain name for HTTPS."
elif sudo certbot certificates 2>/dev/null | grep -q "$DOMAIN"; then
  echo "  → Certificate already exists for $DOMAIN — skipping."
else
  sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN"
fi

echo "==> [7/7] Configure certbot auto-renewal"
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo ""
echo "======================================================"
echo "  EC2 setup complete!"
echo "  Next steps:"
echo "  1. Edit /etc/voicecheck/.env with your real secrets"
echo "  2. Run: bash deploy/deploy.sh"
echo "======================================================"
