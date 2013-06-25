'use strict';

var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext('2d');

function randomInt(n) {
    return (n * Math.random()) | 0;
}

var ww = (width/10) | 0;
var hh = (height/10) | 0;
var already = new Array(ww * hh);

function tick() {
    for (var i = 0; i < 3; ++i)
        randomSlash();
}

function randomSlash() {
    var x = randomInt(ww);
    var y = randomInt(hh);
    var p = y*ww + x;
    if (already[p]) return;
    already[p] = true;

    var dir = randomInt(2);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo((x+dir)*10, y*10);
    ctx.lineTo((x+(1-dir))*10, (y+1)*10);
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
