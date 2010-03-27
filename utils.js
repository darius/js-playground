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

function reverseString(string) {
    var a = arrayFromString(string);
    a.reverse();
    return a.join('');
}

function arrayFromString(string) {
    var result = [];
    for (var i = 0; i < string.length; ++i)
        result.push(string.charAt(i));
    return result;
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
