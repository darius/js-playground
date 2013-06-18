'use strict';

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

var tau = 2 * Math.PI;

var lofreq = 1/1000;
var hifreq = 1/216;

var rate = 5;
var time = 0;

function tick() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    var dotWidth = 0.5 + 100 * mouseX/width;
    var dotHeight = 0.5 + 50 * mouseY/height;
    for (var x = 0; x < width-dotWidth; ++x) {
        var omega = lofreq * (x/width) + hifreq * (1 - x/width);
        var f = Math.sin(tau * omega * time);
        var y = (1+f) * (height-dotHeight)/2;
        ctx.fillRect(x, y, dotWidth, dotHeight);
    }
    var dr = (Math.random() - .5) * Math.max(.01, Math.abs(rate/10));
    if (.2 <= rate + dr && rate + dr <= 5)
        rate += dr;
    time += rate;

    if (false && time < 1000) {
        ctx.fillStyle = 'rgba(0,255,0,64)';
        ctx.fillText('Give it a while. Try moving the mouse.', width/2 - 100, 50);
    }
}

function animLoop(render) {
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
