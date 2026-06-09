#!/usr/bin/env bash
# deploy.sh — build and redeploy the voicecheck API on EC2
#
# Run from the repo root on the EC2 instance:
#   bash deploy/deploy.sh
#
# Or from your local machine (push + SSH trigger):
#   git push origin main && ssh ubuntu@<EC2-IP> 'cd ~/voicecheck && git pull && bash deploy/deploy.sh'

set -euo pipefail

COMPOSE_FILE="deploy/docker-compose.prod.yml"
IMAGE_NAME="voicecheck-api"
ENV_FILE="/etc/voicecheck/.env"

echo "==> Checking prerequisites"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found. Create it from deploy/.env.production.example first."
  exit 1
fi

echo "==> Building Docker image"
docker build \
  --file voicecheck/backend/Dockerfile \
  --tag "${IMAGE_NAME}:latest" \
  --tag "${IMAGE_NAME}:$(git rev-parse --short HEAD 2>/dev/null || echo 'local')" \
  voicecheck/backend

echo "==> Stopping old container (if running)"
docker compose -f "$COMPOSE_FILE" down --timeout 30 || true

echo "==> Starting new container"
docker compose -f "$COMPOSE_FILE" up -d

echo "==> Waiting for health check"
MAX_WAIT=60
ELAPSED=0
until docker inspect --format='{{.State.Health.Status}}' voicecheck_api 2>/dev/null | grep -q "healthy"; do
  if [[ $ELAPSED -ge $MAX_WAIT ]]; then
    echo "ERROR: Container did not become healthy within ${MAX_WAIT}s"
    docker logs voicecheck_api --tail 50
    exit 1
  fi
  echo "  waiting... (${ELAPSED}s)"
  sleep 5
  ELAPSED=$((ELAPSED + 5))
done

echo "==> Reloading Nginx"
sudo nginx -t && sudo systemctl reload nginx

echo "==> Pruning old Docker images"
docker image prune -f --filter "label!=keep"

echo ""
echo "======================================================"
echo "  Deployed successfully!"
echo "  Container: voicecheck_api"
echo "  Health:    $(docker inspect --format='{{.State.Health.Status}}' voicecheck_api)"
echo "======================================================"
