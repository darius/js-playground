// Word segmentation following norvig.com/ngrams

load('utils.js');
load('vocab.js');
/// vocab['the']
//. 23135851162

var NT = 1024908267229;  // Number of tokens

var maxWordLength = (function () {
    var maxlen = 0;
    for (var word in vocab)
        if (maxlen < word.length)
            maxlen = word.length;
    return maxlen;
})();
/// maxWordLength
//. 26

function Pw(word) {
    if (word in vocab)
        return vocab[word] / NT;
    else
        return 10 / (NT * Math.pow(10, word.length));
}
/// [Pw('the'), Pw('xzz')]
//. 0.02257358234074099,9.756970764843732e-15

// Return a list of words such that words.join('') === string, along
// with its probability. We pick the most-probable such list.
var segment = memoize(function (string) {
    function pair(words, P) { words.P = P; return words; }
    if (!string) return pair([], 1);
    var best = pair([], 0);
    var limit = Math.min(string.length, maxWordLength);
    for (var i = 1; i <= limit; ++i) {
        var word = string.slice(0, i);
        var result = segment(string.slice(i));
        var P = Pw(word) * result.P;
        if (best.P < P)
            best = pair([word].concat(result), P);
    }
    return best;
});
/// segment('iwin').P
//. 1.917489125744664e-7
/// segment('iwintheinternetsyayme')
//. i,win,the,internets,yay,me
