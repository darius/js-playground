'use strict';

var showName   = true;
var showWhence = false;

var width        = canvas.width;
var height       = canvas.height;
var ctx          = canvas.getContext('2d');

var font = '12pt Georgia';

var constLabelOffset = {x: -14, y: 8};
var labelOffset = {x: 8, y: -18};

var scale = width / 8;

var tau = 2*Math.PI;

var scene = [];            // Array of arrows
var selection = [];        // Array of indices into scene
var draggingState = false; // false/'pan'/'pinch'/'drag' for nothing/adding/multiplying/moving
var draggingWhich;         // When draggingState is 'drag', an index into scene, the arrow to drag around
var adding;                // When draggingState is 'pan', a cnum (complex number) for the current offset
var multiplying;           // When draggingState is 'pinch', a cnum for the current factor

function decodeParams(url) {
    var result = {};
    var qmark = url.indexOf('?');
    if (0 <= qmark) {
        var pairs = url.substring(qmark+1, url.length).split('&');
        for (var i = 0; i < pairs.length; ++i) {
	    var kv = pairs[i].split('=', 2);
	    result[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
        }
    }
    return result;
}

function encodeState(url) {
    var qmark = url.indexOf('?');
    var base = qmark < 0 ? url : url.substring(0, qmark);
    return (base + '?scene=' + encodeURIComponent(encodeScene())
            + '&selection=' + encodeURIComponent(encodeSelection()));
}

function onStateChange() {
    permalink.href = encodeState(document.URL);
    undoButton.disabled = 0 === scene.length;
}

function encodeScene() {
    var s = '', sep = '';
    for (var i = 0; i < scene.length; ++i) {
        s += sep;
        var arrow = scene[i];
        // chars usable without encoding: letter digit -_.~
        if (arrow.by === undefined) {
            s += 'v' + arrow.at.re + '_' + arrow.at.im;
        } else {
            switch (arrow.by.op) {
            case '+': s += 'p'; break;
            case '':  s += 't'; break;
            default: throw new Error("can't happen");
            }
            s += '' + arrow.by.args[0] + '_' + arrow.by.args[1];
        }
        sep = '~';
    }
    return s;
}

function decodeScene(s) {
    var u, i = 0;
    while (i < s.length) {
        var first;
        var sep = s.indexOf('~', i);
        if (sep < 0) {
            first = s.slice(i);
            i = s.length;
        } else {
            first = s.slice(i, sep);
            i = sep + 1;
        }
        u = first.indexOf('_');
        switch (first[0]) {
        case 'v':
            makeArrow({re: parseFloat(first.slice(1, u)),
                       im: parseFloat(first.slice(u+1))});
            break;
        case 'p':
        case 't':
            constructArrow({op: first[0] === 'p' ? '+' : '',
                            args: [parseInt(first.slice(1, u)),
                                   parseInt(first.slice(u+1))]});
            break;
        default: 
            throw new Error("Bad URL parameter " + first[0]);
        }
    }
}

function encodeSelection() {
    return selection.join('~');
}

function decodeSelection(s) {
    return s.split('~').map(function(s) { return parseInt(s); });
}

function undo() {
    if (0 < scene.length) {
        // TODO: remember the previous selection?
        // TODO: undo moves, not just new points and constructions?
        selection = selection.filter(function(i) { return i !== scene.length-1; });
        scene.pop();
        show();
        onStateChange();
    }
}

function makeArrow(z, by) {
    var arrow = {at: z,               // cnum
                 by: by,              // undefined or {op: string, arguments: [index_into_scene]}
                 name: christen(by)}; // string
    scene.push(arrow);
}

function constructArrow(by) {
    var arg0 = scene[by.args[0]].at;
    var arg1 = scene[by.args[1]].at;
    makeArrow(opFunctions[by.op](arg0, arg1), by);
}

var opFunctions = {
    '+': add,
    '':  mul,
};

function christen(by) {
    if (by === undefined) {
        return String.fromCharCode(97+nextId());
    } else if (by.args[0] === by.args[1]) {
        switch (by.op) {
        case '+': return '2' + parenthesize(scene[by.args[0]].name);
        case '':  return parenthesize(scene[by.args[0]].name) + '^2';
        default: throw new Error("can't happen");
        }
    } else {
        var L = parenthesize(scene[by.args[0]].name);
        var R = parenthesize(scene[by.args[1]].name);
        return L + by.op + R;
    }
}

function nextId() {
    var id = 0;
    scene.forEach(function(arrow) { if (arrow.by === undefined) ++id; });
    return id;
}

function parenthesize(name) {
    return name.length === 1 ? name : '(' + name + ')';
}

function recompute(by) {
    var arg0 = scene[by.args[0]].at;
    var arg1 = scene[by.args[1]].at;
    return opFunctions[by.op](arg0, arg1);
}

var selectingRadius = 0.2;

function selecting(at) {
    var result = -1;
    scene.forEach(function(arrow, i) {
        var d2 = distance2(at, arrow.at);
        if (d2 <= selectingRadius * selectingRadius
            && (result < 0 || d2 < distance2(at, scene[result].at)))
            result = i;
    });
    return result;
}

function near(u, v) {
    return distance2(u, v) <= selectingRadius;
}

function distance2(u, v) {
    return squaredMagnitude(sub(u, v));
}

// Select arrow #i unless already selected, in which case unselect it.
function toggleSelection(i) {
    for (var j = 0; j < selection.length; ++j) {
        if (selection[j] === i) {
            selection.splice(j, 1);
            return;
        }
    }
    selection.push(i);
}

function clearSelection() {
    selection = [];
}

function clear() {
    var i, j;
    ctx.font = font;

    ctx.clearRect(0, 0, width, height);

    ctx.translate(width/2, height/2);
    ctx.scale(1, -1);

    if (draggingState === 'pan') {
        ctx.save();
        ctx.translate(adding.re * scale, adding.im * scale);
    } else if (draggingState === 'pinch') {
        ctx.save();
        ctx.transform(multiplying.re, multiplying.im, -multiplying.im, multiplying.re, 0, 0);
    }

    ctx.strokeStyle = 'grey';
    ctx.lineWidth = 1;
    for (i = 1; (i-1) * scale <= width/2; ++i) { // XXX hack
        ctx.globalAlpha = .25;
        for (j = 1; j <= 9; ++j) {
            gridLines((i-1 + j/10) * scale, -height/2, (i-1 + j/10) * scale, height/2);
        }
        ctx.globalAlpha = 1;
        gridLines(i * scale, -height/2, i * scale, height/2);
    }
    for (i = 1; (i-1) * scale <= height/2; ++i) { // XXX hack
        ctx.globalAlpha = .25;
        for (j = 1; j <= 9; ++j) {
            gridLines(-width/2, (i-1 + j/10) * scale, width/2, (i-1 + j/10) * scale);
        }
        ctx.globalAlpha = 1;
        gridLines(-width/2, i * scale, width/2, i * scale);
    }

    ctx.fillStyle = 'white';
    ctx.fillRect(-width/2, -1, width, 3);
    ctx.fillRect(-1, -height/2, 3, height);

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, 0, scale, 0, tau, true);
    ctx.closePath();
    ctx.stroke();

    if (draggingState === 'pan' || draggingState === 'pinch') {
        ctx.restore();
    }

    ctx.lineWidth = 1;
    ctx.fillStyle = 'blue';
    plot(zero, '0', constLabelOffset);
    plot(one,  '1', constLabelOffset);
}

