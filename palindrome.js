// Try to extend input into a palindrome.

load('segment.js');

/// complete('zeus spots ti')
//. zeus spots tit stops suez
/// complete('Hello there')
//. Hello there rehtolleh
/// complete('A man, a plan, a c')
//. A man, a plan, a canal panama
/// complete('A man, a plan, a')
//. A man, a plan, anal panama

// Return a palindrome having :string as its left half. Try to pick
// the 'best' one.
function complete(string) {
    var letters = extractLetters(string);
    var reverse = reverseString(letters);
    var candidates = [segment(letters + reverse),
                      segment(letters + reverse.slice(1))];
    var result = maximum(candidates, itemgetter('P'));
    return merge(string, result.join(' '));
}

function extractLetters(string) {
    return string.toLowerCase().replace(/[^a-z]/g, '');
}

/// merge('A man,', 'aman a plan')
//. A man, a plan

// Return a string with the same extractLetters() as :extended,
// but sharing the capitalization & non-letter characters from :base.
// Pre: extractLetters(extended) starts with extractLetters(base),
//   and :extended contains only letters and single spaces.
function merge(base, extended) {
    for (var b = 0, e = 0; b < base.length; ++b)
        if (/[a-z]/i.test(base.charAt(b))) {
            if (extended.charAt(e) === ' ')
                ++e;
            ++e;
        }
    return base + extended.slice(e);
}
