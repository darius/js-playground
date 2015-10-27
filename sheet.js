'use strict';

var canvasBounds = canvas.getBoundingClientRect();
var width        = canvas.width;
var height       = canvas.height;
var ctx          = canvas.getContext('2d');

var font = '12pt Georgia';

var constLabelOffset = {x: -14, y: 8};
var labelOffset = {x: 8, y: -18};

var scale = height / 5;

var tau = 2*Math.PI;

var scene = [];            // Array of arrows
var selection = [];        // Array of indices into scene
var draggingState = false; // false/'pan'/'pinch'/'drag' for nothing/adding/multiplying/moving
var draggingWhich;         // When draggingState is 'drag', an index into scene, the arrow to drag around
var adding;                // When draggingState is 'pan', a cnum (complex number) for the current offset
var multiplying;           // When draggingState is 'pinch', a cnum for the current factor

var nextId = 0;

function makeArrow(z, by) {
    var arrow = {at: z,
                 by: by,
                 pinned: false,
                 name: christen(by)};
    scene.push(arrow);
}

function christen(by) {
    if (by === undefined)
        return String.fromCharCode(97+nextId++);
    else {
        var L = parenthesize(scene[by.args[0]].name);
        var R = parenthesize(scene[by.args[1]].name);
        return L + by.op + R;
    }
}

function parenthesize(name) {
    return name.length === 1 ? name : '(' + name + ')';
}

function recompute(by) {
    var arg0 = scene[by.args[0]].at;
    var arg1 = scene[by.args[1]].at;
    switch (by.op) {
        case '+': return add(arg0, arg1);
        case '':  return mul(arg0, arg1);
        default: throw new Error("can't happen");
    }
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
    console.log('selecting', result);
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
    ctx.resetTransform();

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
    for (i = 1; (i-1) * scale <= width/2; ++i) { // XXX hack
        ctx.lineWidth = .5;
        for (j = 1; j <= 9; ++j) {
            gridLine(ctx, (i-1 + j/10) * scale, -height/2, (i-1 + j/10) * scale, height/2);
        }
        ctx.lineWidth = 1;
        gridLine(ctx, i * scale, -height/2, i * scale, height/2);
    }
    for (i = 1; (i-1) * scale <= height/2; ++i) { // XXX hack
        ctx.lineWidth = .5;
        for (j = 1; j <= 9; ++j) {
            gridLine(ctx, -width/2, (i-1 + j/10) * scale, width/2, (i-1 + j/10) * scale);
        }
        ctx.lineWidth = 1;
        gridLine(ctx, -width/2, i * scale, width/2, i * scale);
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
    ctx.font = 'italic ' + font;
    plot({re: 0, im: 1}, 'i', constLabelOffset);
    ctx.font = font;
}

function gridLine(ctx, x0, y0, x1, y1) {
    line(ctx, x0, y0, x1, y1);
    line(ctx, -x0, -y0, -x1, -y1);
}

function line(ctx, x0, y0, x1, y1) {
    ctx.beginPath();
    ctx.moveTo(x0 - .5, y0 - .5); // - .5 for sharp grid lines
    ctx.lineTo(x1 - .5, y1 - .5);
    ctx.stroke();
}

function plot(z, label, offset, big) {
    var x = z.re * scale;
    var y = z.im * scale;
    ctx.beginPath();
    ctx.arc(x, y, big ? 10 : 3, 0, tau);
    ctx.fill();
    if (label) {
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

function mouseCoords(event) {
    return {x: event.clientX - canvasBounds.left,
            y: event.clientY - canvasBounds.top};
}

function pointingAt(event) {
    var p = mouseCoords(event);
    return atFrom(p);
}

function atFrom(p) {
    return {re: (p.x - width/2) / scale,
            im: (height/2 - p.y) / scale};
}

function show() {
    clear();
    ctx.fillStyle = 'red';
    if (draggingState === 'pan')
        plot(adding, null, undefined, true);
    else if (draggingState === 'pinch')
        plot(multiplying, null, undefined, true);
    else if (draggingState === 'drag')
        scene.forEach(function(arrow) {
            if (arrow.by !== undefined) {
                arrow.at = recompute(arrow.by);
            }
        });
    selection.forEach(function(i) {
        var at = scene[i].at;
        if (draggingState === 'pan')
            at = add(adding, at);
        else if (draggingState === 'pinch')
            at = mul(multiplying, at);
        plot(at, null, undefined, true);
    });
    ctx.fillStyle = 'black';
    scene.forEach(plotArrow);
}

function plotArrow(arrow, i) {
    plot(arrow.at, arrow.name);
}

function onClick(at) {
    var i = selecting(at);
    if (0 <= i) {
        toggleSelection(i);
    } else {
        makeArrow(at);
    }
}

var mouseStart = null;

function onMousedown(event) {
    mouseStart = mouseCoords(event);
    var at = atFrom(mouseStart);
    var i = selecting(at);
    if (0 <= i) {
        if (scene[i].by === undefined) {
            console.log('to drag');
            draggingState = 'drag';
            draggingWhich = i;
        }
    } else if (near(at, zero)) {
        console.log('to pan');
        draggingState = 'pan';
        adding = zero;
    } else if (near(at, one)) {
        console.log('to pan');
        draggingState = 'pinch';
        multiplying = one;
    } else {
        console.log('to false');
        draggingState = false;
    }
    show();
}

function onMousemove(event) {
    if (draggingState === 'drag') {
        scene[draggingWhich].at = pointingAt(event);
    } else if (draggingState === 'pan') {
        adding = sub(pointingAt(event), atFrom(mouseStart));
    } else if (draggingState === 'pinch') {
        multiplying = add(one, sub(pointingAt(event), atFrom(mouseStart)));
    }
    show();
}

// XXX does mouseup ever have different coords from the last mousemove?
function onMouseup(event) {
    var mpos = mouseCoords(event);
    if (mouseStart.x === mpos.x && mouseStart.y === mpos.y) {
        onClick(pointingAt(event));
    } else if (draggingState === 'pan') {
        var target = selecting(atFrom(mpos));
        if (0 <= target) {
            selection.forEach(function(i) {
                makeArrow(add(adding, scene[i].at),
                          {op: '+', args: [i, target]});
            });
        }
    } else if (draggingState === 'pinch') {
        var target = selecting(atFrom(mpos));
        if (0 <= target) {
            selection.forEach(function(i) {
                makeArrow(mul(multiplying, scene[i].at),
                          {op: '', args: [i, target]});
            });
        }
    } else {
        ;
    }
    mouseStart = null;
    console.log('to false');
    draggingState = false;
    show();
}

canvas.addEventListener('mousedown', onMousedown);
canvas.addEventListener('mousemove', onMousemove);
canvas.addEventListener('mouseup',   onMouseup);

function onLoad() {
    show();
}
