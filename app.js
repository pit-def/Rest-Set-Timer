/**
 * Gym Rest Timer - App Logic (Redesign)
 */

const App = {
    // --- STATE ---
    State: {
        timer: {
            remaining: 0,
            total: 0,
            endTime: 0,
            status: 'IDLE', // IDLE, RUNNING, PAUSED
            animationFrame: null
        },
        sets: {
            current: 0,
            target: 10
        },
        settings: {
            soundEnabled: true,
            vibrationEnabled: true,
            startOnPreset: false,
            targetSets: 10,
            // Custom Presets (in seconds)
            custom1: 45,
            custom2: 0 // 0 means unset/hidden
        }
    },

    // --- STORAGE ---
    Storage: {
        KEY: 'rest-set-timer-data-v2', // v2 for new schema

        save() {
            const data = {
                sets: App.State.sets,
                settings: App.State.settings
            };
            localStorage.setItem(this.KEY, JSON.stringify(data));
        },

        load() {
            const data = localStorage.getItem(this.KEY);
            if (data) {
                const parsed = JSON.parse(data);
                if (parsed.sets) App.State.sets = { ...App.State.sets, ...parsed.sets };
                // Deep merge settings to ensure new keys exist
                if (parsed.settings) {
                    App.State.settings = { ...App.State.settings, ...parsed.settings };
                    // Ensure target is synced if loaded from settings
                    if (App.State.settings.targetSets) {
                        App.State.sets.target = App.State.settings.targetSets;
                    }
                }
            }
        }
    },

    // --- TIMER ENGINE ---
    Timer: {
        start(duration) {
            // New Start vs Resume
            const isNewSession = duration !== undefined;

            if (isNewSession) {
                App.State.timer.total = duration * 1000;
                App.State.timer.remaining = duration * 1000;
            } else if (App.State.timer.status === 'IDLE' && App.State.timer.remaining > 0) {
                // Start from current remaining (e.g. preset clicked but not auto-started)
                App.State.timer.total = App.State.timer.remaining; // Reset total for progress bar? No, keep visual? 
                // Actually, if we tap preset, we set total/remaining.
                // If we tap Start, we just run.
            }

            // AUTO-INCREMENT SET ON START (If coming from IDLE and it's a new "Go")
            // The requirement: "count the increment when the timer is started"
            // We should only increment if we are starting a FRESH timer, not resuming.
            // But if we pause and resume, we shouldn't increment.
            // If we reset and start, we increment.
            if (App.State.timer.status === 'IDLE') {
                App.Logic.incrementSet();
            }

            App.State.timer.status = 'RUNNING';
            App.State.timer.endTime = Date.now() + App.State.timer.remaining;

            App.UI.updateControls();
            this.loop();
        },

        pause() {
            App.State.timer.status = 'PAUSED';
            cancelAnimationFrame(App.State.timer.animationFrame);
            App.UI.updateControls();
        },

        reset() {
            App.State.timer.status = 'IDLE';
            cancelAnimationFrame(App.State.timer.animationFrame);
            App.State.timer.remaining = App.State.timer.total;

            App.UI.renderTimer(App.State.timer.remaining, 1);
            App.UI.updateControls();
        },

        loop() {
            const now = Date.now();
            const remaining = App.State.timer.endTime - now;

            if (remaining <= 0) {
                this.complete();
            } else {
                App.State.timer.remaining = remaining;
                const progress = remaining / App.State.timer.total;
                App.UI.renderTimer(remaining, progress);
                App.State.timer.animationFrame = requestAnimationFrame(this.loop.bind(this));
            }
        },

        complete() {
            App.State.timer.status = 'IDLE';
            App.State.timer.remaining = 0;
            cancelAnimationFrame(App.State.timer.animationFrame);
            App.UI.renderTimer(0, 0);
            App.UI.updateControls();

            this.notify();

            // Reset to ready state after short delay
            setTimeout(() => {
                App.State.timer.remaining = App.State.timer.total;
                App.UI.renderTimer(App.State.timer.remaining, 1);
            }, 1000);
        },

        notify() {
            if (App.State.settings.soundEnabled) {
                const audio = document.getElementById('timer-sound');
                if (audio) {
                    audio.currentTime = 0;
                    audio.play().catch(e => console.log('Audio play blocked', e));
                }
            }
            if (App.State.settings.vibrationEnabled && navigator.vibrate) {
                navigator.vibrate([500, 200, 500]);
            }
        }
    },

    // --- LOGIC ---
    Logic: {
        setDuration(seconds, isInteractive = true) {
            if (App.State.timer.status === 'RUNNING') {
                App.Timer.pause();
            }

            App.State.timer.status = 'IDLE';
            App.State.timer.total = seconds * 1000;
            App.State.timer.remaining = seconds * 1000;

            App.UI.renderTimer(App.State.timer.remaining, 1);
            App.UI.highlightPreset(seconds);
            App.UI.updateControls();

            if (isInteractive && App.State.settings.startOnPreset) {
                App.Timer.start(seconds);
            }
        },

        incrementSet() {
            App.State.sets.current++;
            App.Storage.save();
            App.UI.renderSets();
        },

        resetSets() {
            App.State.sets.current = 0;
            App.Storage.save();
            App.UI.renderSets();
        }
    },

    // --- UI ---
    UI: {
        // Elements cache
        elements: {},
        // Picker instances
        pickers: {},

        init() {
            this.cacheElements();
            this.bindEvents();
            this.refreshCustomPresets();
            this.loadSettingsToUI();

            App.UI.renderSets();
            // Default 60s - Do not auto-start on load
            App.Logic.setDuration(60, false);
        },

        cacheElements() {
            this.elements = {
                timerTime: document.getElementById('timer-time'),
                timerRingProgress: document.querySelector('.timer-ring-progress'),
                btnStartHint: document.getElementById('btn-start-hint'),

                presetsContainer: document.getElementById('presets-grid'),
                btnCustom1: document.getElementById('btn-custom-1'),
                btnCustom2: document.getElementById('btn-custom-2'),
                lblCustom1: document.getElementById('lbl-custom-1'),
                lblCustom2: document.getElementById('lbl-custom-2'),

                setCurrent: document.getElementById('set-current'),
                setTarget: document.getElementById('set-target'),
                btnResetSets: document.getElementById('btn-reset-sets-main'),

                btnSettings: document.getElementById('btn-settings'),
                modalSettings: document.getElementById('modal-settings'),
                btnCloseSettings: document.getElementById('btn-close-settings'),
                btnSaveSettings: document.getElementById('btn-save-settings'),

                // Settings Inputs
                settingSound: document.getElementById('setting-sound'),
                settingVibration: document.getElementById('setting-vibration'),
                settingStartPreset: document.getElementById('setting-start-preset'),

                // Picker Containers
                pickerC1: document.getElementById('picker-c1'),
                pickerC2: document.getElementById('picker-c2'),
                pickerTargetSets: document.getElementById('picker-target-sets'),
            };
        },

        bindEvents() {
            const els = this.elements;

            // Timer Trigger (Tap the timer area or hint)
            els.btnStartHint.addEventListener('click', () => {
                if (App.State.timer.status === 'RUNNING') {
                    App.Timer.pause();
                } else {
                    App.Timer.start();
                }
            });
            // Make the big time text clickable too?
            els.timerTime.addEventListener('click', () => els.btnStartHint.click());

            // Presets
            els.presetsContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.preset-card');
                if (!card) return;

                if (card.dataset.seconds) {
                    App.Logic.setDuration(parseInt(card.dataset.seconds));
                } else if (card.dataset.custom) {
                    const id = parseInt(card.dataset.custom);
                    const val = id === 1 ? App.State.settings.custom1 : App.State.settings.custom2;

                    if (val && val > 0) {
                        App.Logic.setDuration(val);
                    } else {
                        // If empty, open settings
                        this.openSettings();
                    }
                }
            });

            // Set Counter
            els.btnResetSets.addEventListener('click', () => App.Logic.resetSets());

            // Settings Modal
            els.btnSettings.addEventListener('click', () => this.openSettings());
            els.btnCloseSettings.addEventListener('click', () => this.closeSettings());
            els.btnSaveSettings.addEventListener('click', () => this.saveSettings());

            // Outside click close modal
            window.addEventListener('click', (e) => {
                if (e.target === els.modalSettings) this.closeSettings();
            });

            // Spacebar
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    els.btnStartHint.click();
                }
            });

            // Initialize Pickers
            this.pickers.c1 = new TimePicker(els.pickerC1, App.State.settings.custom1);
            this.pickers.c2 = new TimePicker(els.pickerC2, App.State.settings.custom2);
            this.pickers.targetSets = new NumberPicker(els.pickerTargetSets, App.State.sets.target);
        },

        openSettings() {
            // Refresh pickers with current state
            this.pickers.c1.setValue(App.State.settings.custom1);
            this.pickers.c2.setValue(App.State.settings.custom2);
            this.pickers.targetSets.setValue(App.State.sets.target);

            // Load toggles
            const s = App.State.settings;
            this.elements.settingSound.checked = s.soundEnabled;
            this.elements.settingVibration.checked = s.vibrationEnabled;
            this.elements.settingStartPreset.checked = s.startOnPreset;

            this.elements.modalSettings.classList.remove('hidden');
        },

        closeSettings() {
            this.elements.modalSettings.classList.add('hidden');
        },

        saveSettings() {
            const els = this.elements;
            const s = App.State.settings;

            // Save Toggles
            s.soundEnabled = els.settingSound.checked;
            s.vibrationEnabled = els.settingVibration.checked;
            s.startOnPreset = els.settingStartPreset.checked;

            // Save Pickers
            s.custom1 = this.pickers.c1.getValue();
            s.custom2 = this.pickers.c2.getValue();

            const newTarget = this.pickers.targetSets.getValue();
            App.State.sets.target = newTarget;
            s.targetSets = newTarget;

            App.Storage.save();
            App.UI.renderSets(); // Update UI immediately

            App.Storage.save();
            this.refreshCustomPresets();
            this.closeSettings();
        },

        refreshCustomPresets() {
            const { custom1, custom2 } = App.State.settings;
            // Helper to format MM:SS
            const fmt = (s) => {
                if (!s) return '--:--';
                const m = Math.floor(s / 60);
                const sec = s % 60;
                return `${m}:${sec.toString().padStart(2, '0')}`;
            };

            this.elements.lblCustom1.textContent = fmt(custom1);
            this.elements.lblCustom2.textContent = fmt(custom2);
        },

        loadSettingsToUI() {
            this.elements.setTarget.textContent = App.State.sets.target;
        },

        renderTimer(ms, progress) {
            const totalSeconds = Math.ceil(ms / 1000);
            const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const s = (totalSeconds % 60).toString().padStart(2, '0');

            this.elements.timerTime.textContent = `${m}:${s}`;

            const circumference = 816.8;
            const offset = circumference - (progress * circumference);
            this.elements.timerRingProgress.style.strokeDashoffset = offset;
        },

        renderSets() {
            this.elements.setCurrent.textContent = App.State.sets.current.toString().padStart(2, '0');
            // Assuming target doesn't change often, but if it does:
            this.elements.setTarget.textContent = App.State.sets.target;
        },

        updateControls() {
            const els = this.elements;
            const isRunning = App.State.timer.status === 'RUNNING';

            if (isRunning) {
                els.btnStartHint.innerHTML = '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg><span>Tap to Pause</span>';
                els.btnStartHint.style.color = '#fff';
            } else {
                els.btnStartHint.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg><span>Tap to Start</span>';
                els.btnStartHint.style.color = 'var(--primary)';
            }
        },

        highlightPreset(seconds) {
            const all = document.querySelectorAll('.preset-card');
            all.forEach(c => c.classList.remove('active'));

            // Check standard presets
            let match = document.querySelector(`.preset-card[data-seconds="${seconds}"]`);

            // Check custom presets
            if (!match) {
                if (App.State.settings.custom1 === seconds) {
                    match = document.getElementById('btn-custom-1');
                } else if (App.State.settings.custom2 === seconds) {
                    match = document.getElementById('btn-custom-2');
                }
            }

            if (match) match.classList.add('active');
        }
    }
};

