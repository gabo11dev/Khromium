# Khromium 156.0 HF

A local Chromium 156 browser for the jailbroken **Kindle Paperwhite 4, firmware 5.17.1**, with a GTK2 touch interface and on-screen keyboard.

**This is the hard-float (HF) release of the previously delivered 156.0 RC1.** It is published as a normal GitHub release. The SF/PW3 alpha is a separate build; do not use it for this target.

**AI disclosure:** developed with substantial AI assistance, including generated code and documentation. This is an independent experiment, unaffiliated with Amazon or Chromium.

HF means hard-float firmware. This package targets PW4 firmware 5.17.1; it is not the SF/PW3 package. Other hard-float models/firmware have not been validated.

## Install or update

Close Khromium before replacing files.

- **Existing Khromium Alpha 0.0.1, 0.0.2 or 156.0 RC1:** extract `Khromium-156.0-HF-update.zip` into the Kindle USB root and replace matching files. Keep `extensions/khromium/state` to preserve your browsing data. The engine, runtime and loader are unchanged.
- **New installation:** extract `Khromium-156.0-HF-PW4.zip` into the Kindle USB root. Keep `khromiumld.so` directly at the root and the app at `extensions/khromium`. About 260 MB free storage plus website data is required. KUAL and an already jailbroken PW4 are required.

Safely eject, reopen KUAL and refresh/reload its menu if it still shows the old entries. This package does not jailbreak, update firmware or replace system libraries.

## KUAL entries

```text
Khromium >
    Open Khromium
    Close Khromium
Khromium Full Page
```

The Full Page item is on KUAL's main page. It starts the configured URL with no browser toolbar or Kindle status bar. Switching between normal and Full Page closes the previous browser instance, so both modes share the same profile safely.

To exit Full Page, **hold the upper-left 60 × 60 pixels for two seconds** without moving. You can also use Close Khromium from KUAL after returning to the launcher. Exiting restores the system orientation captured at launch.

## Normal browser

The toolbar provides Home, Back, Reload, Forward, address/search, Keyboard, **Refresh screen**, More and Exit. The normal mode requests the Kindle's own clock/battery status bar.

- Back/Forward use Chromium's navigation history. Reload refreshes the current document.
- The screen-refresh button, next to Keyboard, executes exactly `eips -c > /dev/null 2>&1`, then repaints the application when the command finishes.
- Keyboard can be toggled manually with no text field selected. When a web text field receives focus it opens automatically; when focus leaves it closes automatically. Manually opened keyboard stays available for page control until you toggle it off or tap the page.
- The keyboard includes Shift, ñ/Ñ, symbols, Space, Backspace, Enter and **← ↑ ↓ →**. Arrows move the cursor in text fields and send arrow keys to the page otherwise. On ordinary pages Up/Down scroll; sites can use arrows for their own controls.
- Vertical swipes also scroll the page.
- More opens an **in-window panel** with History, Favorites and Settings. No GtkMenu, combo-box popup or separate settings window is used: this avoids Kindle window-manager decoration and clipping of popup controls.
- Favorites stores pages and reopens them in the current view. There are no simultaneous tabs. Favorites initially starts empty in HF.
- Dino and the `chrome://settings`, `chromium://settings`, `chrome://dino` and `chromium://dino` shortcuts have been removed. Saved entries for those routes are removed from existing favorites/history; other saved pages are preserved. If one was your homepage/full-page URL, it falls back to the Khromium home page. Old bundled Dino files are cleaned up at launch after updating.

## Settings

Use More → Settings. Options are divided into three pages with visible buttons; there are **no dropdown menus**. Changes apply after pressing **Save**; Close/Cancel discard unsaved changes.

### General

- Homepage and Default home.
- Delete cookies.
- Default search: WWW (direct address), Google or DuckDuckGo, selected using radio buttons.
- User agent: Debian 13 or Android 11, also using radio buttons. This changes identification/client hints; it does not install a different operating system.

WWW opens input directly as an address, adding `https://` when needed. It does not send the input to a search provider. Text with spaces requires Google or DuckDuckGo.

### Display

