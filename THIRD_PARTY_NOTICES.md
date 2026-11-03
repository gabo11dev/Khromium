# Third-party components

## Chromium engine

Release engine: Raspberry Pi Debian package `chromium-headless-shell`, version `1:156.0.8078.73-1~deb12u1+rpt1`, plus matching `chromium-common` data. Package and corresponding source files are provided in the [Raspberry Pi Chromium archive](https://archive.raspberrypi.com/debian/pool/main/c/chromium/). For the exact original package hashes, see `manifest.json` in the binary distribution. Chromium is subject to its upstream BSD license and the licenses of its many third-party dependencies; the package copyright notice is included in `licenses/`.

Only the existing ELF interpreter string is changed, using `scripts/patch-interpreter.py`. No browser engine code is rebuilt or modified. The original binary and source package remain available at the archive above.

## Debian runtime

The binary release includes private Debian 12 ARMhf shared libraries and DejaVu Sans. Individual packages, copyright notices, source references and license texts are included in the binary release's `licenses/` directory. Corresponding Debian package sources are available from [Debian Sources](https://sources.debian.org/) and the [Debian package pool](https://deb.debian.org/debian/pool/); select the exact versions listed in the packaged component copyright/source metadata. These components are not covered by Khromium's MIT license.

## Dino

`third_party/dino/*.ts` and `assets/dino-1x.png` / `dino-2x.png` originate from Chromium 156.0.8078.79, `components/neterror/resources/dino_game` and its image resources. Their license is `third_party/dino/LICENSE` (Chromium BSD).

`bundle-dino.js` transpiles the original game and supplies a minimal module loader, English localization/assertion shims, and a no-audio adapter for the offline GTK2 view. `assets/dino.html` adds a touch Jump button. Original TypeScript is retained for review and rebuilding.

## jsmn

`frontend/vendor/jsmn.h` retains its MIT copyright and permission notice.

## GTK2

The frontend links dynamically to GTK2, GLib, Cairo and Pango supplied by the Kindle firmware. These firmware libraries are not redistributed by this project. Cross-compilation uses Chromium's downloaded Debian Bullseye sysroot.
