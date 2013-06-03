'use strict';

var canvasBounds = canvas.getBoundingClientRect();
var width        = canvas.width;
var height       = canvas.height;
var ctx          = canvas.getContext('2d');

ctx.font = '12pt Georgia'

var scale = height / 5;

var tau = 2*Math.PI;

var varA = {re: 0.5, im: 0.5};

function clear() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, height/2, width, 1);
    ctx.fillRect(width/2, 0, 1, height);
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.arc(width/2, height/2, scale, 0, tau, true);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = 'blue';
    plot({re: 0, im: 0}, '0');
    plot({re: 1, im: 0}, '1');
    plot({re: 0, im: 1}, 'i');
}

function plot(z, label) {
    var x = z.re * scale + width/2;
    var y = height/2 - z.im * scale;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, tau);
    ctx.fill();
    if (label)
        ctx.fillText(label, x + 7, y + 5);
}

function pointingAt(event) {
    var x = event.clientX - canvasBounds.left;
    var y = event.clientY - canvasBounds.top;
    return {re: (x - width/2) / scale,
            im: (height/2 - y) / scale};
}

function show(varB) {
    clear();
    ctx.fillStyle = 'red';   plot(varA, 'a');
    ctx.fillStyle = 'green'; plot(varB, 'b');
    ctx.fillStyle = 'black'; plot(add(varA, varB), 'a+b');
                             plot(mul(varA, varB), 'ab');
                             plot(sub(varA, varB), 'a-b');
                             plot(div(varA, varB), 'a/b');
                             plot(sub(varB, varA), 'b-a');
                             plot(div(varB, varA), 'b/a');
}

function onMousemove(event) {
    show(pointingAt(event));
}

function onClick(event) {
    varA = pointingAt(event);
    show(varA);
}

canvas.addEventListener("mousemove", onMousemove);
// To get the initial position before any mousemove:
document.addEventListener("mouseover", onMousemove);

canvas.addEventListener("click", onClick);

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
