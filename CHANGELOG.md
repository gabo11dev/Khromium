# Khromium 156.0 HF

Normal GitHub release of the previously delivered 156.0 RC1. Version/publication labels are updated to HF; browser behavior, installation paths and engine/runtime are unchanged. The SF alpha targets legacy firmware separately.

# Changelog

## 156.0 HF — local distribution only

- Replaced popup menus/settings dialogs with in-window panels and visible search/user-agent radio buttons to avoid Kindle clipping and black dropdowns.
- Added independent browser interface and website scales, plus separate normal/full-page orientations.
- Added the KUAL Khromium submenu (Open/Close) and a separate Full Page launch entry with configurable URL.
- Added automatic keyboard focus/blur handling and all four arrow keys.
- Added the screen-refresh button next to Keyboard, running the requested eips clear command followed by repainting.
- Fixed stale captures across navigation and keyboard resize, and verified Back/Forward/Reload using actual GTK input.
- Removed Dino and the Chrome/Chromium Settings and Dino routes, including migration of old default saved entries.
- Published as the normal 156.0 HF GitHub release.

## Alpha 0.0.2

- Increased keyboard key height from 68 to 96 pixels and enlarged key labels.
- Removed the heading/preview bar above the keyboard. Use the toolbar Keyboard button to show or hide it.
- Added ñ and uppercase Ñ, including UTF-8 backspace support.
- Recreated the More menu with a Kindle-inspired white panel, large touch rows, separators and navigation chevrons.
- Redrew the Reload icon with a circular arrow and a connected arrowhead.

## Alpha 0.0.1

Initial GTK2 Khromium interface, offline start page, search selection, history/favorites, settings, on-screen keyboard and native Kindle status-bar request.
