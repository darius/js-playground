'use strict';

// A fanciful sketch of how sheet.js ought to go.

var maxClickDistance = 2;
var minSelectionDistance = 20;
var dotRadius = 3;
var selectedDotRadius = 10;

function onLoad() {
    var params = decodeParams(document.URL);
    var quiver = makeQuiver();
    var ui = makeSheetUI(quiver, canvas,
                         {realSpan: 8,
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

    function serialize() {
        // XXX
        return '';
    }

    function deserialize(params) {
        // XXX
    }

    function getLines() {
        // XXX
        return [];
    }

    function isEmpty() {
        return 0 < arrows.length;
    }

    function getArrows() {
        return arrows;
    }

    function getFreeArrows() {
        return arrows.filter(function(arrow) { return arrow.op === variableOp; });
    }

    function add(arrow) {
        arrow.label = arrow.op.label(arrow, arrows);
        arrows.push(arrow);
        recompute(arrow);
        return arrow;
    }

    function makeConstantArrow(at) {
        return add({op: constantOp, at: at});
    }

    function addFreeArrow(at) {
        return add({op: variableOp, at: value});
    }

    function constructArrow(op, arg1, arg2) {
        return add({op: op, arg1: arg1, arg2: arg2});
    }

    function moveTo(arrow, at) {
        arrow.at = at;
    }

    function onMove() {
        arrows.forEach(recompute);
    }

    function recompute(arrow) {
        arrow.op.recompute(arrow);
    }

    var quiver = {
        addFreeArrow: addFreeArrow,
        constructArrow: constructArrow,
        deserialize: deserialize, serialize: serialize,
        isEmpty: isEmpty,
        getArrows: getArrows,
        getFreeArrows: getFreeArrows,
        getLines: getLines,
        makeConstantArrow: makeConstantArrow,
        moveTo: moveTo,
        onMove: onMove,
    };
    return quiver;
}

var constantOp = {
    color: 'blue',
    labelOffset: {x: 0, y: 0},
    label: function(arrow) {
        var z = arrow.at;
        if      (z.im === 0) return '' + z.re;
        else if (z.re === 0) return '' + z.im + 'i';
        else                 return '' + z.re + '+' + z.im + 'i';
    },
    recompute: noOp,
    showProvenance: noOp,
};

var variableOp = {
    color: 'black',
    labelOffset: {x: 0, y: 0},
    label: function(arrow, arrows) {
        var freeArrows =
            arrows.filter(function(arrow) { return arrow.op === variableOp; }); // XXX duplicate code
        return String.fromCharCode(97 + freeArrows.length);
    },
    recompute: noOp,
    showProvenance: function(arrow, sheet) { // XXX fix the caller
        sheet.drawLine(zero, arrow.at);
        sheet.drawSpiral(one, arrow.at, arrow.at);
    }
};

var addOp = {
    color: 'black',
    labelOffset: {x: 0, y: 0},
    label: function(arrow, arrows) {
        if (arrow.arg1 === arrow.arg2) {
            return '2' + parenthesize(arrow.arg1.label);
        } else {
            return infixLabel(arrow.arg1, '+', arrow.arg2);
        }
    },
    recompute: function(arrow) {
        arrow.at = add(arrow.arg1, arrow.arg2);
    },
    showProvenance: function(arrow, sheet) {
        sheet.drawLine(arrow.arg1, arrow.at);
    },
};

var multiplyOp = {
    color: 'black',
    labelOffset: {x: 0, y: 0},
    label: function(arrow, arrows) {
        if (arrow.arg1 === arrow.arg2) {
            return parenthesize(arrow.arg1.label) + '^2';
        } else {
            return infixLabel(arrow.arg1, '', arrow.arg2);
        }
    },
    recompute: function(arrow) {
        arrow.at = mul(arrow.arg1, arrow.arg2);
    },
    showProvenance: function(arrow, sheet) {
        sheet.drawSpiral(arrow.arg1, arrow.arg2, arrow.at);
    },
};

function infixLabel(arg1, opLabel, arg2) {
    var L = parenthesize(arg1.label);
    var R = parenthesize(arg2.label);
    return L + opLabel + R;
}

var tau = 2*Math.PI;

// A sheet UI presents a quiver on a canvas, along with state
// and controls for seeing and manipulating the quiver.
function makeSheetUI(quiver, canvas, options, controls) {
    options = override({adding:      true,
                        center:      zero,
                        multiplying: true,
                        realSpan:    8},
                       options);

    var ctx    = canvas.getContext('2d');
    var width  = canvas.width;   // N.B. it's best if these are even
    var height = canvas.height;
    var left   = -width/2;
    var right  =  width/2;
    var bottom = -height/2;
    var top    =  height/2;
    var scale  = width / options.realSpan;

    function pointFromXY(xy) {
        return {re: xy.x / scale, im: xy.y / scale};
    }
    var minSelectionDistance2 = Math.pow(minSelectionDistance / scale, 2);
    var maxClickDistance2     = Math.pow(maxClickDistance / scale, 2);

    ctx.font = font;
    ctx.translate(right, top);
    ctx.scale(1, -1);

    if (options.center.re !== 0 || options.center.im !== 0) {
        throw new Error("off-center sheet not supported yet");
    }

    function drawDot(at, radius) {
        ctx.beginPath();
        ctx.arc(scale * at.re, scale * at.im, radius, 0, tau);
        ctx.fill();
    }

    function drawLine(at1, at2) {
        ctx.beginPath();
        ctx.moveTo(scale * at1.re, scale * at1.im);
        ctx.lineTo(scale * at2.re, scale * at2.im);
        ctx.stroke();
    }

    // N.B. textOffset is in canvas (xy) coordinates.
    function drawText(at, text, textOffset) {
        var x = at.re * scale + offset.x;
        var y = at.im * scale + offset.y;
        ctx.save();
        ctx.scale(1, -1); // Back into left-handed coordinates so the text isn't flipped
        ctx.fillText(text, x, -y);
        ctx.restore();
    }

    // Draw an arc from cnum u to uv (which should be u*v).
    function drawSpiral(u, v, uv) {
        var zs = computeSpiralArc(u, v, uv);
        var path = [];
        zs.forEach(function(z) {
            path.push(scale * z.re);
            path.push(scale * z.im);
        });
        drawSpline(ctx, path, 0.4, false);
    }

    var sheet = {
        drawDot: drawDot,
        drawText: drawText,
        drawLine: drawLine,
        drawSpiral: drawSpiral,
    };

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
        arrow.op.showProvenance(arrow, sheet);
        showArrow(arrow);
    }

    function showArrowSelected(arrow) {
        drawDot(arrow.at, selectedDotRadius);
    }

    function showArrow(arrow) {
        ctx.fillStyle = arrow.op.color;
        drawDot(arrow.at, dotRadius);
        drawText(arrow.at, arrow.label, arrow.op.labelOffset);
    }

    function showLine(line) {
        // XXX
    }

    function undo() {
        // XXX
        controls.undo.disabled = quiver.isEmpty();
    }

    function onStateChange() {
        if (controls.permalink) {
            controls.permalink.href = makeURL(controls.permalink, serialize());
        }
        if (controls.undo) {
            controls.undo.disabled = XXX;
        }
    }


    function isCandidatePick(at, arrow) {
        return distance2(at, arrow.at) <= minSelectionDistance2;
    }

    // TODO: make a list of constants, probably
    var zeroArrow = quiver.makeConstantArrow(zero, '0');
    var oneArrow  = quiver.makeConstantArrow(one,  '1');

    var emptyHand = {
        moveFromStart: noOp,
        onMove: noOp,
        onEnd: noOp,
        dragGrid: noOp,
        show: noOp,
    };

    function makeNonHand(startAt) {
        var strayed = false;
        function moveFromStart(offset) {
            strayed = strayed || maxClickDistance2 < distance2(zero, offset);
        }
        function onEnd() {
            if (!strayed) onClick(at);
        }
        return {
            moveFromStart: moveFromStart,
            onMove: noOp,
            onEnd: onEnd,     // TODO: add to the undo stack
            dragGrid: noOp,
            show: noOp
       };
    }

    function onClick(at) {
        var choice = pickTarget(at, quiver.getArrows());
        if (choice !== null) {
            toggleSelection(choice);
        } else {
            quiver.addFreeArrow(at);
        }
    }

    // Select arrow unless already selected, in which case unselect it.
    function toggleSelection(arrow) {
        assert(0 <= selection.length && selection.length <= 1);
        if (arrow === selection[0]) {
            selection = [];
        } else {
            selection = [arrow];
        }
    }

    function makeMoverHand(startPoint, arrow) {
        var startAt = arrow.at;
        function moveFromStart(offset) {
            quiver.moveTo(arrow, add(startAt, offset));
        }
        function onMove() {
            quiver.onMove();
        }
        return {
            moveFromStart: moveFromStart,
            onMove: onMove,
            onEnd: onMove,     // TODO: add to the undo stack
            dragGrid: noOp,
            show: noOp,
        };
    }

    function makeAddHand(startPoint) {
        var adding = zero;
        function moveFromStart(offset) {
            adding = offset;
        }
        function onEnd() {
            perform(addOp, adding);
        }
        return {
            moveFromStart: moveFromStart,
            onMove: noOp,
            onEnd: onEnd,
            dragGrid: function() {
                ctx.translate(adding.re * scale, adding.im * scale);
            },
            show: function() {
                ctx.strokeStyle = 'magenta';
                drawLine(zero, adding);
            }
        };
    }

    function makeMultiplyHand(startPoint) {
        var multiplying = one;
        function moveFromStart(offset) {
            multiplying = add(one, offset);
        }
        function onEnd() {
            perform(mulOp, multiplying);
        }
        return {
            moveFromStart: moveFromStart,
            onMove: noOp,
            onEnd: onEnd,
            dragGrid: function() {
                ctx.transform(multiplying.re, multiplying.im, -multiplying.im, multiplying.re, 0, 0);
            },
            show: function() {
                ctx.strokeStyle = 'green';
                drawSpiral(one, multiplying, multiplying);
            }
        };
    }

    function perform(op, at) {
        var target = pickTarget(at, quiver.getArrows()); // TODO: also the constants
        if (target !== null) {
            selection = selection.map(function(argument) {
                return quiver.constructArrow(op, argument, target);
            });
            onStateChange();
        }
    }

    function pickTarget(at, arrows) {
        var candidates = arrows.filter(function(arrow) {
            return isCandidatePick(at, arrow);
        });
        return 0 < candidates.length ? pickClosestTo(at, candidates) : null;
    }

    function chooseHand(at) {
        var target = pickTarget(at, quiver.getFreeArrows());
        if (target !== null) {
            return makeMoverHand(at, target);
        } else if (options.adding && isCandidatePick(at, zeroArrow)) {
            return makeAddHand(at);
        } else if (options.multiplying && isCandidatePick(at, oneArrow)) {
            return makeMultiplyHand(at);
        } else {
            return makeNonHand(at);
        }
    }

    var hand = emptyHand;
    var handStartedAt;

    var pointerListener = {
        onStart: function(xy) {
            handStartedAt = pointFromXY(xy);
            hand = chooseHand(handStartedAt);
            show();
        },
        onMove: function(xy) {
            hand.moveFromStart(sub(pointFromXy(xy), handStartedAt));
            hand.onMove();
            show();
        },
        onEnd: function(xy) {
            hand.moveFromStart(sub(pointFromXy(xy), handStartedAt));
            hand.onEnd();
            hand = emptyHand;
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

    var prevTouch = null;

    function onTouchstart(event) {
        event.preventDefault();     // to disable mouse events
        if (event.touches.length === 1) {
            prevTouch = touchCoords(event.touches[0]);
            listener.onStart(prevTouch);
        }
    }

    function onTouchmove(event) {
        if (event.touches.length === 1) {
            prevTouch = touchCoords(event.touches[0]);
            listener.onMove(prevTouch);
        }
    }

    function onTouchend(event) {
        if (event.touches.length === 0) {
            listener.onEnd(prevTouch);
        } else {
            onTouchmove(event);
        }
        prevTouch = null;
    }

    canvas.addEventListener('touchstart', onTouchstart);
    canvas.addEventListener('touchmove',  onTouchmove);
    canvas.addEventListener('touchend',   onTouchend);

    canvas.addEventListener('mousedown', leftButtonOnly(mouseHandler(canvas, listener.onStart)));
    canvas.addEventListener('mousemove', mouseHandler(canvas, listener.onMove));
    canvas.addEventListener('mouseup',   mouseHandler(canvas, listener.onEnd));
}


// Helpers

function noOp() { }

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

function mouseHandler(canvas, handler) {
    return function(event) { handler(mouseCoords(canvas, event)); };
}

function leftButtonOnly(handler) {
    return function(event) {
        if (event.button === 0) { // left mouse button
            handler(event);
        }
    };
}

function assert(claim) {
    if (!claim) {
        throw new Error("Liar");
    }
}

function makeURL(url, params) {
    // XXX
}


// Return a sequence of points along an arc from cnum u to uv.
// Assuming uv = u*v, it should approximate a logarithmic spiral
// similar to one from 1 to v.
function computeSpiralArc(u, v, uv) {
    // Multiples of v^(1/8) as points on the spiral from 1 to v.
    var h4 = roughSqrt(v);
    var h2 = roughSqrt(h4);
    var h1 = roughSqrt(h2);
    var h3 = mul(h2, h1);
    var h5 = mul(h4, h1);
    var h6 = mul(h4, h2);
    var h7 = mul(h4, h3);

    return [u,
            mul(u, h1),
            mul(u, h2),
            mul(u, h3),
            mul(u, h4),
            mul(u, h5),
            mul(u, h6),
            mul(u, h7),
            uv];
}
