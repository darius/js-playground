'use strict';

var animating = function(render) {
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
