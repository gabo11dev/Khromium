#!/bin/sh
APP_DIR=$(CDPATH= cd -P "$(dirname "$0")" && pwd) || exit 1
[ -r "$APP_DIR/state/frontend.pid" ] || exit 0
frontend_pid=$(cat "$APP_DIR/state/frontend.pid")
case "$frontend_pid" in ''|*[!0-9]*) exit 1 ;; esac
if [ "$(readlink "/proc/$frontend_pid/exe" 2>/dev/null)" = "$APP_DIR/bin/khromium" ]; then
    kill -TERM "$frontend_pid"
fi
