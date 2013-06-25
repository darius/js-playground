'use strict';

var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext('2d');

var radius = 2.5;
var diameter = 2*radius;
var minspeed = .001;
var maxspeed = .003;

var ww = (width/diameter) | 0;
var hh = (height/diameter) | 0;

function tick(delta, time) {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1; //0.75 + 0.5 * Math.sin(0.0001 * time);
    ctx.clearRect(0, 0, width, height);
    ctx.beginPath();
    for (var sum = 0; sum < hh+ww; ++sum) {
        var rate = sum / (hh + ww);
        var omega = minspeed + (maxspeed-minspeed) * rate;
        var angle = omega * time;
        var x = (2+radius) * Math.cos(angle);
        var y = (2+radius) * Math.sin(angle);
        for (var yy = 0; yy < hh; ++yy) {
            var xx = sum - yy;
            var cx = radius + diameter*xx;
            var cy = radius + diameter*yy;
            ctx.moveTo(cx - x, cy - y);
            ctx.lineTo(cx + x, cy + y);
        }
    }
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