/**
 * Helper Class for Scrollable Picker
 */
class TimePicker {
    constructor(containerElement, initialTotalSeconds) {
        this.container = containerElement;
        this.render();
        this.minScroll = this.container.querySelector('.col-min');
        this.secScroll = this.container.querySelector('.col-sec');

        // Populate
        this.populate(this.minScroll, 10, 'MINS'); // Limit to 10 mins for now? Or 60. 
        this.populate(this.secScroll, 60, 'SECS');

        this.setValue(initialTotalSeconds || 0);
    }

    render() {
        this.container.innerHTML = `
            <div class="picker-column col-min"></div>
            <div class="picker-column col-sec"></div>
        `;
    }

    populate(element, count, label) {
        // Add empty padding for center alignment
        // Height of container is 100px. Item is 32px.
        // Padding top = (100 - 32) / 2 = 34px. (Handled in CSS)

        for (let i = 0; i < count; i++) {
            const div = document.createElement('div');
            div.className = 'picker-item';
            div.textContent = i.toString().padStart(2, '0');
            div.dataset.val = i;
            element.appendChild(div);
        }

        // Snap active logic
        element.addEventListener('scroll', () => {
            this.updateActive(element);
        });
    }

    updateActive(element) {
        const scrollTop = element.scrollTop;
        const itemHeight = 32;
        const index = Math.round(scrollTop / itemHeight);

        const items = element.querySelectorAll('.picker-item');
        items.forEach(i => i.classList.remove('selected'));

        if (items[index]) {
            items[index].classList.add('selected');
        }
    }

