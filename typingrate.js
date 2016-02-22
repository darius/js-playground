'use strict';

const width  = canvas.width;
const height = canvas.height;

const ctx = canvas.getContext('2d');

const targetCps = 5.0;
const scrollRate = 100;  // pixels/second

let lastTime;
let smoothedRate;

const events = [];

function onKeydown() {
    const now = nowInSeconds();
    smoothedRate = 1 + decaySmoothedRate(now);
    lastTime = now;

    events.push({t: now, wpm: wpmOfCps(smoothedRate)});
}

function decaySmoothedRate(now) {
    return smoothedRate * decay(now - lastTime);
}

function decay(interval) {
    const k = 1 - (1 / targetCps);
    return Math.pow(k, interval * targetCps);
}

function onLoad() {
    ctx.scale(1, -1); // Make y coordinates grow upward.
    ctx.translate(0, -height);
    animating(tick);
    window.addEventListener('keydown', onKeydown, false);

    lastTime = nowInSeconds();
    smoothedRate = targetCps;

    events.push({t: lastTime,
                 wpm: wpmOfCps(targetCps)});
}

function wpmOfCps(cps) {
    return cps / 4 * 60;           // words/minute at 4 chars/word
}

function heightOfWpm(wpm) {
    return wpm / 160 * height;
}

function nowInSeconds() {
    return 1e-3 * Date.now();
}

function tick() {
    const now = nowInSeconds();
    const wpm = wpmOfCps(decaySmoothedRate(now));

    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();

    let p0 = coords(now, events[0]);
    ctx.moveTo(p0.x, p0.y);
    for (let i = 1; i < events.length; ++i) {
        const p = coords(now, events[i]);
        curve(p0, p);
        p0 = p;
    }
    const p = coords(now, {t: now, wpm: wpm});
    curve(p0, p);

    ctx.stroke();
}

function curve(p0, p1) {
    const k = decay(1/scrollRate);
    let x = p0.x;
    let y = p0.y;
    for (let x1 = x+1; x1 < p1.x; ++x1) {
        y *= k;
        ctx.lineTo(x1, y);
    }
    ctx.lineTo(p1.x, p1.y);
}

function coords(now, e) {
    return {x: width-1 - scrollRate * (now - e.t),
            y: heightOfWpm(e.wpm)};
}

/*
TODO:
 * parameterize by averaging-timescale instead of target-rate
 * keep events-to-graph in a cyclic buffer, and drop old entries
 * make a little module reusable for frame-rate averaging and such
 * label keystrokes on the graph
 * add scales to the axes

My old comments on the Emacs Lisp version of this follow.

;; Track the recent typing rate to see whether it exceeds a target rate, using
;; a method vaguely like https://en.wikipedia.org/wiki/Exponential_smoothing

;; Here's the scheme: We keep track of a smoothed rate. Each keystroke
;; increases it by 1; each second that passes multiplies it by a decay
;; factor less than 1. To deal with noninteger time intervals, the
;; decaying actually happens smoothly as an exponential in time.

;; This method has the disadvantage that the estimated rate just after
;; a keystroke is always >=1, which is 60/5 = 12wpm. The lower the
;; target rate, the more this bias matters. (I guess we could address
;; this by doing the same kind of computation in a different time
;; unit, such as minutes instead of seconds. Then the bias would be 1
;; keystroke/minute instead of /second. This is equivalent to keeping
;; seconds for our time unit but bumping by a smaller constant than 1
;; on each keystroke. It comes down to how much you want to weight the
;; recent data vs. the older.)

;; So what's the decay factor? If the user types at the target rate r,
;; then in an interval of 1/r the decay k should be such that k r + 1 = r.
;; So k = 1/(1-r).

;; The decay factor for a whole second is k^r (that is, at a rate of
;; 1/r there'd be r occasions when we'd multiply by k).

;; Thus the decay factor for an arbitrary interval t is (k^r)^t = k^(r t).

*/
