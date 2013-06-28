'use strict';

var phaseWidth = phaseCanvas.width;
var phaseHeight = phaseCanvas.height;

function drawPhase() {
    var ctx = phaseCanvas.getContext('2d');
    ctx.clearRect(0, 0, phaseWidth, phaseHeight);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;

    var r = phaseWidth/2 - 10;
    var x = r * Math.cos(yphase);
    var y = r * Math.sin(yphase);

    line(ctx, phaseWidth/2, phaseHeight/2, phaseWidth/2 + x, phaseHeight/2 - y);
}

var startTheta;
var startYphase;

var phaseCanvasBounds = phaseCanvas.getBoundingClientRect();

function onPhaseMousemove(event) {
    var mouseX = event.clientX - phaseCanvasBounds.left;
    var mouseY = event.clientY - phaseCanvasBounds.top;
    var theta = computeTheta(mouseX, mouseY);
    yphase = startYphase + (theta - startTheta);
    drawPhase();
}

function computeTheta(mouseX, mouseY) {
    var x = (mouseX - phaseWidth/2) / (phaseWidth/2);
    var y = (phaseHeight/2 - mouseY) / (phaseHeight/2);
    return Math.atan2(y, x);
}

function onPhaseMousedown(event) {
    var mouseX = event.clientX - phaseCanvasBounds.left;
    var mouseY = event.clientY - phaseCanvasBounds.top;
    startTheta = computeTheta(mouseX, mouseY);
    startYphase = yphase;
    phaseCanvas.addEventListener('mousemove', onPhaseMousemove, true);
}
function onPhaseMouseup(event)   {
    phaseCanvas.removeEventListener('mousemove', onPhaseMousemove, true);
    stale = true;
}

phaseCanvas.addEventListener('mousedown', onPhaseMousedown);
phaseCanvas.addEventListener('mouseup', onPhaseMouseup);
