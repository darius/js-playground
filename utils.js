function itemgetter(property) {
    return function (object) { return object[property]; };
}

// N.B. The table is a built-in Javascript object, so key lookup 
// only really works for primitives as arguments.
function memoize(f) {
    var memos = {}; // XXX make this a Dictionary for safety
    return function (x) {
        if (!(x in memos))
            memos[x] = f(x);
        return memos[x];
    };
}

function maximum(xs, key) {
    var best = null;
    for (var i = 0; i < xs.length; ++i)
        if (!best || key(best) < key(xs[i]))
            best = xs[i];
    return best;
}

function reverseString(string) { // XXX rewrite
    return string.split('').reverse().join('');
}

function multidictGet(dict, keys) {
    for (var i = 0; i < keys.length; ++i)
        if (keys[i] in dict)
            dict = dict[keys[i]];
        else
            return undefined;
    return dict;
}

function multidictSet(dict, keys, val) {
    for (var i = 0; i < keys.length-1; ++i)
        if (keys[i] in dict)
            dict = dict[keys[i]];
        else
            dict = dict[keys[i]] = {};
    dict[keys[keys.length-1]] = val;
}

// From http://javascript.crockford.com/remedial.html
function typeOf(value) {
    var t = typeof value;
    if (t === 'object')
        if (value) {
            if (value instanceof Array)
                return 'array';
        } else
            return 'null';
    return t;
}

function map(f, array) {
    var result = [];
    for (var i = 0; i < array.length; ++i)
        result.push(f(array[i]));
    return result;
}
