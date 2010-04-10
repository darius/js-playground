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
        return 10 / (NT * Math.pow(10, word.length));
}
/// [Pw('the'), Pw('xzz')]
//. 0.07237071748562623,9.042948579985785e-9

// Return a list of words such that words.join('') === string, along
// with its log-probability. We pick the most-probable such list.
var segment = memoize(function (string) {
    function pair(words, logP) { words.logP = logP; return words; }
    if (!string) return pair([], 0);
    var best = pair([], -Infinity);
    var limit = Math.min(string.length, maxWordLength);
    for (var i = 1; i <= limit; ++i) {
        var word = string.slice(0, i);
        var result = segment(string.slice(i));
        var logP = Math.log(Pw(word)) + result.logP;
        if (best.logP < logP)
            best = pair([word].concat(result), logP);
    }
    return best;
});
/// segment('iwin').logP
//. -15.247999350135384
/// segment('iwintheinternetsyayme')
//. i,win,the,internet,syayme
