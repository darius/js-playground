'use strict';

function onLoad() {
    animating(tick);
    //tick(0, 0);
}

function assert(claim) {
    if (!claim)
        throw new Error("Liar");
}

var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext('2d');

function tick(delta, time) {
    ctx.lineWidth = 1;
    ctx.clearRect(0, 0, width, height);
    bubbling(time);
}

var tau = 2 * Math.PI;
var triturn = Math.sqrt(3)/2;

var N = 36;
var phasing = 0.001;
var radius = 12;
var diameter = 2 * radius;

function bubbling(time) {
    var spacing = diameter;// * (1 + .2 * Math.sin(breathing * time));

    var x0 = radius + width/2 - (.5*N) * Math.sqrt(3)/2 * spacing;
    var y0 = height*4/5 + height/2 - N * (3/8) * spacing;

    /*
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + 5*spacing, y0 - 5*spacing);
    ctx.lineTo(x0 - 5*spacing, y0 - 5*spacing);
    ctx.fill();
    */

    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'white';
    ctx.globalAlpha = 0.4 + 0.3 * (1 + Math.sin(time*3e-4));
    for (var r = 0; r < N; ++r)
        for (var g = 0; g < N-r; ++g) {
            var b = N - (r+g);
            assert(r + g + b === N);

            // (x,y) from http://www.redblobgames.com/grids/hexagons/#hex-to-pixel
            var cx = x0 + (r + g/2) * triturn * spacing;
            var cy = y0 - g * .75 * spacing;

            wiggle_v2(cx, cy, r, g, b, time);
        }
}

function wiggle(cx, cy, r, g, b, time) {
    var ra = r/N * time;
    var ga = g/N * time, gt = Math.cos(ga*1e-2);
    var ba = b/N * time, bt = Math.cos(ba*1e-2);
    var angle = ra * 1e-2;
    var length = 10 * (1 + gt);
    var thickness = 4 * (1 + bt);
    var dx = length * Math.cos(angle);
    var dy = length * Math.sin(angle);
//    console.log('lineWidth', thickness);
//    console.log('cx', cx, cy, dx, dy);
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(cx-dx, cy-dy);
    ctx.lineTo(cx+dx, cy+dy);
    ctx.stroke();
}


function wiggle_v0(cx, cy, r, g, b, time) {
    var ra = r/N * time;
    var ga = g/N * time;
    var ba = b/N * time;
    var scalescale = .15 - .1 * Math.cos(time*1e-3);

    var scale = (4 * scalescale * ((1 + .2 * Math.cos(ra * time/1000000))
                                    * (1 + .2 * Math.cos(ga * time/1000000))
                                    * (1 + .2 * Math.cos(ba * time/1000000))));
    if (0) {
        ctx.strokeRect(cx-radius/2, cy-radius/2, radius, radius);
        console.log('rect', cx-radius/2, cy-radius/2, radius, radius);
        return;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, scale * radius, 0, tau);
    ctx.closePath();
    ctx.stroke();
}

function wiggle_v1(cx, cy, r, g, b, time) {
    var ra = r/N * time;
    var ga = g/N * time;
    var ba = b/N * time;
    var scalescale = .15 - .1 * Math.cos(time*1e-3);

    var scale = (4 * scalescale * ((1 + .2 * Math.cos(ra/1000))
                                    * (1 + .2 * Math.cos(ga/1000))
                                    * (1 + .2 * Math.cos(ba/1000))));
    ctx.beginPath();
    ctx.arc(cx, cy, scale * radius, 0, tau);
    ctx.closePath();
    ctx.stroke();
}

function wiggle_v2(cx, cy, r, g, b, time) {
    var ra = r/N * time;
    var ga = g/N * time;
    var ba = b/N * time;

    var ri = Math.floor(31 * (1 + Math.cos(ra*3.14e-3)));
    var gi = Math.floor(95 * (1 + Math.cos(ga*3.14e-3)));
    var bi = Math.floor(31 * (1 + Math.cos(ba*3.14e-3)));
    var color = 'rgb('+(ri+bi)+','+(ri+gi)+','+(gi+bi)+')';
    ctx.strokeStyle = color;
//    console.log(color);

    var scalescale = .15 - .1 * Math.cos(time*1e-3);

    var scale = (4 * scalescale * ((1 + .2 * Math.cos(ra/1000))
                                    * (1 + .2 * Math.cos(ga/1000))
                                    * (1 + .2 * Math.cos(ba/1000))));
    ctx.beginPath();
    ctx.arc(cx, cy, scale * radius, 0, tau);
    ctx.closePath();
    ctx.stroke();
}
