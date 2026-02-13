# Rest Set Timer

A minimal, dark-themed gym rest timer with a set counter.
Built with pure HTML, CSS, and Vanilla JS.

## Features
- **Countdown Timer**: Circular progress, large display.
- **Quick Presets**: 30s, 60s, 90s, etc.
- **Set Counter**: Track your sets (auto-increments on timer finish).
- **Customizable**: Sound, vibration, auto-start options.
- **Offline Capable**: Runs locally, no internet needed.

## Setup
1. Clone the repo or download the files.
2. Open `index.html` in any modern browser.
3. No build steps (npm/yarn) required.

## Structure
- `startTimer()` loop is handled in `app.js`.
- Styles are in `styles.css`.
- App state is persisted to `localStorage`.

## Future Plans
- PWA Support (see `documentation/PWA.md`).
