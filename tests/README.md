# SF alpha tests

This release has no physical PW3 test. QEMU user-mode runs on the PC kernel and
cannot establish compatibility with the PW3 kernel, drivers or available RAM.
The Wheezy GTK2 test runtime is not an extracted PW3 firmware.

## Build

```sh
python3 scripts/prepare-sf.py
python3 frontend/build-sf.py
KHROMIUM_TEST=1 KHROMIUM_SOURCE=tests/integration-sf.c KHROMIUM_BINARY=integration python3 frontend/build-sf.py
```

`integration-sf.c` exercises the same UI checks as `integration.c`, allowing
4.5 seconds between phases and 240 seconds overall for ARM emulation.

## Run

`tests/run.py` starts an isolated Xvfb and temporary browser profile. It requires:

- `KHROMIUM_TEST_RUNTIME`: directory containing `test-runtime/root` with native
  x86-64 Xvfb/GTK2 libraries and, by default, `official-engine/...`.
- `KHROMIUM_TEST_FRONTEND`: executable or shell-quoted command prefix for the
  SF integration binary. For user-mode tests, use QEMU ARM with `-cpu cortex-a9
  -r 3.0.35 -L build/sf-sysroot`, LC_ALL=C, and an ARMEL-only LD_LIBRARY_PATH
  containing the extracted sysroot's `usr/lib/arm-linux-gnueabi` and
  `lib/arm-linux-gnueabi`. Apply these variables to the emulated process using
  QEMU `-E`, not to the host's Xvfb or shell.
- Generate the SF PNG loader cache with the sysroot's gdk-pixbuf-query-loaders
  under the same emulator and point GDK_PIXBUF_MODULE_FILE at it. The host's
  x86-64 loader cache and modern locale archive cannot be used with old ARMEL
  libraries.
- `UI_TEST_ENGINE`: wrapper for the ARMhf engine under QEMU, with its own private
  ARMhf libraries, appropriate interpreter prefix and `-r 3.0.35`. Emulator
  checks use `--no-zygote --single-process --in-process-gpu`; the production
  launcher does not add those emulator-specific flags.
- `KHROMIUM_TEST_TIMEOUT=250`. Add `KHROMIUM_TEST_FULL=1` for Full Page.

Run `python3 tests/run.py` with the variables above. It checks navigation,
reload, ñ/Ñ/Enter/arrows, focus/blur, viewport resizing, zoom, radio selectors,
preferences, favorites migration and cookie deletion. Full Page checks its URL,
hidden toolbar, automatic keyboard and hold-to-exit. Orientation and eips are
recording substitutes, not hardware tests. Test profiles and fixture URLs are
local and disposable.

For an actual Kindle, run `scripts/check.sh` from the installed application.
A version/self-test success still does not demonstrate page rendering.