function gridLines(x0, y0, x1, y1) {
    gridLine(x0, y0, x1, y1);
    gridLine(-x0, -y0, -x1, -y1);
}

function gridLine(x0, y0, x1, y1) {
    drawLine(x0 - .5, y0 - .5, x1 - .5, y1 - .5); // - .5 for sharp grid lines
}

function plot(z, label, offset, big) {
    var x = z.re * scale;
    var y = z.im * scale;
    ctx.beginPath();
    ctx.arc(x, y, big ? 10 : 3, 0, tau);
    ctx.fill();
    if (label && showName) {
        if (offset === undefined)
            x += 7, y += 5;
        else
            x += offset.x, y += offset.y;
        ctx.save();
        ctx.scale(1, -1);
        ctx.fillText(label, x, -y);
        ctx.restore();
    }
}

function atFrom(p) {
    return {re: (p.x - width/2) / scale,
            im: (height/2 - p.y) / scale};
}

function show() {
    ctx.save();
    clear();
    ctx.fillStyle = 'red';
    if (draggingState === 'pan') {
        ctx.strokeStyle = 'magenta';
        drawLine(0, 0, scale*adding.re, scale*adding.im);
        plot(adding, null, undefined, true);
        selection.forEach(function(i) {
            var target = add(scene[i].at, adding);
            drawLine(scale*scene[i].at.re, scale*scene[i].at.im,
                     scale*target.re, scale*target.im);
        });
    } else if (draggingState === 'pinch') {
        ctx.strokeStyle = 'green';
        spiralArc(one, multiplying, multiplying);
        plot(multiplying, null, undefined, true);
        selection.forEach(function(i) {
            var target = mul(scene[i].at, multiplying);
            spiralArc(scene[i].at, multiplying, target);
        });
    } else if (draggingState === 'drag') {
        scene.forEach(function(arrow) {
            if (arrow.by !== undefined) {
                arrow.at = recompute(arrow.by);
            }
        });
    }
    selection.forEach(function(i) {
        var at = scene[i].at;
        if (draggingState === 'pan')
            at = add(adding, at);
        else if (draggingState === 'pinch')
            at = mul(multiplying, at);
        plot(at, null, undefined, true);
    });
    ctx.fillStyle = 'black';

    // To reduce clutter, only show operation curves for 
    // base-variable points when they're used in an operation.
    // (I'm not sure this is more helpful than confusing.)
    var opsUsed = {'+': [], '': []};
    scene.forEach(function(arrow, i) {
        if (arrow.by !== undefined) {
            var used = opsUsed[arrow.by.op];
            used[arrow.by.args[0]] = true;
            used[arrow.by.args[1]] = true;
        }
    });
    scene.forEach(plotArrow(opsUsed));

    ctx.restore();
}

