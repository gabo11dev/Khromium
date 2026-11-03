#!/bin/sh
APP_DIR=$(CDPATH= cd -P "$(dirname "$0")" && pwd) || exit 1
mkdir -p "$APP_DIR/state" || exit 1
{
    echo 'Khromium 156.0 SF Build 1 - ALPHA / NOT DEVICE TESTED'
    uname -a
    cat /etc/prettyversion.txt 2>/dev/null
    sed -n '/model name/p; /Processor/p; /Features/p; /Hardware/p' /proc/cpuinfo
    df -h /mnt/us
    free
    [ -x /lib/ld-linux.so.3 ] && echo 'System soft-float loader: present' || echo 'System soft-float loader: MISSING'
    [ -x /mnt/us/khromiumsfld.so ] && echo 'Private engine loader: present' || echo 'Private engine loader: MISSING'
    "$APP_DIR/bin/khromium" --self-test
    echo "Frontend exit status: $?"
    "$APP_DIR/engine.sh" --version
    echo "Engine version exit status: $?"
    echo 'A version/self-test pass does not prove page rendering or PW3 kernel compatibility.'
} > "$APP_DIR/state/check.log" 2>&1
cat "$APP_DIR/state/check.log"
