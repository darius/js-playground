function itemgetter(key) {
    return function (object) { return object[key]; };
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
