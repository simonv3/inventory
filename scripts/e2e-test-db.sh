#!/usr/bin/env bash
#
# One-shot E2E: bring up a disposable Postgres + dev server, run Cypress, tear
# everything down. Suitable for CI or a quick local "is it green?" check.
#
#   npm run test:e2e:local                 # whole suite
#   npm run test:e2e:local -- --spec "cypress/e2e/auth.cy.ts"   # pass-through args
#
# Exits with Cypress's exit code. Never touches the .env DATABASE_URL (see
# dev-test-db.sh for why the inline URL wins).
set -euo pipefail

cd "$(dirname "$0")/.."

DB_PORT=${TEST_DB_PORT:-5433}
APP_PORT=${TEST_APP_PORT:-3001}
DB_URL="postgres://test:test@localhost:${DB_PORT}/inventory_test"
COMPOSE=(docker compose -p gnb-test -f docker-compose.test.yml)

SERVER_PID=""
CLEANED=""
kill_tree() {
  local pid=$1 child
  for child in $(pgrep -P "$pid" 2>/dev/null); do kill_tree "$child"; done
  kill "$pid" 2>/dev/null || true
}
cleanup() {
  [[ -n "$CLEANED" ]] && return; CLEANED=1
  echo ""
  echo "→ tearing down disposable stack…"
  [[ -n "$SERVER_PID" ]] && kill_tree "$SERVER_PID"
  TEST_DB_PORT="$DB_PORT" "${COMPOSE[@]}" down >/dev/null 2>&1 || true
}
trap cleanup EXIT
trap 'exit 130' INT TERM

if ! docker info >/dev/null 2>&1; then
  echo "✗ Docker is required but not available (is the daemon running?)." >&2
  exit 1
fi

echo "→ starting disposable Postgres on :$DB_PORT…"
TEST_DB_PORT="$DB_PORT" "${COMPOSE[@]}" up -d --wait

echo "→ applying migrations…"
DATABASE_URL="$DB_URL" npx prisma migrate deploy >/dev/null

echo "→ starting Next dev on :$APP_PORT…"
DATABASE_URL="$DB_URL" npx next dev -p "$APP_PORT" >/tmp/gnb-e2e-server.log 2>&1 &
SERVER_PID=$!

echo "→ waiting for the server…"
for _ in $(seq 1 60); do
  curl -sf "http://localhost:${APP_PORT}" >/dev/null 2>&1 && break
  sleep 1
done

echo "→ running Cypress…"
# Pass through any extra args (e.g. --spec). Cypress exit code propagates.
npx cypress run "$@"
