# Architecture - Rest Set Timer

## Overview
This application is a single-page, static web app built with Vanilla JavaScript, HTML, and CSS. It uses no build tools or frameworks.

## Modules

The application logic is encapsulated within a global `App` object to prevent namespace pollution.

### 1. `App.State`
Holds the source of truth for the application.
- `timer`: { remaining, total, status (IDLE, RUNNING, PAUSED) }
- `sets`: { current, target }
- `settings`: { soundEnabled, vibrationEnabled, autoIncrement, startOnPreset }

### 2. `App.Storage`
Handles persistence to `localStorage`.
- Key: `rest-set-timer-settings`
- Saves: `settings`, `sets`. (Timer state is ephemeral).

### 3. `App.Timer`
Manages the countdown logic.
- Uses `requestAnimationFrame` for smooth UI updates of the ring.
- Uses `Date.now()` timestamps to calculate accurate remaining time (preventing drift from main thread blocking).
- Dispatches events or calls `App.UI` methods on tick and completion.

### 4. `App.UI`
Purely handles DOM manipulation.
- `renderTimer(displayTime, progress)`: Updates the text and the SVG ring DASHARRAY/OFFSET.
- `renderSets()`: Updates the set counter.
- `toggleModal()`: Shows/hides user interaction modals.

## Timer Loop Strategy
We use a "delta" approach for accuracy:
1. On **Start**: Record `endTime = Date.now() + remainingTime`.
2. On **Frame**: `now = Date.now()`, `remaining = Math.max(0, endTime - now)`.
3. Calculate visual progress `(remaining / totalDuration)` and update the SVG ring.
4. If `remaining === 0`: Stop loop, play sound, increment set, reset timer state.

## Persistence
Settings and current set progress are saved to `localStorage` whenever they change.
On load, we hydrate `App.State` from storage or fall back to defaults.
