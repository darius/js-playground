'use strict';

// Repeatedly call render(timeInterval, time) at intervals until it
// returns truthy. Times are in milliseconds. Intervals are scheduled
// by requestAnimationFrame, so the times are when canvas update is
// scheduled, not when the render function is called.
function animating(render) {
    scheduleFrame(function(then) {
        function loop(now) {
            if (!render(now - then, now))
                scheduleFrame(loop);
            then = now;
        }
        if (!render(0, then))
            scheduleFrame(loop)
    });
};

var scheduleFrame = requestAnimationFrame;

// For debugging, do this:
// scheduleFrame = slowly
function slowly(f) { return setTimeout(f, slowDelay); }
var slowDelay = 1000;
