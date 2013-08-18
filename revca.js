'use strict';

/*
Alternating neighborhood with micro-reversible updates.
Like a 1d version of the Margolus neighborhood.

  |x y|u v|s t|...
|a b|c d|e f|g h|...

*/

function assert(claim) {
    if (!claim)
        throw new Error("Liar");
}

var width = canvas.width, height = canvas.height;
assert(width % 2 === 0);

var grid = new Int8Array(width);

// Seed state
grid[width/2] = 1;
//grid[width/2+1] = 1;
//grid[width/2+11] = 1;
//grid[width/2+30] = 1;

var nticks = 0;

function tick() {
    ++nticks;
    step();
    draw();
}

function step() {
    var phase = nticks % 2;
    for (var x = phase; x < width - 1; x += 2) {
        var state = update((grid[x] << 1) + grid[x+1]);
        grid[x] = state >>> 1;
        grid[x+1] = state & 1;
    }
    if (phase === 1) {
        state = update((grid[width-1] << 1) + grid[0]);
        grid[width-1] = state >>> 1;
        grid[0] = state & 1;
    }
}

function update(state) {
    switch (state) {
        case 0: return 0;
        case 1: return 1;
        case 2: return 3;
        case 3: return 2;
        default: assert(false);
    }
}

var ctx = canvas.getContext('2d');
var imageData = ctx.createImageData(width, height);
var pixels = new Int32Array(imageData.data.buffer);

// Redraw the canvas.
function draw() {
    var y = nticks % height;
    var p = y * width
    for (var x = 0; x < width; ++x)
        pixels[p+x] = patchColor(grid[x]);
    ctx.putImageData(imageData, 0, 0, 0, y, width, 1);
}

function patchColor(patch) {
    return patch === 0 ? black : white;
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

draw();
