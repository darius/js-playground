'use strict';

function assert(claim) {
    if (!claim)
        throw new Error("Liar");
}

var random = Math.random;

function randomInt(n) {
    return (n * random()) | 0;
}

var width = canvas.width, height = canvas.height;
var size = width * height;

function at(x, y) {
    return width * y + x;
}

// Grid squares
var species = new Int8Array(size);  // One for each grid position
var empty = 0, slime = 1;           // Legal values for species
var scents = new Float32Array(size); // Amount of pheromone
// XXX rename scent

// Turtles
var nturtles = (size / 100) | 0;
var positions = new Int32Array(nturtles); // Grid index of each turtle
var headings  = new Int8Array(nturtles);  // Heading of each turtle

// Headings
// Displacements for each heading. For each heading, its 45-degree
// neighbors left and right are cyclically adjacent in index.
var dx = [1,  1,  0, -1, -1, -1,  0,  1];
var dy = [0,  1,  1,  1,  0, -1, -1, -1];

function randomHeading() {
    return randomInt(8);
}

function setup() {
    for (var t = 0; t < nturtles; ++t)
        spawn(t, randomStartingPos());
}

// Make a new turtle #t at the position.
function spawn(t, pos) {
    species[pos] = slime;
    positions[t] = pos;
    headings[t] = randomHeading();
}

function randomStartingPos() {
    for (;;) {
        var pos = at(randomInt(width), randomInt(height));
        if (species[pos] === slime) continue;
        return pos;
    }
}

function tick() {
    for (var i = 0; i < 1; ++i) {
        turtlesMove();
        diffuse();
    }
    draw();
}

//var modulus = 101; // XXX pick a good modulus
//var iters = 12;
var modulus = 1009; // XXX pick a good modulus
var iters = 2000;

function diffuse() {
    for (var iter = 0; iter < iters; ++iter)
    for (var i = randomInt(modulus); i < size; i += modulus) {
        var total = scents[i];
        scents[i] = total * .7995;
        var spread = .2 * total;
        scents[0 <= i-1 ? i-1 : i]           += spread/4;
        scents[i+1 < size ? i+1 : i]         += spread/4;
        scents[0 <= i-width ? i-width : i]   += spread/4;
        scents[i+width < size ? i+width : i] += spread/4;
    }
}

function turtlesMove() {
    for (var t = 0; t < nturtles; ++t)
        turtleMove(t);
}

function step(pos, heading) {
    var x0 = pos % width;
    var y0 = (pos / width) | 0;
    var x1 = x0 + dx[heading]; x1 = (x1 < 0 ? width-1  : x1 === width  ? 0 : x1);
    var y1 = y0 + dy[heading]; y1 = (y1 < 0 ? height-1 : y1 === height ? 0 : y1);
    return at(x1, y1);
}

function pick_max(x, xval, y, yval) {
    return xval < yval || (xval === yval && random() < .5) ? x : y;
}

function turtleMove(t) {
    var pos0 = positions[t];

    // Deposit scent
    var s = scents[pos0] + .1;
    scents[pos0] = s;

    if (random() < .8) return;

    // Turn
    var h = headings[t];
    if (random() < .9) {
//    if (random() < s - 3) {
//    if (random() < s - 1) {
        // Turn into the scent gradient
        var left2 = (h - 2) & 7;
        var left = (h - 1) & 7;
        var right = (h + 1) & 7;
        var right2 = (h + 2) & 7;
        h = pick_max(left2, scents[step(pos0, left2)],
                     pick_max(left, scents[step(pos0, left)],
                              pick_max(h, scents[step(pos0, h)],
                                       pick_max(right, scents[step(pos0, right)],
                                                right2, scents[step(pos0, right2)]))));
        // And squirt even more out.
//        scents[pos0] += .1;
    } 
    else {
        // Turn at random
        h = (h + (random() < .5 ? -1 : 1)) & 7;
    }
    headings[t] = h;

    // Look where we're going
    var pos1 = step(pos0, h);
    var species1 = species[pos1];

    if (species1 === 0) {
        positions[t] = pos1;
        species[pos0] = 0;
        species[pos1] = slime;
    }
}

var ctx = canvas.getContext("2d");
var imageData = ctx.createImageData(width, height);
var pixels = new Int32Array(imageData.data.buffer);

// Redraw the canvas.
function draw() {
    for (var i = 0; i < size; ++i)
        pixels[i] = patchColor(species[i], i);
    ctx.putImageData(imageData, 0, 0);
}

function patchColor(patch, pos) {
    return patch === slime ? yellow : scentColor(scents[pos]);
}

function scentColor(amount) {
    var intensity;
    if (false) {
        intensity = amount * (255/4);
    } else {
        var log = amount === 0 ? 0 : Math.max(0, Math.log(amount / 3) + 2);
        intensity = log * (255/3);
    }
    var g = Math.min(intensity, 255) >>> 0;
    return rgba(0, g, 0, 255);
}

// XXX deal with varying endianness, etc.
function rgba(r, g, b, a) {
    return (  (a << 24)
            | (b << 16)
            | (g << 8)
            | r);
}

var black      = rgba(  0,   0,   0, 255);
var red        = rgba(255,   0,   0, 255);
var dullred    = rgba(128,   0,   0, 255);
var green      = rgba(  0, 255,   0, 255);
var blue       = rgba(  0,   0, 255, 192);
var yellow     = rgba(  255, 255, 0, 255);
var dullyellow = rgba(  128, 128, 0, 255);
var white      = rgba(255, 255, 255, 255);

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