- **Browser interface scale:** 75–150% in 25-point steps. Changes toolbar, settings and keyboard size.
- **Page scale:** 50–250% in 25-point steps. Changes website content independently of the browser interface. Applies in normal and Full Page modes. Input coordinates follow this scale.
- **Browser orientation:** Portrait, Landscape, Portrait inverted or Landscape inverted.

The keyboard uses shorter keys in landscape to retain page space.

### Full Page

- URL opened by KUAL's **Khromium Full Page** entry.
- Separate orientation: Portrait, Landscape, Portrait inverted or Landscape inverted.

Use the normal browser to configure Full Page before launching it. Full Page has automatic keyboard behavior and the same page scale. Its two-second upper-left exit gesture is available even if the website becomes unresponsive.

Orientation requests use the Kindle's existing `com.lab126.winmgr` service. No rotation tools or firmware patches are installed. See the community's [window-manager title documentation](https://kindlemodding.org/kindle-dev/awesome-window-manager/) and the [kterm orientation implementation](https://github.com/bfabiszewski/kterm/blob/master/kindle.c). Orientation is a real device integration and requires confirmation on the target Kindle.

## Validation and limits

See `VALIDATION.md`. Desktop tests exercise real Chromium navigation, reload, typing, automatic focus/blur, all four arrows, page zoom, cookie deletion, saved settings, profile migration and the Full Page exit gesture. Orientation and eips are tested through substitutes on the PC; real hardware rotation and e-ink refresh still need confirmation on the PW4.

HF also invalidates stale screenshot requests during navigation/resizing, retries stuck captures and repaints the whole viewport when the keyboard closes. The desktop test checks that the resulting page image again fills the expanded viewport.

The earlier GTK2 version ran on the owner's PW4; its photos confirmed that popup menus and combo boxes rendered incorrectly. That is not a physical test of this HF release.

The launcher runs Chromium **without its sandbox**, because the target kernel lacks required facilities. A malicious website exploiting Chromium could access files available to the browser. Avoid sensitive accounts and untrusted sites. HTTPS certificate validation remains enabled. There are no automatic security updates.

The Kindle has about 512 MB RAM. Complex pages can exhaust memory. Rendering is approximately one frame per second; video/animation, downloads, audio, extensions and desktop Chrome UI are not implemented.

Logs: `extensions/khromium/state/run.log`. Profile/settings: `state/profile/khromium.ini`, `favorites.ini`, `history.ini` and Chromium's profile files. Removing `state/profile` resets all browsing data. To uninstall, close the browser and remove `extensions/khromium` and the root `khromiumld.so`.

## Engine and build

The engine is the same Raspberry Pi Debian 12 ARMhf **Chromium headless-shell 156.0.8078.73**, with a private Debian 12 runtime/glibc 2.36. Its ELF interpreter string is changed to `/mnt/us/khromiumld.so`; browser engine code is unchanged. The GTK2 C frontend links against Kindle firmware libraries. The engine runs locally on the Kindle, not on a remote PC.

To build the frontend, set `CHROMIUM_SRC` to a Chromium checkout containing its Clang toolchain and Bullseye ARMhf GTK2 sysroot:

```sh
export CHROMIUM_SRC=/path/to/chromium/src
python3 frontend/build.py armhf
```

Output: `build/frontend-armhf/khromium`. This release used the 156.0.8078.79 checkout/compiler. Keep compatibility with the Kindle's older GTK2/GLib. For a native desktop build, install GTK2 development files and use `python3 frontend/build.py amd64` (or the amd64 Chromium sysroot).

```sh
build/frontend-amd64/khromium --engine /absolute/path/chrome-headless-shell \
  --profile /tmp/khromium-profile --assets "$PWD/assets"
# Add --full-page for the separate mode; only add --unsafe-no-sandbox if needed.
```

The packager reuses the original prototype's runtime/licenses and an unmodified extracted ARM engine directory:

```sh
python3 scripts/package.py --base /path/chromium-pw4-156-experimental.zip \
  --engine-dir /path/extracted/usr/lib/chromium --output /path/Khromium-156.0-HF-PW4.zip
```

The source archive is included with this local distribution. Original code is MIT licensed; Chromium, jsmn and runtime components retain their own licenses. See `THIRD_PARTY_NOTICES.md` and the binary distribution's `licenses` directory.
