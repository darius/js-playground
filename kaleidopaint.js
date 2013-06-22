function fingerpaint(canvas, report) {
    var width = 0+canvas.width;
    var height = 0+canvas.height;
    var ox = width/2;
    var oy = height/2;

    var ctx = canvas.getContext('2d');
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    var offset = {x: canvas.offsetLeft, y: canvas.offsetTop};
    var points = [];
    var colors  = ['rgba(0,255,0,0.2)', 'rgba(255,0,0,0.2)', 'rgba(0,0,255,0.2)', 'rgba(0,128,128,0.2)', 'rgba(128,0,128,0.2)', 'rgba(128,128,0,0.2)'];

    function touchstart(event) {
        report('touchstart' + show(event.touches));
        forEach(event.touches, function (touch) {
            points[touch.identifier] = {x: touch.pageX - offset.x,
                                        y: touch.pageY - offset.y};
        });
        event.preventDefault();
    }

    function touchmove(event) {
        report('touchmove' + show(event.touches));
        forEach(event.touches, function (touch, i) {
            var point = {x: touch.pageX - offset.x,
                         y: touch.pageY - offset.y};
            drawLine(points[touch.identifier], point, colors[i]);
            points[touch.identifier] = point;
        });
        event.preventDefault();
    }

    function drawLine(start, end, color) {
        report(' ' + start.x + ',' + start.y + ' -> ' + end.x + ',' + end.y + ' / ' + color);
        var sx = start.x - ox;
        var sy = start.y - oy;
        var ex = end.x - ox;
        var ey = end.y - oy;
        ctx.strokeStyle = color;
        ctx.beginPath();

        segment( sx,  sy,  ex,  ey);
        segment( sx, -sy,  ex, -ey);
        segment(-sx, -sy, -ex, -ey);
        segment(-sx,  sy, -ex,  ey);

        segment( sy,  sx,  ey,  ex);
        segment( sy, -sx,  ey, -ex);
        segment(-sy, -sx, -ey, -ex);
        segment(-sy,  sx, -ey,  ex);

        ctx.stroke();
    }

    function segment(sx, sy, ex, ey) {
        ctx.moveTo(ox+sx, oy+sy); ctx.lineTo(ox+ex, oy+ey);
    }

    function touchend(event) {
        report('touchend' + show(event.touches));
        if (false) {
            forEach(event.touches, function (touch) {
                delete points[touch.identifier];
            });
        }
        event.preventDefault();
    }

    function show(touches) {
        var msg = '';
        forEach(touches, function (touch, i) {
            var point = {x: touch.pageX - offset.x,
                         y: touch.pageY - offset.y};
            msg += ' ' + touch.identifier + ': ' + point.x + ',' + point.y;
        });
        return msg;
    }

    canvas.addEventListener('touchstart', loudly(report, touchstart), false);
    canvas.addEventListener('touchmove', loudly(report, touchmove), false);    
    canvas.addEventListener('touchend', loudly(report, touchend), false);    
    report('Starting');
}

function forEach(xs, f) {
    for (var i = 0; i < xs.length; ++i)
        f(xs[i], i);
}

function loudly(report, f) {
    return function() {
        try {
            return f.apply(this, arguments);
        } catch (e) {
            report('Oops (' + functionName(f) + '): ' + e);
            throw e;
        }
    }
}

function functionName(f) {
    // XXX hack
    return ('' + f).substring('function '.length, 'function touchstart'.length);
}

var canvas = document.getElementById('canvas');
var debug = document.getElementById('debug');
function report(html) {
    if (false) debug.innerHTML += '<br>' + html;
}

fingerpaint(canvas, report);
