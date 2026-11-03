# Integration test

Build the harness with the same GTK2 sysroot as the frontend:

```sh
KHROMIUM_SOURCE=tests/integration.c KHROMIUM_BINARY=integration python3 frontend/build.py amd64
```

`tests/run.py` starts Xvfb and runs a real Chromium headless-shell through the GTK2 frontend. Set `KHROMIUM_TEST_RUNTIME` to a local test fixture directory containing:

- `test-runtime/root/usr/bin/Xvfb`
- `test-runtime/root/usr/lib/x86_64-linux-gnu/` with Xvfb/GTK2 runtime dependencies
- `official-engine/chrome-headless-shell-linux64/chrome-headless-shell`

Alternatively set `UI_TEST_ENGINE` to an executable ARM-emulation wrapper. Run `python3 tests/run.py`. Logs and captures are written to `build/test/`; profiles are temporary. The harness loads only local test pages and checks protocol results and saved state. It does not verify Kindle window-manager integration or physical touchscreen behavior.
