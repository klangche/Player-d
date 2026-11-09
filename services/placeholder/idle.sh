#!/bin/sh
# Idles until stopped; exits at once on SIGTERM so `docker stop` is fast.
echo "player-d-${PLAYERD_SERVICE}: placeholder, not implemented yet. Idling."
trap 'exit 0' TERM INT
while :; do
  sleep 3600 &
  wait $!
done
