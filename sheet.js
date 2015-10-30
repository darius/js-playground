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

var nextId = 0;

function makeArrow(z, by) {
    var arrow = {at: z,               // cnum
                 by: by,              // undefined or {op: string, arguments: [index_into_scene]}
                 name: christen(by)}; // string
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
    scene.forEach(plotArrow);
    ctx.restore();
}

function plotArrow(arrow, i) {
    if (arrow.by === undefined) {
        ctx.strokeStyle = 'magenta';
        drawLine(0, 0, scale*arrow.at.re, scale*arrow.at.im);
        ctx.strokeStyle = 'green';
        spiralArc(one, arrow.at, arrow.at);
    } else {
        switch (arrow.by.op) {
        case '+':
            var p0 = scene[arrow.by.args[0]].at;
            var p1 = arrow.at;
            ctx.strokeStyle = 'magenta';
            drawLine(scale*p0.re, scale*p0.im, scale*p1.re, scale*p1.im);
            break;
        case '':
            ctx.strokeStyle = 'green';
            spiralArc(scene[arrow.by.args[0]].at, scene[arrow.by.args[1]].at, arrow.at);
            break;
        }
    }
    plot(arrow.at, arrow.name);
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

function onClick(at) {
    var i = selecting(at);
    if (0 <= i) {
        toggleSelection(i);
    } else {
        makeArrow(at);
    }
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
    } else if (draggingState === 'pan') {
        adding = sub(atFrom(coords), atFrom(mouseStart));
    } else if (draggingState === 'pinch') {
        multiplying = add(one, sub(atFrom(coords), atFrom(mouseStart)));
    }
    show();
}

// XXX does mouseup ever have different coords from the last mousemove?
function onMouseup(coords) {
    if (mouseStart.x === coords.x && mouseStart.y === coords.y) {
        onClick(atFrom(coords));
    } else if (draggingState === 'pan') {
        var newSelection = [];
        var target = selecting(atFrom(coords));
        if (0 <= target) {
            selection.forEach(function(i) {
                newSelection.push(scene.length);
                makeArrow(add(scene[target].at, scene[i].at),
                          {op: '+', args: [i, target]});
            });
        }
        selection = newSelection;
    } else if (draggingState === 'pinch') {
        var newSelection = [];
        var target = selecting(atFrom(coords));
        if (0 <= target) {
            selection.forEach(function(i) {
                newSelection.push(scene.length);
                makeArrow(mul(scene[target].at, scene[i].at),
                          {op: '', args: [i, target]});
            });
        }
        selection = newSelection;
    } else {
        ;
    }
    mouseStart = null;
    draggingState = false;
    show();
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