var opColors = {'+': 'darkviolet',
                '': 'green'};

function plotArrow(opsUsed) {
    return function(arrow, i) {
        if (arrow.by === undefined) {
            if (opsUsed['+'][i] !== undefined) {
                ctx.strokeStyle = opColors['+'];
                drawLine(0, 0, scale*arrow.at.re, scale*arrow.at.im);
            }
            if (opsUsed[''][i] !== undefined) {
                ctx.strokeStyle = opColors[''];
                spiralArc(one, arrow.at, arrow.at);
            }
        } else {
            switch (arrow.by.op) {
            case '+':
                var p0 = scene[arrow.by.args[0]].at;
                var p1 = arrow.at;
                ctx.strokeStyle = opColors['+'];
                drawLine(scale*p0.re, scale*p0.im, scale*p1.re, scale*p1.im);
                break;
            case '':
                ctx.strokeStyle = opColors[''];
                spiralArc(scene[arrow.by.args[0]].at, scene[arrow.by.args[1]].at, arrow.at);
                break;
            }
        }
        plot(arrow.at, arrow.name);
    }
}

// Draw an arc from cnum u to uv.
// Assuming uv = u*v, it should approximate a logarithmic spiral
// similar to one from 1 to v.
function spiralArc(u, v, uv) {
    // Multiples of v^(1/8) as points on the spiral from 1 to v.
    var h4 = roughSqrt(v);
    var h2 = roughSqrt(h4);
    var h1 = roughSqrt(h2);
    var h3 = mul(h2, h1);
    var h5 = mul(h4, h1);
    var h6 = mul(h4, h2);
    var h7 = mul(h4, h3);

    var zs = [u,
              mul(u, h1),
              mul(u, h2),
              mul(u, h3),
              mul(u, h4),
              mul(u, h5),
              mul(u, h6),
              mul(u, h7),
              uv];
    var path = [];
    zs.forEach(function(z) {
        path.push(scale * z.re);
        path.push(scale * z.im);
    });
    drawSpline(ctx, path, 0.4, false);  // drawSpline(..., t, closed);
}

