'use strict';

var canvasBounds = canvas.getBoundingClientRect();
var width        = canvas.width;
var height       = canvas.height;
var ctx          = canvas.getContext('2d');

var font = '12pt Georgia';

var scale = height / 5;

var tau = 2*Math.PI;

var scene = [];            // Array of arrows
var selection = [];        // Array of indices into scene
var draggingState = false; // false/'pan'/'pinch'/'drag' for nothing/adding/multiplying/moving
var draggingWhich;         // When draggingState is 'drag', an index into scene

function addArrow(z) {
    var arrow = {at: z, by: null, pinned: false};
    scene.push(arrow);
}

var selectingRadius = 0.2;

function selecting(at) {
    var result = -1;
    scene.forEach(function(arrow, i) {
        var d2 = distance2(at, arrow.at);
        if (d2 <= selectingRadius * selectingRadius
            && (result < 0 || d2 < distance2(at, scene[result].at)))
            result = i;
    });
    return result;
}

function near(u, v) {
    return distance2(u, v) <= selectingRadius;
}

function distance2(u, v) {
    return squaredMagnitude(sub(u, v));
}

// Select arrow #i unless already selected, in which case unselect it.
function toggleSelection(i) {
    for (var j = 0; j < selection.length; ++j) {
        if (selection[j] === i) {
            selection.splice(j, 1);
            return;
        }
    }
    selection.push(i);
}

function clearSelection() {
    selection = [];
}

function clear() {
    var i, j;
    ctx.font = font;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = 'grey';
    for (i = 1; (i-1) * scale <= width/2; ++i) { // XXX hack
        ctx.lineWidth = .5;
        for (j = 1; j <= 9; ++j) {
            gridLine(ctx, (i-1 + j/10) * scale, -height/2, (i-1 + j/10) * scale, height/2);
        }
        ctx.lineWidth = 1;
        gridLine(ctx,  i * scale, -height/2,  i * scale, height/2);
    }
    for (i = 1; (i-1) * scale <= height/2; ++i) { // XXX hack
        ctx.lineWidth = .5;
        for (j = 1; j <= 9; ++j) {
            gridLine(ctx, -width/2, (i-1 + j/10) * scale, width/2, (i-1 + j/10) * scale);
        }
        ctx.lineWidth = 1;
        gridLine(ctx, -width/2, i * scale, width/2, i * scale);
    }

    ctx.fillStyle = 'white';
    ctx.fillRect(0, height/2-1, width, 3);
    ctx.fillRect(width/2-1, 0, 3, height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.arc(width/2, height/2, scale, 0, tau, true);
    ctx.closePath();
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.fillStyle = 'blue';
    plot(zero, '0', 8, 18);
    plot(one,  '1', 8, 18);
    ctx.font = 'italic ' + font;
    plot({re: 0, im: 1}, 'i', 8, 18);
    ctx.font = font;
}

function gridLine(ctx, x0, y0, x1, y1) {
    line(ctx, x0, y0, x1, y1);
    line(ctx, -x0, -y0, -x1, -y1);
}

function line(ctx, x0, y0, x1, y1) {
    ctx.beginPath();
    ctx.moveTo(width/2 + x0 - .5, height/2 - y0 - .5); // - .5 for sharp grid lines
    ctx.lineTo(width/2 + x1 - .5, height/2 - y1 - .5);
    ctx.stroke();
}

function plot(z, label, xOffset, yOffset, big) {
    var x = z.re * scale + width/2;
    var y = height/2 - z.im * scale;
    ctx.beginPath();
    ctx.arc(x, y, big ? 10 : 3, 0, tau);
    ctx.fill();
    if (label) {
        if (xOffset === undefined) xOffset = 7;
        if (yOffset === undefined) yOffset = 5;
        ctx.fillText(label, x + xOffset, y + yOffset);
    }
}

function mouseCoords(event) {
    return {x: event.clientX - canvasBounds.left,
            y: event.clientY - canvasBounds.top};
}

function pointingAt(event) {
    var p = mouseCoords(event);
//    p.x -= 5, p.y -= 5;     // offset from pointer, to make the point more visible
    return arrowFrom(p);
}

function arrowFrom(p) {
    return {re: (p.x - width/2) / scale,
            im: (height/2 - p.y) / scale};
}

function show() {
    clear();
    ctx.fillStyle = 'red';
    selection.forEach(function(i) {
        plot(scene[i].at, null, 0, 0, true);
    });
    ctx.fillStyle = 'black';
    scene.forEach(plotArrow);
}

function plotArrow(arrow, i) {
    plot(arrow.at, String.fromCharCode(97+i), -16, -8);
}

function onClick(at) {
    var i = selecting(at);
    if (0 <= i) {
        toggleSelection(i);
    } else {
        addArrow(at);
    }
}

var mouseStart = null;

function onMousedown(event) {
    mouseStart = mouseCoords(event);
    show();
}

function onMousemove(event) {
    if (!draggingState && mouseStart !== null) {
        var i = selecting(arrowFrom(mouseStart));
        if (0 < i) {
            draggingState = 'drag';
            draggingWhich = i;
        }
    }
    if (draggingState === 'drag') {
        scene[draggingWhich].at = pointingAt(event);
    }
    show();
}

function onMouseup(event) {
    var mpos = mouseCoords(event);
    if (mouseStart.x === mpos.x && mouseStart.y === mpos.y) {
        onClick(pointingAt(event));
    } else {
        ;
    }
    mouseStart = null;
    draggingState = null;
    show();
}

canvas.addEventListener('mousedown', onMousedown);
canvas.addEventListener('mousemove', onMousemove);
canvas.addEventListener('mouseup',   onMouseup);

// To get the initial position before any mousemove:
// document.addEventListener('mouseover', onMousemove);

function onLoad() {
    show();
}
