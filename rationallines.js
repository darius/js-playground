'use strict';

function assert(claim) {
    if (!claim)
        throw new Error("Liar");
}

var gridWidth = gridCanvas.width;
var gridHeight = gridCanvas.height;

var divisions = 24;
var gridStyle = 'rgba(150, 150, 150, 0.05)';
var fanStyle  = 'rgba(0, 255, 0, 0.1)';

//var divisions = 12;
//var gridStyle = 'rgba(150, 150, 150, 0.15)';
//var fanStyle  = 'rgba(0, 255, 0, 0.4)';

var gridScale = gridWidth / divisions;

var slopes = [];
(function() {
    for (var x = 1; x <= divisions; ++x)
        for (var y = 1; y <= divisions; ++y)
            slopes.push(y / x);
    slopes.sort(function(u, v) { return u - v; });
    var dedup = 0;
    for (var i = 1; i < slopes.length; ++i)
        if (slopes[dedup] !== slopes[i])
            slopes[++dedup] = slopes[i];
    slopes.length = dedup+1;
})();
function bestRationalSlope(slope) {
    var i = searchOrdered(slopes, slope);
    var j = Math.min(i + 1, slopes.length - 1);
    assert(slope < slopes[0]
           ? i === 0
           : j === slopes.length-1 || slope < slopes[j]);
    return (disparity(slopes[i], slope) <= disparity(slopes[j], slope)
            ? slopes[i] : slopes[j]);
}

// Return i such that array[i] <= value && (value < array[i+1]
// || i+1 === array.length) or else 0 if no such i.
// Pre: array is sorted ascending.
function searchOrdered(array, value) {
    var lo = 0, hi = array.length;
    if (hi === 0 || value < array[0])
        return 0;
    // Inv: lo and hi are ints
    //   && lo < hi && array[lo] <= value
    //   && (hi === array.length || value < array[hi])
    while (lo+1 < hi) {
        var mid = lo + ((hi - lo) >> 1);
        if (array[mid] <= value)
            lo = mid;
        else
            hi = mid;
    }
    return lo;
}

function drawRationalGrid() {
    var ctx = gridCanvas.getContext('2d');
    ctx.clearRect(0, 0, gridWidth, gridHeight);

    ctx.strokeStyle = gridStyle;
    ctx.lineWidth = 1.5;
    for (var step = 1; step < divisions; ++step) {
        for (var i = step; i <= divisions; i += step) {
            line(ctx, i * gridScale, 0, i * gridScale, gridHeight);
            line(ctx, 0, gridHeight - i * gridScale, gridWidth, gridHeight - i * gridScale);
        }
    }

    ctx.strokeStyle = fanStyle;
    ctx.lineWidth = .5;
    for (var x = 1; x <= divisions; ++x)
        for (var y = 1; y <= divisions; ++y)
            line(ctx, 0, gridHeight, gridWidth, gridHeight - (y / x) * gridWidth);
}

function highlight(m) {
    var rationalSlope = bestRationalSlope(m);
    var d = disparity(m, rationalSlope);
    var foo = .01 / (d + .001);
    var intensity = Math.floor(255 * Math.max(0.5, Math.min(foo, 1)));

    var ctx = slopeCanvas.getContext('2d');
    ctx.clearRect(0, 0, gridWidth, gridHeight);
    ctx.strokeStyle = ctx.fillStyle = 'rgba('+intensity+', '+intensity+', 0, 1)'; // yellow
    ctx.lineWidth = 1;
    line(ctx, 0, gridHeight, gridWidth, gridHeight - rationalSlope * gridWidth);

    for (var x = 1; x <= divisions; ++x)
        for (var y = 1; y <= divisions; ++y)
            if (Math.abs(rationalSlope - y / x) <= .001)
                plot(ctx, x * gridScale, gridHeight - y * gridScale);
}

function line(ctx, x0, y0, x1, y1) {
    ctx.beginPath();
    ctx.moveTo(x0 - .5, y0 - .5); // - .5 for sharp grid lines
    ctx.lineTo(x1 - .5, y1 - .5);
    ctx.stroke();
}

function plot(ctx, x, y) {
    ctx.beginPath();
    ctx.arc(x - .5, y - .5, 2.5, 0, 2*Math.PI);
    ctx.fill();
}

function disparity(u, v) {
    return Math.abs(u - v) / Math.max(u, v);
}

var startGridX, startGridY;
var startXrate, startYrate;

var slopeCanvasBounds = slopeCanvas.getBoundingClientRect();
function onGridMousemove(event) {
    var mouseX = event.clientX - slopeCanvasBounds.left;
    var mouseY = event.clientY - slopeCanvasBounds.top;
    var dx = (mouseX - startGridX) / gridWidth;
    var dy = (startGridY - mouseY) / gridHeight;
    xrate = Math.max(.01, Math.min(startXrate + dx, 1));
    yrate = Math.max(.01, Math.min(startYrate + dy, 1));
    xomega = tau/80 * xrate;
    yomega = tau/80 * yrate;
    highlight(yrate / xrate);
}

function onGridMousedown(event) {
    startGridX = event.clientX - slopeCanvasBounds.left;
    startGridY = event.clientY - slopeCanvasBounds.top;
    startXrate = xrate;
    startYrate = yrate;
    slopeCanvas.addEventListener('mousemove', onGridMousemove, true);
}
function onGridMouseup(event)   {
    // XXX I think we have to do something extra to make sure this fires
    // when you mouseup off the canvas?
    slopeCanvas.removeEventListener('mousemove', onGridMousemove, true);
    stale = true;
}

slopeCanvas.addEventListener('mousedown', onGridMousedown);
slopeCanvas.addEventListener('mouseup', onGridMouseup);
