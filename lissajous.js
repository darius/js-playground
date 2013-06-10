'use strict';

var width = backCanvas.width;
var height = backCanvas.height;
var scale = Math.min(width, height) / 2;
var ctx = backCanvas.getContext("2d");

var frontCtx = frontCanvas.getContext("2d");

var backCanvasBounds = backCanvas.getBoundingClientRect();
var mouseX = 100;
var mouseY = 20;
var mouseMoved = true;
function onMousemove(event) {
    mouseX = event.clientX - backCanvasBounds.left;
    mouseY = event.clientY - backCanvasBounds.top;
    xradius = Math.abs(mouseX - width/2);
    yradius = Math.abs(mouseY - height/2);
    mouseMoved = true;
}
document.addEventListener("mousemove", onMousemove);
// To get the initial position before any mousemove:
document.addEventListener("mouseover", onMousemove);

var tau = 2 * Math.PI;

var xomega = tau * 1/200.213432144321;
var xradius = scale;

var yomega = tau * 1/160;
var yradius = scale*2/3;
var yphase = .7;

var time = 0;

function tick() {
    ctx.clearRect(0, 0, width, height);
    if (mouseMoved)
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
    mouseMoved = false;
}

function fo() {
}