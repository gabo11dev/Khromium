# RC1 integration tests

Build with:

```sh
KHROMIUM_SOURCE=tests/integration.c KHROMIUM_BINARY=integration python3 frontend/build.py amd64
```

Set `CHROMIUM_SRC` when using the Chromium GTK2 sysroot. Set `KHROMIUM_TEST_RUNTIME` to a fixture directory containing `test-runtime/root/usr/bin/Xvfb`, `test-runtime/root/usr/lib/x86_64-linux-gnu` and `official-engine/chrome-headless-shell-linux64/chrome-headless-shell`. Override `UI_TEST_ENGINE` to use another executable engine wrapper.

Run:

```sh
python3 tests/run.py
KHROMIUM_TEST_FULL=1 python3 tests/run.py
```

The tests start an isolated virtual display and real Chromium, use temporary profiles, and load only local pages. Normal mode checks in-window panels with no visible secondary windows or combo boxes, visible radio controls, both scales, real Back/Forward/Reload taps, arrow keys/scrolling, ñ/Ñ/Enter, automatic focus/blur, expanded screenshot height after keyboard close, cookies, preservation of custom favorites, retirement of removed internal pages, saved orientations and landscape layout at 150% UI scale.

Full mode checks the configured startup URL, hidden toolbar, automatic keyboard opening/closing and the real two-second exit timer. Orientation is tested with a recording helper, and eips with an executable substitute in the test PATH: no real device framebuffer or system rotation is changed. The helper requests and restoration are checked after exit.

Logs and captures are written to `build/test`. Hardware window-manager rotation and e-ink refresh require a Kindle test.
