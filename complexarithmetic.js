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

function add(u, v) {
    return {re: u.re + v.re,
            im: u.im + v.im};
}

function sub(u, v) {
    return {re: u.re - v.re,
            im: u.im - v.im};
}

function conjugate(v) {
    return {re: v.re,
            im: -v.im};
}

function rmul(r, v) {
    return {re: r * v.re,
            im: r * v.im};
}

function mul(u, v) {
    return {re: u.re * v.re - u.im * v.im,
            im: u.im * v.re + u.re * v.im};
}

function div(u, v) {
    var vv = v.re*v.re + v.im*v.im;
    return rmul(1/vv, mul(u, conjugate(v)));
}

function onMousemove(event) {
    show(pointingAt(event));
}

function onClick(event) {
    varA = pointingAt(event);
    show(varA);
}

canvas.addEventListener("mousemove", onMousemove);
canvas.addEventListener("click", onClick);

function onLoad() {
    show(varA);
}

// TODO: 
// alpha channel
// nicer display of plane with more grid lines
// magnify or translate the plane?
// add explanatory text
// checkboxes for which operations show

// use background canvas for grid
/*
<div style="position: relative;">
 <canvas id="layer1" width="100" height="100" 
   style="position: absolute; left: 0; top: 0; z-index: 0;"></canvas>
 <canvas id="layer2" width="100" height="100" 
   style="position: absolute; left: 0; top: 0; z-index: 1;"></canvas>
</div>
*/
