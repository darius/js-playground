'use strict';

var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext("2d");

var ww = (width/10) | 0;
var hh = (height/10) | 0;

function tick(delta, time) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, width, height);
    for (var yy = 0; yy < hh; ++yy)
        for (var xx = 0; xx < ww; ++xx) {
            var cx = 5 + 10*xx;
            var cy = 5 + 10*yy;
            var rate = (xx + yy) / (hh + ww);
            spin(cx, cy, 5, rate, time);
        }
}

var minspeed = .001;
var maxspeed = .010;

function spin(cx, cy, r, rate, time) {
    var omega = minspeed + (maxspeed-minspeed) * rate;
    var angle = omega * time;
    var x = r * Math.cos(angle);
    var y = r * Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(cx - x, cy - y);
    ctx.lineTo(cx + x, cy + y);
    ctx.stroke();
}

function animating(render) {
    requestAnimationFrame(function(then) {
        function loop(now) {
            if (!render(now - then, now))
                requestAnimationFrame(loop);
            then = now;
        }
        if (!render(0, then))
            requestAnimationFrame(loop)
    });
}
