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
