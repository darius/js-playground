// Connect-5 board

const nrows = 6;
const ncols = 7;

// A board is represented as an array of stacks of pieces. A piece is
// an integer 0 or 1 denoting which player's.
function makeBoard() {
    const cols = [];
    for (let i = 0; i < ncols; ++i) cols.push([]);
    return cols;
}
