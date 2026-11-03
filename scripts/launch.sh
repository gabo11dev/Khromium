#!/bin/sh
umask 077
APP_DIR=$(CDPATH= cd -P "$(dirname "$0")" && pwd) || exit 1
mkdir -p "$APP_DIR/state/cache" || exit 1
if [ "${1:-}" != "--run" ]; then
    nohup sh "$APP_DIR/launch.sh" --run > "$APP_DIR/state/run.log" 2>&1 < /dev/null &
    exit 0
fi
case "$(uname -m)" in armv7*) ;; *) echo 'This package requires ARMv7.'; exit 1 ;; esac
if [ "$APP_DIR" != /mnt/us/extensions/khromium ]; then
    echo 'Install at /mnt/us/extensions/khromium.'; exit 1
fi
if [ ! -x /mnt/us/khromiumld.so ]; then
    echo 'Missing khromiumld.so in the Kindle USB root.'; exit 1
fi
if [ -r "$APP_DIR/state/frontend.pid" ]; then
    previous=$(cat "$APP_DIR/state/frontend.pid")
    case "$previous" in ''|*[!0-9]*) ;; *)
        if [ "$(readlink "/proc/$previous/exe" 2>/dev/null)" = "$APP_DIR/bin/khromium" ]; then
            echo 'Khromium is already running.'; exit 0
        fi ;;
    esac
fi
export DISPLAY=${DISPLAY:-:0.0}
export XDG_CACHE_HOME="$APP_DIR/state/cache"
export GTK_MODULES=
cleanup() { rm -f "$APP_DIR/state/frontend.pid"; }
trap cleanup EXIT
"$APP_DIR/bin/khromium" --engine "$APP_DIR/engine.sh" --profile "$APP_DIR/state/profile" \
    --assets "$APP_DIR/assets" --unsafe-no-sandbox &
frontend_pid=$!
echo "$frontend_pid" > "$APP_DIR/state/frontend.pid"
trap 'kill -TERM "$frontend_pid" 2>/dev/null' HUP INT TERM
wait "$frontend_pid"
result=$?
echo "Khromium exited: $result"
exit "$result"
