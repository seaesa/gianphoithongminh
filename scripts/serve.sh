#!/usr/bin/env bash
# Serve the clone locally (pretty URLs need a server, not file://).
cd "$(dirname "$0")/.."
PORT="${1:-8777}"
echo "http://127.0.0.1:$PORT/"
exec python3 -m http.server "$PORT" --bind 127.0.0.1
