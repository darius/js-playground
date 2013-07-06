'use strict';

var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext('2d');

var radius = 12;
var diameter = 2*radius;
var minspeed = .001;
var maxspeed = .003 // .008;
var phasing = .00005;
var breathing = -.000081;

var ww = (width/diameter) | 0;
var hh = (height/diameter) | 0;

var N = 8;  // delta < 20 ? ww - 2 : ww - 20;             // XXX hand-hacked

var recentDeltas = [0, 0, 0, 0, 0, 0, 0, 0,];
var rd = 0;
var ndeltas = 0;

function areWeFastEnough(delta) {
    recentDeltas[rd] = delta;
    rd = (rd + 1) % recentDeltas.length;
    var all = true;
    var any = false;
    for (var i = 0; i < recentDeltas.length; ++i) {
        if (recentDeltas[i] < 41) // We want at least 25 fps
            any = true;
        else
            all = false;
    }
    return all ? 1 : any ? 0 : -1;
}

function tick(delta, time) {
    if (++ndeltas < 120) {
        var fastEnough = areWeFastEnough(delta);
        if (fastEnough === 1 && N < ww - 2)
            ++N;
        else if (fastEnough === -1 && 4 < N)
            --N;
    }
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

    var spacing = diameter * (1 + .2 * Math.sin(breathing * time));

    var x0 = radius + width/2 - (.5*N) * Math.sqrt(3)/2 * spacing;
    var y0 = height/2 - N * (3/8) * spacing;

    for (var r = 0; r < N; ++r)
        for (var g = 0; g < N-r; ++g) {
            var b = N - (r+g);
            
            // (x,y) from http://www.redblobgames.com/grids/hexagons/#hex-to-pixel
            var cx = x0 + (r + g/2) * Math.sqrt(3)/2 * spacing;
            var cy = y0 + g * .75 * spacing;
            // TODO: morph between these color schemes
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