function drawLine(x0, y0, x1, y1) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
}

var mouseStart = null;

function onMousedown(coords) {
    mouseStart = coords;
    var at = atFrom(mouseStart);
    var i = selecting(at);
    if (0 <= i) {
        if (scene[i].by === undefined) {
            draggingState = 'drag';
            draggingWhich = i;
        }
    } else if (near(at, zero)) {
        draggingState = 'pan';
        adding = zero;
    } else if (near(at, one)) {
        draggingState = 'pinch';
        multiplying = one;
    } else {
        draggingState = false;
    }
    show();
}

function onMousemove(coords) {
    if (draggingState === 'drag') {
        scene[draggingWhich].at = atFrom(coords);
        show();
    } else if (draggingState === 'pan') {
        adding = sub(atFrom(coords), atFrom(mouseStart));
        show();
    } else if (draggingState === 'pinch') {
        multiplying = add(one, sub(atFrom(coords), atFrom(mouseStart)));
        show();
    }
}

// XXX does mouseup ever have different coords from the last mousemove?
function onMouseup(coords) {
    if (mouseStart.x === coords.x && mouseStart.y === coords.y) {
        onClick(atFrom(coords));
    } else if (draggingState === 'pan') {
        performOp(coords, '+');
    } else if (draggingState === 'pinch') {
        performOp(coords, '');
    } else if (draggingState === 'drag') {
        onStateChange();
    } else {
        ;
    }
    mouseStart = null;
    draggingState = false;
    show();
}

function performOp(coords, op) {
    var target = selecting(atFrom(coords));
    if (0 <= target) {
        var newSelection = [];
        selection.forEach(function(sel) {
            newSelection.push(scene.length);
            constructArrow({op: op, args: [sel, target]});
        });
        selection = newSelection;
        onStateChange();
    }
}

function onClick(at) {
    var i = selecting(at);
    if (0 <= i) {
        toggleSelection(i);
    } else {
        makeArrow(at);
        onStateChange();
    }
}

function mouseHandler(handler) {
    return function(event) { handler(mouseCoords(event)); };
}

function mouseCoords(event) {
    var canvasBounds = canvas.getBoundingClientRect();
    return {x: event.clientX - canvasBounds.left,
            y: event.clientY - canvasBounds.top};
}

function leftButtonOnly(handler) {
    return function(event) {
        if (event.button === 0) { // left mouse button
            handler(event);
        }
    };
}

canvas.addEventListener('mousedown', leftButtonOnly(mouseHandler(onMousedown)));
canvas.addEventListener('mousemove', mouseHandler(onMousemove));
canvas.addEventListener('mouseup',   mouseHandler(onMouseup));

var mouseMoved = null;

function onTouchstart(event) {
    event.preventDefault();     // to disable mouse events
    if (event.touches.length === 1) {
        var canvasBounds = canvas.getBoundingClientRect();
        var coords = {x: event.touches[0].pageX - canvasBounds.left,
                      y: event.touches[0].pageY - canvasBounds.top};
        mouseMoved = coords;
        onMousedown(coords);
    }
}

function onTouchmove(event) {
    if (event.touches.length === 1) {
        var canvasBounds = canvas.getBoundingClientRect();
        var coords = {x: event.touches[0].pageX - canvasBounds.left,
                      y: event.touches[0].pageY - canvasBounds.top};
        mouseMoved = coords;
        onMousemove(coords);
    }
}

function onTouchend(event) {
    if (event.touches.length === 0) {
        onMouseup(mouseMoved);
    }
    mouseMoved = null;
}

canvas.addEventListener('touchstart', onTouchstart, false);
canvas.addEventListener('touchmove',  onTouchmove,  false);
canvas.addEventListener('touchend',   onTouchend,   false);

function onLoad() {
    show();
}

var params = decodeParams(document.URL);
if (params.scene) decodeScene(params.scene);
if (params.selection) selection = decodeSelection(params.selection);

undoButton.onclick = function() {
    undo();
    return false;
};
undoButton.disabled = 0 === scene.length;
