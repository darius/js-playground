'use strict';

function assert(claim) {
    if (!claim)
        throw new Error("Liar");
}

var width = canvas.width, height = canvas.height;
var size = width * height;

function at(x, y) {
    return width * y + x;
}

var foodRadius = 200;

function inDiningRoom(x, y) {
    return (inCircle(x, y, width/2, height/2, foodRadius)
            || inCircle(x, y, 3*width/4, 3*height/4, foodRadius/2));
}

function inCircle(x, y, cx, cy, radius) {
    return Math.pow(x-cx, 2) + Math.pow(y-cy, 2) < radius*radius;
}

// Grid spaces
var species = new Int8Array(size);
var empty = 0, feed = 1, fish = 2, shark = 3;
var population = [0, 0, 0, 0];
var popHistory = [[0, 0, 0, 0]];

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

var headings      = new Int8Array(size);
var lastMealtimes = new Int32Array(size);

// Turtles
var stamina = 1000;
var nturtles_initially = (size / 100) | 0;
var nturtles = nturtles_initially;
var nsharks_initially = 90; // (nturtles / 5) | 0;
var turtles = new Int32Array(size);  // XXX useme

// Headings
var dx = [1,  1,  0, -1, -1, -1,  0,  1];
var dy = [0,  1,  1,  1,  0, -1, -1, -1];

function randomHeading() {
    return (8 * Math.random()) | 0;
}

function inv() {
    assert(population[empty] === 0);
}

function setup() {
    population = [0, 0, 0, 0];
    popHistory = [[0, 0, 0, 0]];
    if (true)
        for (var y = 0; y < height; ++y)
            for (var x = 0; x < width; ++x)
                species[at(x, y)] = inCircle(x, y, 300, 300, 100) ? feed : empty;
    nturtles = 0;
    for (var t = 0; t < nturtles_initially; ++t) {
        var r = 50 * Math.random();
        var theta = 2*Math.PI * Math.random();
        x = (250 + r * Math.cos(theta)) | 0;
        y = (250 + r * Math.sin(theta)) | 0;
        var pos = at(x, y);
        if (species[pos] < fish) {
            species[pos] = (t < nsharks_initially ? shark : fish);
            ++population[species[pos]];
            headings[pos] = randomHeading();
            lastMealtimes[pos] = 0;
            turtles[nturtles++] = pos;
        }
    }
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

function turtleAct(time, t) {
    var pos0 = turtles[t];
    var s = species[pos0];
    if (s !== fish && s !== shark)
        throw new Error("species " + s);

    // Die
    // TODO make this species-dependent
    if (fish <= s 
        && lastMealtimes[pos0] + (s === shark ? 0.6 : 1) * stamina < time
        && Math.random() < (s === shark ? 0.01 : 0.02)
        && 0 < nturtles) {
        --population[s];
        species[pos0] = empty;
        turtles[t] = turtles[--nturtles];
        return t;
    }

    var h = headings[pos0];
    var x0 = pos0 % width;
    var y0 = (pos0 / width) | 0;

    var x1 = x0 + dx[h];
    x1 = (x1 < 0 ? width-1  : x1 === width  ? 0 : x1);
    var y1 = y0 + dy[h];
    y1 = (y1 < 0 ? height-1 : y1 === height ? 0 : y1);
    var pos1 = at(x1, y1);
    if (species[pos1] === empty
        || (s === shark && species[pos1] === feed)) {
        // Move
        species[pos0] = species[pos1];
        turtles[t] = pos1;
        species[pos1] = s;
        headings[pos1] = h;
        lastMealtimes[pos1] = lastMealtimes[pos0];

        // Turn
        if (time < lastMealtimes[pos1] + (Math.random() * 100 + 400)
            || Math.random() < 1/30)
            headings[pos1] = (h + (Math.random() < .5 ? -1 : 1)) & 7;

        if (species[pos0] === empty
            && time < lastMealtimes[pos1] + 100
            && Math.random() < (s === fish ? 0.01 : 0.0033)
            && nturtles < size) {
            // Spawn
            // TODO don't move newborns until next tick
            ++population[s];
            turtles[nturtles++] = pos0;
            species[pos0] = s;
            headings[pos0] = randomHeading();
            lastMealtimes[pos0] = 0;
        }
    }
    else if (s === fish && species[pos1] === feed) {
        // Move and eat
        species[pos0] = empty;
        turtles[t] = pos1;
        species[pos1] = s;
        headings[pos1] = h;
        lastMealtimes[pos1] = time;
        // Turn
        if (time < lastMealtimes[pos1] + (Math.random() * 100 + 400)
            || Math.random() < 1/30)
            headings[pos1] = (h + (Math.random() < .5 ? -1 : 1)) & 7;
    }
    else if (s === shark && species[pos1] === fish) {
        // Move and eat
        --population[fish];
        species[pos0] = empty;
        species[pos1] = s;
        lastMealtimes[pos1] = time;
        turtles[t] = turtles[--nturtles];
        return t; // XXX no turning
    }
    else {
        // Turn
        if (time < lastMealtimes[pos0] + (Math.random() * 100 + 400)
            || Math.random() < 1/30)
            headings[pos0] = (h + (Math.random() < .5 ? -1 : 1)) & 7;
    }

    return t+1;
}

function replenishFeed() {
    for (var i = 0; i < 2000; ++i) {
        var x = (width/2  - foodRadius + foodRadius*2*Math.random()) | 0;
        var y = (height/2 - foodRadius + foodRadius*2*Math.random()) | 0;
        if (inDiningRoom(x, y)) {
            var pos = at(x, y);
            if (species[pos] === empty)
                species[pos] = feed;
        }
    }
    for (var i = 0; i < 500; ++i) {
        var x = (3*width/4  - foodRadius/2 + foodRadius*Math.random()) | 0;
        var y = (3*height/4 - foodRadius/2 + foodRadius*Math.random()) | 0;
        if (inDiningRoom(x, y)) {
            var pos = at(x, y);
            if (species[pos] === empty)
                species[pos] = feed;
        }
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
