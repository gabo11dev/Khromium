# Changelog

## Khromium 156.0 SF Build 1 — Alpha

- First experimental frontend build for the legacy Kindle soft-float ABI, intended for PW3 firmware <= 5.16.2.1.1.
- Uses the KOReader kindlepw2 compiler, `/lib/ld-linux.so.3`, base AAPCS/softfp and GLIBC symbols no newer than 2.9.
- Separate SF application directory, engine loader and profile; preserves the PW4 installation.
- Includes the newer in-window panels, radio selectors, independent scales, four orientations, Full Page, keyboard arrows, navigation and repaint changes.
- Removed Chrome/Chromium Settings and Dino shortcuts; settings remain available through More.
- Startup diagnostics and pinned build inputs included.
- Chromium engine remains ARMhf in a separate process. No full soft-float Chromium rebuild is claimed.
- ALPHA: no physical PW3 available; actual compatibility and kernel support remain unconfirmed.
