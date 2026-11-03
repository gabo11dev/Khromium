#!/bin/sh
APP_DIR=$(CDPATH= cd -P "$(dirname "$0")" && pwd) || exit 1
mkdir -p "$APP_DIR/state"
{
    echo 'Khromium Alpha 0.0.1 installation check'
    uname -a
    df -h /mnt/us
    free
    [ -x /mnt/us/khromiumld.so ] && echo 'Loader: present' || echo 'Loader: MISSING'
    "$APP_DIR/bin/khromium" --self-test
    "$APP_DIR/engine.sh" --version
} > "$APP_DIR/state/check.log" 2>&1
cat "$APP_DIR/state/check.log"
