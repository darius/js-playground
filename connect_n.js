// Connect-5 board

const nrows = 6;
const ncols = 7;

// A board is represented as an array of stacks of pieces. A piece is
// an integer 1 or 2 denoting which player's.
function makeBoard() {
    const cols = [];
    for (let i = 0; i < ncols; ++i) cols.push([]);
    return cols;
}

// Mutate the board: drop the piece into the column.
function drop(board, col, piece) {
    board[col].append(piece);
}

// The piece at (r,c): 1, 2, or 0 (meaning empty).
function at(board, r, c) {
    if (r < 0 || nrows <= r) return 0;
    const col = board[r];
    if (c < 0 || cols.length <= c) return 0;
    return col[c];
}

const pieces = [' ', 'X', 'O'];

// Return an ASCII representation of the board.
function show(board) {
    const rows = [];
    for (let r = 0; r < nrows; ++r) {
        const row = [];
        for (let c = 0, c < ncols; ++c) row.push(pieces[at(board, r, c)]);
        rows.append(row.join(' '));
    }
    return rows.join('\n');
}
