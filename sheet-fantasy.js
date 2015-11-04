'use strict';

// A fanciful sketch of how sheet.js ought to go.

var minSelectionDistance = 20;

function onLoad() {
    var params = decodeParams(document.URL);
    var quiver = makeQuiver();
    var ui = makeSheetUI(quiver, canvas,
                         {xScale: 8,
                          center: zero},
                         {undo: undoButton,
                          showArith: showarithCheckbox,
                          showLines: showlinesCheckbox});
    ui.deserialize(params);
    ui.show();
}

// A quiver is a collection of arrows, with dependencies between some of them.
// The arrows can move, and can be added or removed from the collection.
// It's the 'model' with respect to the sheet UI.
function makeQuiver() {

    var arrows = [];

    function add(XXX) {
        // XXX
    }

    function serialize() {
        // XXX
        return '';
    }

    function deserialize(params) {
        // XXX
    }

    function isEmpty() {
        return 0 < arrows.length;
    }

    function getArrows() {
        return arrows;
    }

    function getFreeArrows() {
        return arrows.filter(XXX);
    }

    function getLines() {
        // XXX
        return [];
    }

    function onMove() {
        arrows.forEach(recompute);
    }

    function recompute(arrow) {
        // XXX
    }

    var quiver = {
        add: add,
        deserialize: deserialize, serialize: serialize,
        isEmpty: isEmpty,
        getArrows: getArrows,
        getFreeArrows: getFreeArrows,
        getLines: getLines,
        onMove: onMove,
    };
    return quiver;
}

var minSelectionDistance2 = Math.pow(minSelectionDistance, 2);
var tau = 2*Math.PI;

// A sheet UI presents a quiver on a canvas, along with state
// and controls for seeing and manipulating the quiver.
function makeSheetUI(quiver, canvas, options, controls) {
    options = override({adding:      true,
                        center:      zero,
                        multiplying: true,
                        xScale:      8},
                       options);

    var ctx    = canvas.getContext('2d');
    var width  = canvas.width;   // N.B. it's best if these are even
    var height = canvas.height;
    var left   = -width/2;
    var right  =  width/2;
    var bottom = -height/2;
    var top    =  height/2;
    var scale  = width / options.xScale;

    ctx.font = font;
    ctx.translate(right, top);
    ctx.scale(1, -1);

    if (options.center.re !== 0 || options.center.im !== 0) {
        throw new Error("off-center sheet not supported yet");
    }

    var selection = [];

    function serialize() {
        // XXX
        return '';
    }

    function deserialize(params) {
        if (params.quiver) quiver.deserialize(params.quiver);
        if (params.selection) throw new Error('XXX');
    }

    function show() {
        ctx.save();
        ctx.clearRect(left, bottom, width, height);

        ctx.save();
        hand.dragGrid();
        showGrid(ctx, width, height, left, bottom, right, top, scale);
        ctx.fillStyle = 'red';
        selection.forEach(showArrowSelected);
        ctx.restore();

        hand.show();

        [zeroArrow, oneArrow].forEach(showArrow);
        quiver.getArrows().forEach(controls.showArith.checked ? showArrowAsMade : showArrow);

        if (controls.showLines.checked) {
            ctx.strokeStyle = 'black';
            quiver.getLines().forEach(showLine);
        }

        ctx.restore();
    }

    function showArrowAsMade(arrow) {
        arrow.op.showProvenance(arrow, ctx, scale);
        showArrow(arrow);
    }

    function showArrowSelected(arrow) {
        // XXX
    }

    function showArrow(arrow) {
        // XXX
    }

    function showLine(line) {
        // XXX
    }

    function undo() {
        // XXX
        controls.undo.disabled = quiver.isEmpty();
    }

    function startPointingAt(xy) { // xy is in canvas coords
        var choice = pickPointedTo(xy, quiver.getFreeArrows());
        if (choice !== null) {
            return makeFreeDragger(xy, choice);
        }
        if (options.adding && isCandidatePick(xy, zeroArrow)) { // TODO: make a list of constants, probably
            return makeAddDragger(xy);
        }
        if (options.multiplying && isCandidatePick(xy, oneArrow)) {
            return makeMultiplyDragger(xy);
        }
        return makeNonDragger(xy);
    }

    function isCandidatePick(xy, arrow) {
        return xyDistance2(xy, arrow.xy) <= minSelectionDistance2;
    }

    var zeroArrow = XXX;
    var oneArrow = XXX;

    function makeNonDragger(startXY) {
        var strayed = false;
        function moveTo(xy) {
            if (startXY.x !== xy.x || startXY.y !== xy.y) {
                strayed = true; // XXX make it less sensitive
            }
        }
        return {
            moveTo: moveTo,
            stopAt: function(xy) {
                moveTo(xy);
                if (!strayed) {
                    onClick(xy);
                }
            },
            dragGrid: function() { },
            show: function() { }
       };
    }

    function onClick(xy) {
        var choice = pickPointedTo(xy, quiver.getArrows());
        if (choice !== null) {
            toggleSelection(choice);
        } else {
            addArrow(xy);
        }
    }

    function addArrow(xy) {
        // XXX
        quiver.add(XXX);
    }

    function toggleSelection(arrow) {
        // XXX
    }

    function makeFreeDragger(startXY, arrow) {
        var startAt = arrow.at();
        function moveTo(xy) {
            arrow.moveTo(add(startAt, pointFromXY(xy.x - startXY.x,
                                                  xy.y - startXY.y)));
            quiver.onMove();
        }
        return {
            moveTo: moveTo,
            stopAt: moveTo,     // TODO: add to the undo stack
            dragGrid: function() { },
            show: function() { }
        };
    }

    function makeAddDragger(startXY) {
        var adding = zero;
        function moveTo(xy) {
            adding = pointFromXY(xy.x - startXY.x,
                                 xy.y - startXY.y);
        }
        return {
            moveTo: moveTo,
            stopAt: function(xy) {
                moveTo(xy);
                // XXX
            },
            dragGrid: function() {
                ctx.translate(adding.re * scale, adding.im * scale);
            },
            show: function() {
                ctx.strokeStyle = 'magenta';
                drawLine(zero, adding);
            }
        };
    }

    function makeMultiplyDragger(startXY) {
        var multiplying = one;
        function moveTo(xy) {
            // XXX
        }
        return {
            moveTo: moveTo,
            stopAt: function(xy) {
                moveTo(xy);
                // XXX
            },
            dragGrid: function() {
                ctx.transform(multiplying.re, multiplying.im, -multiplying.im, multiplying.re, 0, 0);
            },
            show: function() {
                ctx.strokeStyle = 'green';
                spiralArc(one, multiplying, multiplying);
            }
        };
    }

    function pickPointedTo(xy, arrows) {
        var candidates = arrows.filter(function(arrow) {
            return isCandidatePick(xy, arrow);
        });
        return 0 < candidates.length ? pickClosestTo(xy, candidates) : null;
    }

    var hand = null;

    var pointerListener = {
        onStart: function(xy) {
            hand = startPointingAt(xy);
            show();
            // XXX also return false?
        },
        onMove: function(xy) {
            hand.moveTo(xy);
            show();
        },
        onEnd: function(xy) {
            hand.stopAt(xy);
            hand = null;
            show();
        },
    };
    addPointerListener(canvas, pointerListener);

    if (controls.undo) {
        controls.undo.addEventListener('click', asListener(undo));
        controls.undo.disabled = quiver.isEmpty();
    }
    if (controls.showArith) {
        controls.showArith.addEventListener('click', asListener(show));
    }
    if (controls.showLines) {
        controls.showLines.addEventListener('click', asListener(show));
    }

    var ui = {
        deserialize: deserialize, serialize: serialize,
        show: show,
    };
    return ui;
}

