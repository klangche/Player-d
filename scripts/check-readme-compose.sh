#!/bin/sh
# Fails when the YAML block in README.md differs from docker-compose.yml.
set -eu
cd "$(dirname "$0")/.."
readme=$(mktemp)
trap 'rm -f "$readme"' EXIT
awk '/<!-- compose:end -->/{f=0} f; /<!-- compose:start -->/{f=1}' README.md | sed '1d;$d' > "$readme"
if diff -u docker-compose.yml "$readme"; then
  echo "README YAML matches docker-compose.yml"
else
  echo "README YAML differs from docker-compose.yml (diff above)" >&2
  exit 1
fi
