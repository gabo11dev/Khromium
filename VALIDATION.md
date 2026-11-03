# Khromium 156.0 SF Build 1 — Alpha validation

Date: 2026-11-03. **No PW3 is available, and no physical PW3 was tested.**
This document distinguishes emulator observations from device compatibility.

## Completed checks

- Cross-compiled the production GTK2 frontend with KOReader kindlepw2 GCC 14.4.0, `-march=armv7-a -mfpu=neon -mfloat-abi=softfp`, and `-Wall -Wextra -Werror`.
- ELF inspection confirms `/lib/ld-linux.so.3`, base ARM procedure-call ABI (no VFP-register argument ABI), ARMv7/NEON, and only GLIBC_2.4 / GLIBC_2.9 version requirements. This is a real SF frontend build, not a renamed ARMhf executable.
- Protocol self-test passes with the SF binary under QEMU ARM Cortex-A9, with the reported kernel release set to 3.0.35.
- Ran the real SF integration executable, old ARMEL GTK2 libraries and real ARMhf Chromium 156.0.8078.73 engine together under QEMU user-mode and native Xvfb. Both normal and Full Page test suites passed.
- Normal suite: one visible GTK window, no combo boxes, radio selection, cookies deletion, saved settings, custom favorite preservation and retired internal-URL removal.
- At 150% page scale, the engine reports devicePixelRatio 1.5 and the corresponding CSS viewport width. Independent UI scale persists; landscape at 150% UI scale retains page space.
- Actual GTK toolbar taps go A → B → Back to A, Reload A (load count 2 → 3), then Forward to B. Reload closes an open panel.
- The keyboard enters `hIñÑ`, deletes an extra character, sends Enter and all four Arrow events. Blur hides the keyboard, and the decoded page image fills the expanded viewport. Manually opened Down scrolls the page by 40 CSS pixels.
- Full Page loads its own configured URL, hides the browser toolbar, automatically opens/closes the keyboard, types ñ, and exits through the two-second corner hold.
- A recording substitute receives `eips -c`; a recording orientation helper verifies requests/restoration. No physical e-ink framebuffer or actual rotation was exercised.
- Package construction checks private engine-library dependencies, checksums and ZIP integrity. The production package excludes development sysroots, compilers, profiles and test core dumps.

## Important limits

QEMU user-mode uses the host PC's kernel. `-r 3.0.35` changes the release reported
to the emulated program; it does not emulate the PW3 kernel, its available
syscalls, vendor changes, drivers or kernel helper page. The included engine
runtime declares Linux 3.2, so compatibility with the PW3's older kernel remains
unconfirmed. Emulator engine tests also use single-process/no-zygote/in-process
GPU flags that are not part of the production launcher.

The old GTK2 test runtime is from Debian Wheezy, not a PW3 firmware extraction.
The device's exact GTK/GLib symbols, WM behavior, eips repaint, native status bar,
orientation, touch input, HTTPS networking, available RAM, child processes and
long-running behavior must still be tested on real hardware. A successful
version/self-test check does not establish those properties.

**Build 1 is an experimental alpha candidate, not a device-certified port.**
