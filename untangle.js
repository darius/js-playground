'use strict';

var width = canvas.width;
var height = canvas.height;
var ctx = canvas.getContext('2d');

function randomInt(n) {
    return (n * Math.random()) | 0;
}

var ww = (width/10) >> 0;
var hh = (height/10) | 0;
var magnet = new Array(ww * hh);
var changed = new Array(ww * hh);

function at(x, y) {
    return ww * y + x;
}

function setup() {
    for (var y = 0; y < hh; ++y)
        for (var x = 0; x < ww; ++x) {
            magnet[at(x, y)] = randomInt(2);
            changed[at(x, y)] = 0; // TODO: init to 1, rename to lineWidth or something
        }
}
setup();

function tick() {
    for (var i = 0; i < 333; ++i)
        randomSlash();
    redraw();                 // TODO: redraw only the changed regions?
}

function fieldFromValue(val) {
    return 2 * val - 1;
}

var anyway = .05;
var ferromagnetic = -1;

// TODO: extract to library
var canvasBounds = canvas.getBoundingClientRect();
var mouseX = 100;
var mouseY = 20;
function onMousemove(event) {
    mouseX = event.clientX - canvasBounds.left;
    mouseY = event.clientY - canvasBounds.top;
    anyway = (1 - mouseY / height) / 10;
}
canvas.addEventListener('mousemove', onMousemove);
// To get the initial position before any mousemove:
document.addEventListener('mouseover', onMousemove);

canvas.addEventListener('mousedown', function() {
    ferromagnetic *= -1;
});

function randomSlash() {
    var x = 1 + randomInt(ww-2);
    var y = 1 + randomInt(hh-2);
    var p = at(x, y);
    var field = fieldFromValue(.25 * (  magnet[at(x+1,y)]
                                      + magnet[at(x-1,y)]
                                      + magnet[at(x,y+1)]
                                      + magnet[at(x,y-1)]));
    var oldval = magnet[p];
    var newval = oldval ^ 1;
    var oldE = field * fieldFromValue(oldval) * ferromagnetic;
    var newE = field * fieldFromValue(newval) * ferromagnetic;
    if (newE <= oldE || Math.random() < anyway) {
        magnet[p] ^= 1;
        changed[p] = 4;
    }
}

function redraw() {
    ctx.clearRect(0, 0, width+2, height);

    ctx.strokeStyle = 'white';
    var lw = ctx.lineWidth = 1;
    for (var y = 0; y < hh; ++y)
        for (var x = 0; x < ww; ++x) {
            var p = at(x, y);
            if (0 < changed[p]) {
                var newWidth = changed[p] + 1;
                if (lw != newWidth)
                    lw = ctx.lineWidth = newWidth;
                changed[p] -= .25;
            } else if (lw != 1)
                lw = ctx.lineWidth = 1;

            var dir = magnet[p];
            ctx.beginPath();
            ctx.moveTo((x+dir)*10, y*10);
            ctx.lineTo((x+(1-dir))*10, (y+1)*10);
            ctx.stroke();
        }
}

/*
TODO:
- comments
- show local energy at each grid square, by color maybe?
- show each 'hit', transiently, even when it doesn't flip it
*/
