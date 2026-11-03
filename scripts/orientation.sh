#!/bin/sh
# Only ask the existing Kindle window manager to rotate; never modify firmware.
case "${1:-}" in
 get) exec /usr/bin/lipc-get-prop com.lab126.winmgr orientationLock ;;
 set)
    case "${2:-}" in U|D|L|R) ;; *) exit 2 ;; esac
    exec /usr/bin/lipc-set-prop com.lab126.winmgr orientationLock "$2" ;;
 *) exit 2 ;;
esac
