# Khromium 156.0 SF Build 1

**ALPHA — experimental soft-float firmware build, targeting Kindle Paperwhite 3. No PW3 is available to the developer, and this release has NOT been tested on a physical PW3. Successful startup, rendering, touch input and stability on the device are unconfirmed.**

Khromium runs Chromium 156 locally with a GTK2 touch interface and an on-screen keyboard. It is not a remote browser. This SF edition uses a genuinely soft-float-ABI frontend and the existing ARMhf Chromium engine in a separate process with private libraries. “SF” describes compatibility of the frontend with the old Kindle userland; it does not mean the Chromium engine has been rebuilt as ARM soft-float.

**AI disclosure:** developed with substantial AI assistance, including generated code, build scripts and documentation. Independent project, not affiliated with Amazon, Google or Chromium.

## Target and unresolved compatibility

- Intended device: jailbroken Kindle Paperwhite 3 (7th generation), ARMv7 Cortex-A9, 512 MB RAM; firmware 5.16.2.1.1 or earlier using the soft-float ABI, with KUAL already installed.
- Not intended for hard-float firmware 5.16.3 or later. Keep the existing PW4 build on those systems.
- The frontend requests `/lib/ld-linux.so.3`, uses the base ARM calling convention (`-mfloat-abi=softfp`) and requires only GLIBC_2.4 / GLIBC_2.9 symbols. It uses the device's GTK2 libraries. Softfp can use hardware floating-point instructions while retaining the soft-float ABI.
- The separate Chromium 156.0.8078.73 engine is ARMhf, with private Debian 12/glibc 2.36 libraries and a separate loader. No system libraries are replaced.
- **Kernel compatibility remains unresolved:** that runtime declares Linux 3.2, while PW3 firmware commonly has a 3.0.35-based kernel. QEMU user-mode tests with a reported release of 3.0.35 cannot reproduce missing syscalls, vendor patches, kernel helpers or memory limits of a real PW3. An emulator pass is not proof that this package runs on the device.
- Heavy pages can exhaust the available memory. No claim of general compatibility with other old Kindles is made.

Hardware/firmware references: [barebox PW3 board documentation](https://barebox.org/doc/latest/boards/imx/amazon-kindle-6-7.html), [Amazon updates](https://www.amazon.com/gp/help/customer/display.html?nodeId=GKMQC26VQQMM8XSW), [Kindle ABI FAQ](https://kindlemodding.org/jailbreaking/Legacy/jailbreak-faq.html).

## Install

Use the **full SF ZIP**, not the PW4 update ZIP. Close other browser instances first.

1. Extract `Khromium-156.0-SF-Build-1-PW3-alpha.zip` into the Kindle USB root.
2. Keep `khromiumsfld.so` directly at the root and the application at `extensions/khromium-sf/`. About 260 MB plus browsing data is needed.
3. Eject safely and reload KUAL's menu.
4. Choose **Khromium SF (Alpha) → Open Khromium**.

KUAL also provides **Close Khromium** and a separate **Khromium SF Full Page** item. The SF edition has its own application directory, loader, preferences and profile; it does not overwrite the PW4 edition. Do not run both editions at once on a low-memory Kindle.

This package does not jailbreak the Kindle, update firmware, install a kernel or replace system libraries. To remove it, close it and delete `extensions/khromium-sf/` and `khromiumsfld.so`; the state subdirectory contains its browsing data.

## Browser features

- Home, Back, Reload, Forward, address/search, keyboard toggle, screen refresh, More and Exit.
- Refresh screen executes `eips -c > /dev/null 2>&1` and requests a repaint.
- Large bottom keyboard with Shift, ñ/Ñ, symbols, Enter and four arrow keys. Focus opens/closes it automatically; manual opening also permits page control.
- In-window History, Favorites and Settings panels; visible radio selectors replace popup dropdowns.
- No Chrome/Chromium Settings or Dino shortcuts. Browser settings remain under More → Settings.
- General settings: homepage, WWW/direct address, Google or DuckDuckGo, Android 11 or Debian 13 user agent, cookie deletion.
- Display settings: independent browser interface scale (75–150%), page scale (50–250%) and four orientations.
- Full Page settings: its own URL and orientation. Full Page hides the toolbar/status bar and uses the automatic keyboard.
- **Exit Full Page by holding the upper-left corner (60 × 60 pixels) for two seconds.**

Orientation, the native Kindle status bar, e-ink clearing and final touch layout all require physical-device testing.

## Diagnostics and testing

If it fails to start, read `extensions/khromium-sf/state/run.log`. From an existing Kindle shell, run:

```sh
sh /mnt/us/extensions/khromium-sf/check.sh
```

This writes `state/check.log` with system version, CPU features, memory and startup checks. Review logs before sharing them; do not upload your browsing profile or cookies. A successful version check alone does not establish browser compatibility.

See [VALIDATION.md](VALIDATION.md) for what was actually tested. There is no physical-PW3 validation or known-good-device claim for Build 1.

## Security and scope

Chromium runs **without its sandbox**, as in the existing Kindle build. A successful browser exploit could access files available to the process. HTTPS certificate verification remains enabled. There are no automatic security updates. Rendering is roughly one frame per second; this is not a video browser. Downloads, audio, desktop extensions and simultaneous tabs are not implemented.

## Build the frontend

On Linux x86-64, install Python 3, pkg-config, tar with zstd support and dpkg-deb. Then:

```sh
python3 scripts/prepare-sf.py
python3 frontend/build-sf.py
```

The preparation script downloads pinned [KOReader koxtoolchain 2026.08](https://github.com/koreader/koxtoolchain/releases/tag/2026.08) and Debian Wheezy ARMEL development packages into `build/`, verifies their SHA256 values and extracts them locally. It does not install them into the PC or Kindle. GCC 14.4.0 uses its own glibc 2.12.2 headers/start files; the GTK2 libraries are link-time inputs only, not redistributed as the frontend runtime.

`KINDLE_SF_TOOLCHAIN` and `KINDLE_SF_SYSROOT` can select existing directories. The resulting binary is `build/frontend-sf/khromium`. See `tests/README.md` for emulator limitations and test instructions. The packaged original frontend source, licenses and upstream Chromium source links are included; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
