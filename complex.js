'use strict';

var zero = {re: 0, im: 0};
var one  = {re: 1, im: 0};

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

// An approximate square root of square.
// Not necessarily the principal one. (How to get that?)
function roughSqrt(square) {
    var z = rmul(.5, add(one, square)); // (is this a silly first guess?)
    for (var i = 10; 0 <= i; --i) {
        z = rmul(.5, add(z, div(square, z)));
    }
    return z;
}
