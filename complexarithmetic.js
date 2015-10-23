'use strict';

var canvasBounds = canvas.getBoundingClientRect();
var width        = canvas.width;
var height       = canvas.height;
var ctx          = canvas.getContext('2d');

var font = '12pt Georgia';

var scale = height / 5;

var tau = 2*Math.PI;

var varA = {re: 0.5, im: 0.5};

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
        ctx.lineWidth = 1.5;
        gridLine(ctx,  i * scale, -height/2,  i * scale, height/2);
    }
    for (i = 1; (i-1) * scale <= height/2; ++i) { // XXX hack
        ctx.lineWidth = .5;
        for (j = 1; j <= 9; ++j) {
            gridLine(ctx, -width/2, (i-1 + j/10) * scale, width/2, (i-1 + j/10) * scale);
        }
        ctx.lineWidth = 1.5;
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
    plot({re: 0, im: 0}, '0', 8, 18);
    plot({re: 1, im: 0}, '1', 8, 18);
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

function plot(z, label, xOffset, yOffset) {
    var x = z.re * scale + width/2;
    var y = height/2 - z.im * scale;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, tau);
    ctx.fill();
    if (label) {
        if (xOffset === undefined) xOffset = 7;
        if (yOffset === undefined) yOffset = 5;
        ctx.fillText(label, x + xOffset, y + yOffset);
    }
}

function pointingAt(event) {
    var x = event.clientX - canvasBounds.left;
    var y = event.clientY - canvasBounds.top;
    x -= 5, y -= 5;             // offset from pointer, to make the point more visible
    return {re: (x - width/2) / scale,
            im: (height/2 - y) / scale};
}

function show(varB) {
    clear();
    ctx.fillStyle = 'red';   plot(varA, 'a', -16, -8);
    ctx.fillStyle = 'green'; plot(varB, 'b', -16, -8);

    ctx.fillStyle = 'black';
    if (add_checkbox.checked) plot(add(varA, varB), 'a+b');
    if (mul_checkbox.checked) plot(mul(varA, varB), 'ab');
    if (sub_checkbox.checked) plot(sub(varA, varB), 'a\u2212b');
    if (div_checkbox.checked) plot(div(varA, varB), 'a/b');
    if (subrev_checkbox.checked) plot(sub(varB, varA), 'b\u2212a');
    if (divrev_checkbox.checked) plot(div(varB, varA), 'b/a');
}

function onMousemove(event) {
    show(pointingAt(event));
}

function onClick(event) {
    varA = pointingAt(event);
    show(varA);
}

canvas.addEventListener('mousemove', onMousemove);
// To get the initial position before any mousemove:
document.addEventListener('mouseover', onMousemove);

canvas.addEventListener('click', onClick);

function onLoad() {
    show(varA);
}

// TODO: 
// can we keep labels from overlapping?
// alpha channel on labels/points so overlap looks better?
// checkboxes for which operations show
// nicer display of plane with more grid lines
// magnify or translate the plane?
// maybe modulus and argument, too
// exponentiation, log?
// enter your own expressions
// more explanatory text
// more references, e.g. Feynman and 
//   https://www.khanacademy.org/math/algebra/complex-numbers

// use background canvas for grid
// https://gist.github.com/louisstow/5610652
/*
<div style="position: relative;">
 <canvas id="layer1" width="100" height="100" 
   style="position: absolute; left: 0; top: 0; z-index: 0;"></canvas>
 <canvas id="layer2" width="100" height="100" 
   style="position: absolute; left: 0; top: 0; z-index: 1;"></canvas>
</div>
*/
// or "use a plain DIV element with a CSS background property and
// position it under the canvas"
