# Alpha 0.0.1 validation — 2026-11-03

- GTK2 frontend compiled for ARMv7 hard-float/NEON and amd64 with warnings treated as errors. The ARM binary requires glibc symbol versions no newer than GLIBC_2.9.
- Integration harness passed with native Chromium headless-shell 156.0.8078.79.
- The same harness passed with the release ARM engine 156.0.8078.73, emulated as Cortex-A9 with Linux 4.1.15 ABI. Emulator-only process flags are not included in the Kindle launcher.
- Verified local home title and initial WWW selection, direct-address/search resolution, bottom keyboard opening without a focused field, Shift and Enter delivered to a real web input, Android 11 user agent and mobile client hints, saved search/UA preferences, both initial favorite URLs, saving the current page, Settings creation, deleting an actual test cookie, and the bundled Dino canvas startup/Jump action.
- Inspected desktop captures of home, keyboard, Settings and Favorites. Desktop captures do not include the Kindle system status bar.
- The final ZIP's ARM engine returned `Chromium 156.0.8078.73` under emulation with the new `/mnt/us/khromiumld.so` interpreter and the packaged private libraries.
- Packager checks that every engine/runtime NEEDED library is included, tests ZIP integrity, and writes an internal SHA256SUMS.txt. Launcher scripts passed shell syntax validation.

Not yet verified on physical hardware: this new frontend's layout/touch behavior, the native Kindle clock/battery bar requested through `PC:T`, modeless dialog behavior and long-running memory use. The owner reported the earlier GTK2 prototype worked on the same PW4; that does not constitute a hardware test of this release.


# Alpha 0.0.2 validation — 2026-11-03

- ARMv7 and amd64 frontends compiled with warnings treated as errors.
- Extended the integration test to press the actual visible keyboard buttons and enter `hIñÑ`, delete an additional character, and send Enter to a real Chromium input.
- Verified the keyboard has no visible heading/preview bar, its key area is at least 390 pixels tall, and it still opens/closes independently of input focus.
- Opened the new More menu and activated Settings through its real menu item. Existing cookies, preferences, favorites, UA and Dino integration checks still pass.
- Inspected the rendered keyboard, menu and new Reload icon on the native test display. Physical Kindle appearance and native system status bar still require device confirmation.

# Khromium 156.0 HF — validation, 2026-11-03

- ARMv7 hard-float and desktop test builds compile with `-Wall -Wextra -Werror`.
- Normal and Full Page integration tests pass with a real Chromium 156 engine on an isolated desktop virtual display.
- No visible secondary GTK windows and no combo boxes in the new panels. Search and UA are selected through actual radio buttons; cookies and preference persistence are verified.
- Independent UI/page scale is saved. At 150% page scale the engine reports devicePixelRatio 1.5 and the expected narrower CSS viewport. Landscape at 150% UI scale retains at least 200 pixels of page area.
- Actual GTK input taps on Back/Forward/Reload navigate A → B → A, reload A (load count increases), and return to B. Reload also closes an open menu panel.
- The real visible keyboard buttons enter `hIñÑ`, delete an extra letter, send Enter, and send all four arrow events. After blur the keyboard closes; the resulting page-image height matches the expanded viewport. Manually reopened Down scrolls the page.
- Screen Refresh is tapped through GTK. A recording eips substitute confirms invocation with exactly `-c`; the production callback runs `eips -c > /dev/null 2>&1` and repaints on completion. No physical framebuffer is accessed in the desktop test.
- Existing Chrome/Chromium Settings and Dino entries are removed while a custom favorite is preserved. Fresh profiles have no seeded internal favorites. Removed internal URLs are rejected.
- Full Page reads the separately configured local URL, hides toolbar/status, opens/closes the keyboard with focus/blur, and exits through the real two-second upper-left hold timer.
- A recording orientation helper verifies U/R/D/L mapping, saved normal/full-page selections, requests and restoration. These are integration-request tests, not proof of physical screen rotation.
- The 156.0 RC1 is republished as 156.0 HF. Only version/publication labels change; browser behavior and bundled engine/runtime are unchanged.

Still requires a PW4 test: physical orientation in all four positions, native window-manager sizing, e-ink screen clearing/repainting and the final touch layout. The previous user photos confirmed the old popup-menu/combobox problem; HF replaces those popup surfaces completely.
