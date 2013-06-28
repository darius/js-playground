'use strict';

var width = backCanvas.width;
var height = backCanvas.height;
var scale = Math.min(width, height) / 2;
var ctx = backCanvas.getContext('2d');

var frontCtx = frontCanvas.getContext('2d');

var backCanvasBounds = backCanvas.getBoundingClientRect();
var startMouseX, startMouseY;
var startXRadius, startYRadius;
var mouseX = 100;
var mouseY = 20;
var stale = true;
function onMousemove(event) {
    var mouseX = event.clientX - backCanvasBounds.left;
    var mouseY = event.clientY - backCanvasBounds.top;
    var dx = mouseX - startMouseX;
    var dy = mouseY - startMouseY;
    xradius = Math.abs(startXRadius + dx * (startMouseX < width/2 ? -1 : 1));
    yradius = Math.abs(startYRadius - dy * (startMouseY > height/2 ? -1 : 1));
}

function onMousedown(event) {
    startMouseX = event.clientX - backCanvasBounds.left;
    startMouseY = event.clientY - backCanvasBounds.top;
    startXRadius = xradius;
    startYRadius = yradius;
    frontCanvas.addEventListener('mousemove', onMousemove, true);
}
function onMouseup(event)   {
    frontCanvas.removeEventListener('mousemove', onMousemove, true);
    stale = true;
}

frontCanvas.addEventListener('mousedown', onMousedown);
frontCanvas.addEventListener('mouseup', onMouseup);

var tau = 2 * Math.PI;

var xrate = .5;  // in (0..1]
var yrate = .5;  // in (0..1]

var xomega = tau/80 * xrate;
var yomega = tau/80 * yrate;

var xradius = scale;
var yradius = scale*2/3;

var yphase = 0;

var time = 0;

function tick() {
    ctx.clearRect(0, 0, width, height);
    if (stale)
        frontCtx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'grey';
    ctx.beginPath();
    ctx.arc(width/2, height/2, xradius, 0, tau, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(width/2, height/2, yradius, 0, tau, true);
    ctx.stroke();

    var x = Math.cos(xomega * time);
    var y = Math.sin(xomega * time);
    var xx = width/2 + x*xradius;
    var xy = height/2 - y*xradius;

    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(xx, xy, 4, 0, tau, true);
    ctx.fill();

    x = Math.cos(yomega * time + yphase);
    y = Math.sin(yomega * time + yphase);
    var yx = width/2 + x*yradius;
    var yy = height/2 - y*yradius;

    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(yx, yy, 4, 0, tau, true);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(xx, xy);
    ctx.lineTo(xx, yy);
    ctx.lineTo(yx, yy);
    ctx.stroke();

    frontCtx.fillStyle = 'white';
    frontCtx.beginPath();
    frontCtx.arc(xx, yy, 1.5, 0, tau, true);
    frontCtx.fill();

    time += 1;
    stale = false;
}

/*
TODO:
- extract mousemove stuff to a library
- comments
*/
