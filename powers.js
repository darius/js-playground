'use strict';

var canvasBounds = canvas.getBoundingClientRect();
var width        = canvas.width;
var height       = canvas.height;
var ctx          = canvas.getContext('2d');

ctx.font = '12pt Georgia'

var scale = height / 3;

var tau = 2*Math.PI;

var refPoint = null;

function clear() {
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, height/2, width, 1);
    ctx.fillRect(width/2, 0, 1, height);

    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.arc(width/2, height/2, scale, 0, tau, true);
    ctx.stroke();

    if (refPoint) {
        ctx.fillStyle = 'red';
        plot(refPoint);
    }

    ctx.fillStyle = 'blue';
    plot({re: 1, im: 0}, '1');
    plot({re: 0, im: 1}, 'i');
}

function plot(z, label) {
    var x = z.re * scale + width/2;
    var y = height/2 - z.im * scale;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, tau);
    ctx.fill();
    if (label !== undefined)
        ctx.fillText(label, x + 7, y + 5);
}

function pointingAt(event) {
    var x = event.clientX - canvasBounds.left;
    var y = event.clientY - canvasBounds.top;
    return {re: (x - width/2) / scale,
            im: (height/2 - y) / scale};
}

function show(z) {
    clear();
    showing(z, {re: 1, im: 0}, 0);
}

var nextFrame;

function showing(z, p, i) {
    ctx.fillStyle = 'black';
    var maxlimit = 1e6;
    var limit = Math.min(maxlimit, i + 500);
    for (; i < limit; ++i) {
        plot(p);
        p = mul(p, z);
        var pp = squaredMagnitude(p);
        if (pp < 1e-5 || 12 < pp)
            return;
    }
    if (i < maxlimit)
        nextFrame = requestAnimationFrame(function() { showing(z, p, i) });
}

function squaredMagnitude(v) {
    return v.re*v.re + v.im*v.im;
}

function add(u, v) {
    return {re: u.re + v.re,
            im: u.im + v.im};
}

function mul(u, v) {
    return {re: u.re * v.re - u.im * v.im,
            im: u.im * v.re + u.re * v.im};
}

function rmul(r, v) {
    return {re: r * v.re,
            im: r * v.im};
}

function onClick(event) {
    refPoint = (refPoint ? null : pointingAt(event));
}

canvas.addEventListener("click", onClick);

function onMousemove(event) {
    cancelAnimationFrame(nextFrame);
    var z = pointingAt(event);
    if (refPoint)
        z = add(rmul(19/20, refPoint),
                rmul( 1/20, z));
    show(z);
}

canvas.addEventListener("mousemove", onMousemove);
// To get the initial position before any mousemove:
document.addEventListener("mouseover", onMousemove);

function onLoad() {
    show({re: 0, im: 0});
}

// TODO

// a text field to enter a formula in, for a function on two variables
// p and z, say, as a generalization (you'd enter p*z to get the
// effect currently visible, iterating z = f(p, z) starting from 1).

// or how about plotting the solutions to f(p, z) = 0

// an option for fine movements -- position on complex plane changes
// less than you move the mouse

// touch events

// feedback loop for how much to do per frame

// resize canvas to available space