    setValue(totalSeconds) {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;

        const itemHeight = 32;

        this.minScroll.scrollTop = m * itemHeight;
        this.secScroll.scrollTop = s * itemHeight;

        this.updateActive(this.minScroll);
        this.updateActive(this.secScroll);
    }

    getValue() {
        const itemHeight = 32;
        const m = Math.round(this.minScroll.scrollTop / itemHeight);
        const s = Math.round(this.secScroll.scrollTop / itemHeight);
        return (m * 60) + s;
    }
}

/**
 * Picker for single number (e.g. Sets)
 */
class NumberPicker {
    constructor(container, initialValue) {
        this.container = container;
        this.render();
        this.scroll = this.container.querySelector('.col-num');
        this.populate(this.scroll, 50); // Max 50 sets
        this.setValue(initialValue || 10);
    }

    render() {
        this.container.innerHTML = `<div class="picker-column col-num" style="width: 100%;"></div>`;
    }

    populate(element, count) {
        // Start from 1? Usually sets are 1+. Let's say 1 to 50.
        for (let i = 1; i <= count; i++) {
            const div = document.createElement('div');
            div.className = 'picker-item';
            div.textContent = i.toString().padStart(2, '0');
            div.dataset.val = i;
            element.appendChild(div);
        }

        element.addEventListener('scroll', () => {
            this.updateActive(element);
        });
    }

    updateActive(element) {
        const scrollTop = element.scrollTop;
        const itemHeight = 32;
        const index = Math.round(scrollTop / itemHeight);

        const items = element.querySelectorAll('.picker-item');
        items.forEach(i => i.classList.remove('selected'));

        if (items[index]) {
            items[index].classList.add('selected');
        }
    }

    setValue(val) {
        // Val must be between 1 and 50
        const index = Math.max(0, val - 1);
        const itemHeight = 32;
        this.scroll.scrollTop = index * itemHeight;
        this.updateActive(this.scroll);
    }

    getValue() {
        const itemHeight = 32;
        const index = Math.round(this.scroll.scrollTop / itemHeight);
        return index + 1; // 1-based
    }
}

// Start App
document.addEventListener('DOMContentLoaded', () => {
    App.Storage.load();
    App.UI.init();
});
