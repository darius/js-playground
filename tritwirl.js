'use strict';

var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext('2d');

var radius = 10;
var diameter = 2*radius;
var minspeed = .001;
var maxspeed = .010;
var phasing = .00005;

var ww = (width/diameter) | 0;
var hh = (height/diameter) | 0;

function tick(delta, time) {
    ctx.lineWidth = 4;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';
    spinspinspin(time);
}

var tau = 2 * Math.PI;

// TODO: try different rate-gradients in the different directions
function spinspinspin(time) {
    var phase1 = phasing * time;
    var phase2 = 2 * phasing * time;
    var N = ww + 4;             // XXX
    for (var r = 0; r < N; ++r)
        for (var g = 0; g < N-r; ++g) {
            var b = N - (r+g);
            
            // (x,y) from http://www.redblobgames.com/grids/hexagons/#hex-to-pixel
            var cx = radius + (r + g/2) * Math.sqrt(3)/2 * diameter;
            var cy = radius + g * .75 * diameter;
            if (false) {
                drawPieSlice(cx, cy, r/N, time, 'rgba(255,255,255,1)', 0);
                drawPieSlice(cx, cy, g/N, time, 'rgba(255,255,255,1)', tau/3);
                drawPieSlice(cx, cy, b/N, time, 'rgba(255,255,255,1)', -tau/3);
            } else if (false) {
                drawPieSlice(cx, cy, r/N, time, 'rgba(200,0,0,.8)', 0);
                drawPieSlice(cx, cy, g/N, time, 'rgba(0,150,0,.8)', tau/3);
                drawPieSlice(cx, cy, b/N, time, 'rgba(0,0,255,.8)', -tau/3);
            } else {
                drawPieSlice(cx, cy, r/N, time, 'rgba(255,255,0,.8)', 0);
                drawPieSlice(cx, cy, g/N, time, 'rgba(0,255,255,.8)', phase1);
                drawPieSlice(cx, cy, b/N, time, 'rgba(255,0,255,.8)', phase2);
            }
        }
}

function drawPieSlice(cx, cy, rate, time, style, phase) {
    var omega = minspeed + (maxspeed-minspeed) * rate;
    var angle = omega * time + phase;
    ctx.fillStyle = style;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, angle, angle + tau/3);
    ctx.closePath();
    ctx.fill();
}
