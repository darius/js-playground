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
