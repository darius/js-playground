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

var phaseCanvasBounds = phaseCanvas.getBoundingClientRect();
function onPhaseMousemove(event) {
    var mouseX = event.clientX - phaseCanvasBounds.left;
    var mouseY = event.clientY - phaseCanvasBounds.top;
    var x = (mouseX - phaseWidth/2) / (phaseWidth/2);
    var y = (phaseHeight/2 - mouseY) / (phaseHeight/2);
    var theta = Math.atan2(y, x);
    yphase = theta;
    drawPhase();
    stale = true;
}
// XXX only listen to moving over the canvas
phaseCanvas.addEventListener('mousemove', onPhaseMousemove);
// To get the initial position before any mousemove:
//document.addEventListener('mouseover', onPhaseMousemove);
