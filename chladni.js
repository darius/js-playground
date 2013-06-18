'use strict';

// Make Chladni figures by crude physical simulation of a 
// grid of coupled oscillators all driven together.
// XXX this sucks, strip it down until you know why

var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext('2d');

var canvasBounds = canvas.getBoundingClientRect();
var mouseX = 100;
var mouseY = 20;
function onMousemove(event) {
    mouseX = event.clientX - canvasBounds.left;
    mouseY = event.clientY - canvasBounds.top;
}
canvas.addEventListener('mousemove', onMousemove);
// To get the initial position before any mousemove:
document.addEventListener('mouseover', onMousemove);

var ww = (width/10) | 0;
var hh = (height/10) | 0;
var V = new Array(ww * hh);
var D = new Array(ww * hh);

(function() {
    for (var y = 0; y < hh; ++y)
        for (var x = 0; x < ww; ++x)
            V[at(x, y)] = D[at(x, y)] = 0;
})();

function at(x, y) {
    return ww*y + x;
}

var tau = 2 * Math.PI;
var freq = 1/50.213432144321;
var K = .3;
var damp = .5;
var L = .8;
var omega = freq * tau;
var dt = .01;

var time = 0;

function tick() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';

    var drive = // time ? 0 :
        Math.cos(omega * time);
    for (var y = 1; y < hh-1; ++y)
        for (var x = 1; x < ww-1; ++x) {
            var xy = at(x, y);
            var F = (.1 * drive
                     - K * D[xy]
                     + L * (D[at(x+1,y)] + D[at(x-1,y)] + D[at(x,y+1)] + D[at(x,y-1)] - 4*D[xy])
                     - damp * V[xy]);
            D[xy] += V[xy] * dt;
            V[xy] += F * dt;

            var d = D[xy]*2000;
            while (Math.abs(d) > 100) d /= 10;
            if (d < 0)
                ctx.fillRect(10*x+d, 10*y, -d, 1);
            else
                ctx.fillRect(10*x, 10*y, d, 1);
        }
    console.log(d);
    time += 1;
}

var animating = function(render) {
    schedule(function(then) {
        function loop(now) {
            if (!render(now - then, now))
                schedule(loop);
            then = now;
        }
        if (!render(0, then))
            schedule(loop)
    });
};

var schedule = requestAnimationFrame;
var schedule1 = function(f) {
    return setTimeout(f, 1000);
};
