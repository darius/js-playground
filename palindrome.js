// Try to extend input into a palindrome.

load('segment.js');

/// complete('a tylenol bud')
//. a tylenol bud dub lonely ta
/// complete('Satan, oscillate my')
//. Satan, oscillate my metallic sonatas
/// complete('star')
//. star rats
/// complete('Zeus spots ti')
//. Zeus spots tit stops suez
/// complete('Hello there')
//. Hello there er eh toll eh
/// complete('A man, a plan, a c')
//. A man, a plan, a canal panama
/// complete('A man, a plan, a')
//. A man, a plan, anal panama

// Return a palindrome having :string as its left half. Try to pick
// the 'best' one.
function complete(string) {
    var candidates = map(segment, listCandidates(string));
    function score(words) {
        // A better result has lower entropy per letter.
        return words.logP / (extractLetters(words.join('')).length || 1);
    }
    var palindrome = maximum(candidates, score);
    return merge(string, palindrome.join(' '));
}

function extractLetters(string) {
    return string.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function listCandidates(string) {
    var letters = extractLetters(string);
    var result = [];
    for (var i = 0; i <= letters.length; ++i) {
        var tail = letters.slice(i);
        if (isPalindrome(tail)) {
            var head = letters.slice(0, i);
            result.push(letters + reverseString(head));
        }
    }
    return result;
}

function isPalindrome(string) {
    return string == reverseString(string);
}

/// merge('A man,', 'aman a plan')
//. A man, a plan

// Return a string that's like :base on the left and :extended on the
// right.
// Pre: extractLetters(extended) starts with extractLetters(base),
//   and :extended contains only letters and spaces.
function merge(base, extended) {
    for (var b = 0, e = 0; b < base.length; ++b)
        if (/[a-z0-9]/i.test(base.charAt(b))) {
            while (extended.charAt(e) === ' ')
                ++e;
            ++e;
        }
    return base + extended.slice(e);
}
