# Project Detail - Rest Set Timer

## Product Memo
**Rest Set Timer** is a minimalist, single-purpose web application designed for gym goers who need a simple, distraction-free way to time their rest periods and count their sets.

**What it IS:**
- A simple countdown timer with presets.
- A manual set counter.
- A dark, modern, visually pleasing interface.
- A locally-persisted tool (settings saved to device).

**What it IS NOT:**
- A workout tracker (no exercise names, no logging history).
- A complex interval timer (no rounds, no work/rest loops).
- A social app (no sharing).
- A cloud-synced app (no backend).

## User Flows

### 1. Preset Selection
- User opens app.
- User taps "60s".
- Timer updates to `01:00`.
- (Optional: Timer auto-starts if setting enabled).
- If not auto-start, user taps big "Start" button.

### 2. Timer Execution
- Timer counts down: `00:59` -> `00:00`.
- Ring visual indicates progress.
- At `00:00`:
    - Screen flashes (optional subtle visual cue).
    - Audio beep plays.
    - Phone vibrates (if supported).
    - "Current Set" counter increments (e.g., 4 -> 5).
    - Timer resets to `01:00` (ready for next set).

### 3. Manual Adjustments
- User forgot to track a set -> Tap `+` button on set counter.
- User wants a custom time -> Tap `Custom` preset -> Enter `02:15` -> Confirm.
- User wants to reset sets for new exercise -> Tap `Reset Sets` in settings (or long press set counter - TBD). *For MVP, we'll put a reset icon near the counter or in the settings.*

## Future Enhancements
- [ ] PWA Installation (Add manifest & Service Worker).
- [ ] Wake Lock API integration (keep screen on).
- [ ] Multiple workout profiles (e.g., "Strength", "Hypertrophy" presets).
- [ ] Theme selector.