function showGrid(ctx, width, height, left, bottom, right, top, scale) {
    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1;
    for (i = 1; (i-1) * scale <= right; ++i) { // XXX hack
        ctx.globalAlpha = .25;
        for (j = 1; j <= 9; ++j) {
            gridLines((i-1 + j/10) * scale, bottom, (i-1 + j/10) * scale, top);
        }
        ctx.globalAlpha = 1;
        gridLines(i * scale, bottom, i * scale, top);
    }
    for (i = 1; (i-1) * scale <= top; ++i) { // XXX hack
        ctx.globalAlpha = .25;
        for (j = 1; j <= 9; ++j) {
            gridLines(left, (i-1 + j/10) * scale, right, (i-1 + j/10) * scale);
        }
        ctx.globalAlpha = 1;
        gridLines(left, i * scale, right, i * scale);
    }

    ctx.fillStyle = 'white';
    ctx.fillRect(left, -1, width, 3);
    ctx.fillRect(-1, bottom, 3, height);

    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, scale, 0, tau, true);
    ctx.closePath();
    ctx.stroke();
}

function addPointerListener(canvas, listener) {
    // XXX
    canvas.addEventListener('touchstart', onTouchstart);
    canvas.addEventListener('touchmove',  onTouchmove);
    canvas.addEventListener('touchend',   onTouchend);

    canvas.addEventListener('mousedown', leftButtonOnly(mouseHandler(onMousedown)));
    canvas.addEventListener('mousemove', mouseHandler(onMousemove));
    canvas.addEventListener('mouseup',   mouseHandler(onMouseup));
}


// Helpers

// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
function override(obj1, obj2) {
    return Object.assign(obj1, obj2); // XXX ipad 1 won't have this
}

function asListener(act) {
    act();
    return false;               // TODO: what's this for, again?
}

function touchCoords(canvas, touch) {
    return canvasCoords(canvas, event.touches[0].pageX, event.touches[0].pageY);
}

function mouseCoords(canvas, event) {
    return canvasCoords(canvas, event.clientX, event.clientY);
}

function canvasCoords(canvas, pageX, pageY) {
    var canvasBounds = canvas.getBoundingClientRect();
    return {x: pageX - canvasBounds.left,
            y: pageY - canvasBounds.top};
}

function mouseHandler(handler) {
    return function(event) { handler(mouseCoords(event)); };
}

function leftButtonOnly(handler) {
    return function(event) {
        if (event.button === 0) { // left mouse button
            handler(event);
        }
    };
}
