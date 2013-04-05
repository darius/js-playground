// Word segmentation following norvig.com/ngrams

load('utils.js');  
load('count_big.js'); //* skip
/// vocab['the'] / NT
//. 0.07237071748562623
/// maxWordLength
//. 18

function Pw(word) {
    if (word in vocab)
        return vocab[word] / NT;
    else
        return 10 / (NT * Math.pow(1000, word.length));
}
/// [Pw('the'), Pw('xzz')]
//. 0.07237071748562623,9.042948579985784e-15

/// vocab['dub']
//. 1
/// Pw('dub')
//. 9.042948579985784e-7
/// [Pw('dub') * Pw('bud'), Pw('dubbud')]
//. 2.4532475706080075e-12,9.042948579985784e-24

/// segment('buddub')
//. bud,dub
/// Math.exp(segment('buddub').logP)
//. 2.453247570608014e-12

/// Math.exp(segment('ylenolbud').logP)
//. 3.0243218199303276e-29
/// segment('ylenolbud')
//. y,le,no,l,bud

/// Pw('ylenolbud')
//. 9.042948579985785e-33
/// Pw('ylenol')
//. 9.042948579985784e-24
/// Pw('bud')
//. 0.0000027128845739957352
/// Pw('xzz')
//. 9.042948579985784e-15
/// Pw('ylenol')*Pw('bud')
//. 2.4532475706080071e-29

// So how should we set the parameters in Pw()?
// Pw(?^n) = A b^n
//  First cut: A = 10/NT, b = 1/10

// Nonsense words coalesce if A < 1:
// A b^m A b^n = A^2 b^(m+n) < A b^(m+n)

// How about a real word (of length m) plus nonsense:
// Separate if C A b^n > A b^(m+n)
//             C > b^m
// A rare word has C = 1/NT, so 1/NT > b^m
// If we want rare 3-letter words to separate, then 1/NT > b^3
// b < NT^-(1/3)
/// 1/Math.pow(NT, -1/3)
//. 103.41018447647471
/// 1/Math.pow(NT, -1/2)   // For rare 2-letter words, too
//. 1051.5864206046026

// Return a list of words such that words.join('') === string, along
// with its log-probability. We pick the most-probable such list.
function segment(string) {
    function pair(words, logP) { words.logP = logP; return words; }
    var memoSeg = memoize(function (string) {
        if (!string) return pair([], 0);
        var best = pair([], -Infinity);
        var limit = Math.min(string.length, maxWordLength);
        for (var i = 1; i <= limit; ++i) {
            var word = string.slice(0, i);
            var result = memoSeg(string.slice(i));
            var logP = Math.log(Pw(word)) + result.logP;
            if (best.logP < logP)
                best = pair([word].concat(result), logP);
        }
//        console.log('best', string, best);
        return best;
    });
    return memoSeg(string);
}
/// segment('iwin').logP
//. -15.247999350135384
/// segment('iwintheinternetsyayme')
//. i,win,the,internet,s,y,ay,me
