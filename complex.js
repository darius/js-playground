'use strict';

function squaredMagnitude(v) {
    return v.re*v.re + v.im*v.im;
}

function add(u, v) {
    return {re: u.re + v.re,
            im: u.im + v.im};
}

function sub(u, v) {
    return add(u, rmul(-1, v));
}

function mul(u, v) {
    return {re: u.re * v.re - u.im * v.im,
            im: u.im * v.re + u.re * v.im};
}

function div(u, v) {
    return mul(u, reciprocal(v));
}

function reciprocal(v) {
    var vv = v.re*v.re + v.im*v.im;
    return rmul(1/vv, conjugate(v));
}

function conjugate(v) {
    return {re: v.re,
            im: -v.im};
}

function rmul(r, v) {
    return {re: r * v.re,
            im: r * v.im};
}
