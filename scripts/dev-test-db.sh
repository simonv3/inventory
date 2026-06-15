#!/usr/bin/env bash
#
# Run the app in development mode against a DISPOSABLE Postgres.
#
#   npm run dev:test
#
# Brings up the throwaway Postgres defined in docker-compose.test.yml, applies
# migrations, and starts the Next dev server on port 3001 (the port
# cypress.config.ts expects) in development mode — so the /api/test/* setup
# endpoints are enabled. Everything is torn down on exit (Ctrl-C), and the real
# DATABASE_URL in .env is never touched: the disposable URL is passed inline and
# Next/Prisma do not let .env override an already-set env var.
#
# Then, in another terminal, run tests against it:
#   npx cypress run --spec "cypress/e2e/storefront-ordering.cy.ts"
#
# Overridable via env: TEST_DB_PORT, TEST_APP_PORT.
set -euo pipefail

cd "$(dirname "$0")/.."

DB_PORT=${TEST_DB_PORT:-5433}          # host port; 5433 avoids clashing with a local 5432
APP_PORT=${TEST_APP_PORT:-3001}
DB_URL="postgres://test:test@localhost:${DB_PORT}/inventory_test"
COMPOSE=(docker compose -p gnb-test -f docker-compose.test.yml)

SERVER_PID=""
CLEANED=""
# next dev spawns a next-server worker (and a postcss helper); killing only the
# parent leaves them holding the port. Kill the whole descendant tree, leaves first.
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
trap 'exit 130' INT TERM   # INT/TERM -> exit -> single EXIT-trap cleanup

if ! docker info >/dev/null 2>&1; then
  echo "✗ Docker is required but not available (is the daemon running?)." >&2
  exit 1
fi

echo "→ starting disposable Postgres on :$DB_PORT (compose, waiting for healthy)…"
TEST_DB_PORT="$DB_PORT" "${COMPOSE[@]}" up -d --wait

echo "→ applying migrations…"
DATABASE_URL="$DB_URL" npx prisma migrate deploy >/dev/null

echo "→ starting Next dev on :$APP_PORT (development mode; /api/test/* enabled)…"
DATABASE_URL="$DB_URL" npx next dev -p "$APP_PORT" &
SERVER_PID=$!

cat <<EOF

✅ Disposable stack is up.
   App:  http://localhost:${APP_PORT}
   DB:   ${DB_URL}  (wiped when this command exits)

   Run E2E in another terminal, e.g.:
     npx cypress run --spec "cypress/e2e/storefront-ordering.cy.ts"

   Press Ctrl-C here to stop the server and delete the database.

EOF

wait "$SERVER_PID"
