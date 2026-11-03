#!/bin/sh
umask 077
APP_DIR=$(CDPATH= cd -P "$(dirname "$0")" && pwd) || exit 1
mkdir -p "$APP_DIR/state/cache" || exit 1
if [ "${1:-}" != "--run" ]; then
    nohup sh "$APP_DIR/launch.sh" --run "${1:-normal}" > "$APP_DIR/state/run.log" 2>&1 < /dev/null &
    exit 0
fi
mode=${2:-normal}
case "$mode" in normal|full-page) ;; *) echo 'Unknown browser mode.'; exit 2 ;; esac
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
            if [ "$(cat "$APP_DIR/state/frontend.mode" 2>/dev/null)" = "$mode" ]; then
                echo 'Khromium is already running in this mode.'; exit 0
            fi
            kill -TERM "$previous"
            tries=0
            while kill -0 "$previous" 2>/dev/null && [ "$tries" -lt 10 ]; do sleep 1; tries=$((tries+1)); done
            if kill -0 "$previous" 2>/dev/null; then echo 'Close the previous browser before switching modes.'; exit 1; fi
            tries=0
            while [ "$(cat "$APP_DIR/state/frontend.pid" 2>/dev/null)" = "$previous" ] && [ "$tries" -lt 10 ]; do sleep 1; tries=$((tries+1)); done
            if [ "$(cat "$APP_DIR/state/frontend.pid" 2>/dev/null)" = "$previous" ]; then echo 'The previous launcher is still closing.'; exit 1; fi
        fi ;;
    esac
fi
# Remove only the obsolete bundled game files from earlier installations.
rm -f "$APP_DIR/assets/dino.html" "$APP_DIR/assets/dino.js" "$APP_DIR/assets/dino-1x.png" "$APP_DIR/assets/dino-2x.png" "$APP_DIR/assets/DINO-LICENSE"
export DISPLAY=${DISPLAY:-:0.0}
export XDG_CACHE_HOME="$APP_DIR/state/cache"
export GTK_MODULES=
export KHROMIUM_ORIENTATION_HELPER="$APP_DIR/orientation.sh"
KHROMIUM_ORIENTATION_PREVIOUS=$(sh "$APP_DIR/orientation.sh" get 2>/dev/null)
export KHROMIUM_ORIENTATION_PREVIOUS
cleanup() {
    case "$KHROMIUM_ORIENTATION_PREVIOUS" in U|D|L|R) sh "$APP_DIR/orientation.sh" set "$KHROMIUM_ORIENTATION_PREVIOUS" ;; esac
    rm -f "$APP_DIR/state/frontend.pid" "$APP_DIR/state/frontend.mode"
}
trap cleanup EXIT
set --
[ "$mode" = full-page ] && set -- --full-page
"$APP_DIR/bin/khromium" "$@" --engine "$APP_DIR/engine.sh" --profile "$APP_DIR/state/profile" \
    --assets "$APP_DIR/assets" --unsafe-no-sandbox &
frontend_pid=$!
echo "$frontend_pid" > "$APP_DIR/state/frontend.pid"
echo "$mode" > "$APP_DIR/state/frontend.mode"
trap 'kill -TERM "$frontend_pid" 2>/dev/null' HUP INT TERM
wait "$frontend_pid"
result=$?
echo "Khromium exited: $result"
exit "$result"
