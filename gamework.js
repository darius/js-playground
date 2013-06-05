// A rewrite of https://github.com/maryrosecook/coquette
// for my own understanding. This is missing some features,
// uses different names, etc., but it's clearly derivative.

function makeGame(canvasId, width, height, backgroundColor) {
    var canvas = maybeGetElement(canvasId);
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext('2d');

    var keyDown = {};
    window.addEventListener('keydown',
                            function(event) { keyDown[event.keyCode] = true; },
                            false);
    window.addEventListener('keyup',
                            function(event) { keyDown[event.keyCode] = false; },
                            false);

    var actors = [];
    return {
        addActor: function(actor) {
            actors.push(actor);
        },
        start: function() {
            animating(function(dt) {
                actors.forEach(function(actor) {
                    if (actor.tick) actor.tick(dt);
                });
                trackBumps(actors);
                
                ctx.fillStyle = backgroundColor;
                ctx.fillRect(0, 0, width, height); // XXX clearRect?
                actors.forEach(function(actor) {
                    if (actor.paint) actor.paint(ctx);
                });
            });
        },
        isPressed: function(key) {
            if (typeof key === 'string')
                key = key.charCodeAt(0);
            return !!keyDown[key];
        },
    };
}

var keycodes = { 
    backspace: 8,
    tab: 9,
    enter: 13,
    shift: 16,
    ctrl: 17,
    alt: 18,
    pause: 19,
    capsLock: 20,
    esc: 27,
    space: 32,
    pageUp: 33,
    pageDown: 34,
    end: 35,
    home: 36,
    leftArrow: 37,
    upArrow: 38,
    rightArrow: 39,
    downArrow: 40,
    insert: 45,
    delete_: 46,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
    numLock: 144,
    scrollLock: 145,
    semicolon: 186,
    equals: 187,
    comma: 188,
    dash: 189,
    period: 190,
    slash: 191,
    backquote: 192,
    lbracket: 219,
    backslash: 220,
    rbracket: 221,
    quote: 222
};

function trackBumps(actors) {
    var n = actors.length;
    for (var i = 0; i < n; ++i)
        for (var j = i+1; j < n; ++j)
            if (intersect(actors[i], actors[j])) {
                if (actors[i].bump) actors[i].bump(actors[j]);
                if (actors[j].bump) actors[j].bump(actors[i]);
            }
}

function intersect(actor1, actor2) {
    return (actor1.intersects ? actor1.intersects(actor2) :
            actor2.intersects && actor2.intersects(actor1));
}

function boxesIntersect(pos1, extent1, pos2, extent2) {
    return (rangesIntersect(pos1.x, extent1.x, pos2.x, extent2.x)
            && rangesIntersect(pos1.y, extent1.y, pos2.y, extent2.y))
}

function rangesIntersect(v1, h1, v2, h2) {
    return Math.max(v1, v2) < Math.min(v1+h1, v2+h2);
}

// XXX rename?
function merge(object, options) {
    var result = {};
    for (var p in options) result[p] = options[p];
    for (p in object) result[p] = object[p];
    return result;
}

// TODO check for errors
function maybeGetElement(elementOrId) {
    if (typeof elementOrId === 'string')
        return document.getElementById(elementOrId);
    else
        return elementOrId;
}

function animating(render) {
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
