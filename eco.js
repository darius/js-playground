'use strict';

function assert(claim) {
    if (!claim)
        throw new Error("Liar");
}

var random = Math.random;

var width = canvas.width, height = canvas.height;
var size = width * height;

function at(x, y) {
    return width * y + x;
}

// Grid spaces
var species = new Int8Array(size);            // One for each grid position
var empty = 0, feed = 1, fish = 2, shark = 3; // Legal values for species
var population = [0, 0, 0, 0];                // Current count of each species
                                              // (but empty/feed not tracked)
var popHistory = [[0, 0, 0, 0]];              // Populations at each tick so far

// Return true if the action has settled down.
// (The way things go now this never happens, in practice.)
function isBoring() {
    assert(0 <= nticks && nticks < popHistory.length);
    return ((population[fish] === 0 || population[shark] === 0)
            && unchanging(fish) && unchanging(shark));
}

function unchanging(type) {
    var now = population[type];
    if (now === 0) return true;
    return recentRange(type) < 0.3 * now;
}

function recentRange(type) {
    var now = population[type];
    var lo = now, hi = now;
    for (var i = 0; i < stamina/2; ++i) {
        var t = nticks - i;
        if (t < 0) break;
        lo = Math.min(lo, popHistory[t][type]);
        hi = Math.max(hi, popHistory[t][type]);
    }
    return hi - lo;
}

// State variables for the turtle at each grid square, if any.
var headings      = new Int8Array(size);
var lastMealtimes = new Int32Array(size);

// Turtles
var stamina = 1000;
var nturtles_initially = (size / 100) | 0;
var nsharks_initially = 90;
var nturtles = 0;
// Grid index of turtle #t for 0 <= t < nturtles:
var turtles = new Int32Array(size);

// Headings
// Displacements for each heading. For each heading, its 45-degree
// neighbors left and right are cyclically adjacent in index.
var dx = [1,  1,  0, -1, -1, -1,  0,  1];
var dy = [0,  1,  1,  1,  0, -1, -1, -1];

function randomHeading() {
    return (8 * random()) | 0;
}

function setup() {
    population = [0, 0, 0, 0];
    popHistory = [[0, 0, 0, 0]];
    feedCircle(2e5, 300, 300, 100);
    nturtles = 0;
    for (var t = 0; t < nturtles_initially; ++t) {
        var pos = randomStartingPos();
        if (species[pos] < fish)
            spawn(pos, t < nsharks_initially ? shark : fish);
    }
}

function randomStartingPos() {
    var r = 50 * random();
    var theta = 2*Math.PI * random();
    var x = (250 + r * Math.cos(theta)) | 0;
    var y = (250 + r * Math.sin(theta)) | 0;
    return at(x, y);
}

// Make a new turtle of the type at the position.
// Pre: pos doesn't hold a turtle already.
function spawn(pos, type) {
    species[pos] = type;
    ++population[type];
    headings[pos] = randomHeading();
    lastMealtimes[pos] = 0;
    turtles[nturtles++] = pos;
}

setup();

function step(time) {
    turtlesAct(time);
    replenishFeed();
}

function turtlesAct(time) {
    popHistory.push([0, 0, population[fish], population[shark]]);
    for (var t = 0; t < nturtles; )
        t = turtleAct(time, t);
}

// Make turtles[t] do its thing for this time step. Return the index
// of the next turtle. (Usually t+1, but sometimes a turtle dies, and
// to keep the numbering consecutive we swap another turtle into the
// slot t and then return t.)
function turtleAct(time, t) {
    var pos0 = turtles[t];
    var s = species[pos0];
    assert(s === fish || s === shark);

    // Die
    if (fish <= s 
        && lastMealtimes[pos0] + (s === shark ? 0.6 : 1) * stamina < time
        && random() < (s === shark ? 0.01 : 0.02)
        && 0 < nturtles) {
        --population[s];
        species[pos0] = empty;
        turtles[t] = turtles[--nturtles];
        return t;
    }

    var x0 = pos0 % width;
    var y0 = (pos0 / width) | 0;
    var mealtime = lastMealtimes[pos0];

    // Turn
    var h = headings[pos0];
    if (time < mealtime + (random() * 100 + 400)
        || random() < 1/30)
        h = (h + (random() < .5 ? -1 : 1)) & 7;

    // Look where we're going
    var x1 = x0 + dx[h];   x1 = (x1 < 0 ? width-1  : x1 === width  ? 0 : x1);
    var y1 = y0 + dy[h];   y1 = (y1 < 0 ? height-1 : y1 === height ? 0 : y1);
    var pos1 = at(x1, y1);
    var species1 = species[pos1];

    function move(track, mealtime) {
        turtles[t] = pos1;
        species[pos0] = track;
        species[pos1] = s;
        headings[pos1] = h;
        lastMealtimes[pos1] = mealtime;
    }

    if (species1 === empty || (s === shark && species1 === feed)) {
        move(species1, mealtime);
        if (species1 === empty
            && time < mealtime + 100
            && random() < (s === fish ? 0.01 : 0.0033))
            spawn(pos0, s);
    }
    else if (s === fish && species1 === feed) {
        // Move and eat
        move(empty, time);
    }
    else if (s === shark && species1 === fish) {
        // Move and eat
        --population[fish];
        move(empty, time);
        // There's already some turtle slot for pos1, where the fish
        // that just died was; since we moved the shark to this pos1,
        // it's in the turtles roster, and we must reclaim the slot t.
        // N.B. this means this shark could move twice in one turn,
        // when the fish eaten had not yet moved on this tick. Since
        // eating fish is fairly rare I don't much care.
        turtles[t] = turtles[--nturtles];
        return t;
    }
    else
        headings[pos0] = h;

    return t+1;
}

function replenishFeed() {
    feedCircle(2000, width/2, height/2, 200);
    feedCircle(500, 3*width/4, 3*height/4, 100);
}

function feedCircle(npoints, cx, cy, radius) {
    for (var i = 0; i < npoints; ++i) {
        var x = (cx - radius + radius*2*random()) | 0;
        var y = (cy - radius + radius*2*random()) | 0;
        if (inCircle(x, y, cx, cy, radius)) {
            var pos = at(x, y);
            if (species[pos] === empty)
                species[pos] = feed;
        }
    }
}

function inCircle(x, y, cx, cy, radius) {
    return Math.pow(x-cx, 2) + Math.pow(y-cy, 2) < radius*radius;
}

var ctx = canvas.getContext('2d');
var imageData = ctx.createImageData(width, height);
var pixels = new Int32Array(imageData.data.buffer);

// Redraw the canvas.
function draw() {
    for (var i = 0; i < size; ++i)
        pixels[i] = patchColor(species[i], i);
    ctx.putImageData(imageData, 0, 0);
}

function patchColor(patch, pos) {
    return (patch === empty ? black :
            patch === feed  ? blue :
            patch === fish ? (nticks < lastMealtimes[pos] + 100 ? red : dullred) : 
            nticks < lastMealtimes[pos] + 100 ? yellow : dullyellow);
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
