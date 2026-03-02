let timerId = null;

self.onmessage = function (e) {
    if (e.data === 'start') {
        if (timerId) clearInterval(timerId);
        // Tick every 250ms to check the remaining time
        timerId = setInterval(() => {
            self.postMessage('tick');
        }, 250);
    } else if (e.data === 'stop') {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
    }
};
