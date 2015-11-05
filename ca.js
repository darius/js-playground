// TODO:
// - extract into a .js file
// X transpose color mapping table, like setColors([])
// X support named colors
//   - add the full standard set, whatever that is
//   - let setColors take a string instead of an array
// X init by picture strings
// X keyboard shortcut for run button
// X margolus neighborhood
//   - a bug in the edge update?
//     (a smooth glider trail acquired a kink when the
//     rule was switched to tmgas)
// X von neumann neighborhood
// - more portability across browsers
// - multiple textareas
// - keybindings for each
// - react to mouse
// - fat bits
// - change grid size
// X single step
//   - problem on Firefox: holding ctrl-Y down with a step() command
//     doesn't update the canvas until key-up
// X set desired frame rate
// - separate pages for separate experiments
// - take textual notes
// - a wiki or something
// - try various experiments using this system
// - CAM-B or equivalent
// - write circles and squares into the grid
// - bitwise operations on grids
// - documentation
// - use coffeescript
// - nicer API, less clumsy for quick hacks
// - better editor for the textareas
// - try a non-tabular rule implementation
// - clean up the code more
// - selectable boundary conditions
// - keyboard shortcut to run just the current line?
// - log() function with a pane for it to write to
// - more useful error messages
// - why does it take a second sometimes after I hit ctrl-Y or Run?
//   Is it that Math.random() is slow?
// - interface support for reproducible experiments -- a 'notebook'
//   - able to boil it down after initial playing around
//   - I guess a combo of a REPL with a function pane like the 
//     current 'Run' textarea.
// - make it faster
// - time travel
// - frames/sec averaged over a time interval rather than #frames interval
// - check out Golly for ideas
// - ditto for Rudy Rucker's work, etc.
// ...

// "In the end, it seems I have only Ctrl + Y, Ctrl + K, Ctrl + M for
// the letters; Ctrl + Enter, Shift + Space, Ctrl + Space; Ctrl
// + <some punctuation marks>.
// http://forums.adobe.com/message/3413706


// The grid

var width     = parseInt(canvas.getAttribute("width"));
var height    = parseInt(canvas.getAttribute("height"));

// The bounds are extended by 1 in each direction to avoid special-casing
// the update rule at the edges.
var physheight = height+2;
var physwidth  = width+2;
var physsize   = physheight * physwidth;

var N  = -physwidth;
var W  = -1;
var E  =  1;
var S  =  physwidth;

var NW = N + W;
var NE = N + E;
var SW = S + W;
var SE = S + E;

function newUint8Array(length) {
    return new Uint8Array(new ArrayBuffer(length));
}

var grid     = newUint8Array(physsize);
var nextgrid = newUint8Array(physsize);

function setCell(x, y, cell) {
    grid[E + S * y + x] = cell;
}

function clearGrid() {
    for (var i = 0; i < physsize; ++i)
        grid[i] = 0;
}

function randomGrid(fraction) {
    for (var i = 0; i < physsize; ++i)
        grid[i] = Math.random() < fraction ? 1 : 0;
    refreshBoundary();
}

function setGridFromPic(x, y, string) {
    var x0 = x;
    for (var i = 0; i < string.length; ++i) {
        switch (string[i]) {
        case " ":
            setCell(x, y, 0);
            x = (x + 1) % width;
            break;
        case "*":
            setCell(x, y, 1);
            x = (x + 1) % width;
            break;
        case ".":
            x = x0;
            y = (y + 1) % height;
            break;
        default:
            alert("XXX bad string in setGridFromPic");
        }
    }
}


// Grid update

var updater = function(nextgrid, grid) { };

function updateGrid() {
    refreshBoundary();
    updater(nextgrid, grid);
    for (var i = 0; i < physsize; ++i)
        grid[i] = nextgrid[i];
}

// Copy the wrapped-around edge values to the boundary cells to 
// implement periodic boundary conditions (i.e. cells at the top
// are logically adjacent to cells at the bottom, etc.).
function refreshBoundary() {
    for (var x = 1; x <= width; ++x) {
        grid[S*0          + x] = grid[S*height + x];
        grid[S*(1+height) + x] = grid[S*1      + x];
    }
    for (var y = 1; y <= height; ++y) {
        grid[S*y + 0]         = grid[S*y + E + width-1];
        grid[S*y + E + width] = grid[S*y + E];
    }
    grid[S*0          + 0]         = grid[S*height + width];
    grid[S*0          + E + width] = grid[S*height + E];
    grid[S*(1+height) + 0]         = grid[S*1      + width];
    grid[S*(1+height) + E + width] = grid[S*1      + E];
    // TESTME: does this get the corners correct?
}


// The von Neumann neighborhood

var vonNeumannRule = newUint8Array(1 << 10);

function setVonNeumannRule(rule) {
    for (var neighborhood = 0; neighborhood < (1 << 10); ++neighborhood) {
        var center = 3 & (neighborhood >> 8);
        var n      = 3 & (neighborhood >> 6);
        var w      = 3 & (neighborhood >> 4);
        var e      = 3 & (neighborhood >> 2);
        var s      = 3 & (neighborhood >> 0);
        vonNeumannRule[neighborhood] = 3 & rule(     n,
                                                w, center, e,
                                                     s);
    }
    updater = vonNeumannUpdate;
}

function vonNeumannUpdate(dest, src) {
    var p = SE;
    for (var r = 0; r < height; ++r) {
        for (var c = 0; c < width; ++c) {
            // XXX these masks aren't really needed
            var neighborhood = (  ((3 & src[     p]) << 8)
                                + ((3 & src[N  + p]) << 6)
                                + ((3 & src[W  + p]) << 4)
                                + ((3 & src[E  + p]) << 2)
                                + ((3 & src[S  + p])));
            dest[p++] = vonNeumannRule[neighborhood];
        }
        p += 2;
    }
}


// The Moore neighborhood

var mooreRule = newUint8Array(1 << 10);

function setMooreRule(rule) {
    for (var neighborhood = 0; neighborhood < (1 << 10); ++neighborhood) {
        var center1 = 1 & (neighborhood >> 9);
        var center  = 1 & (neighborhood >> 8);
        var nw      = 1 & (neighborhood >> 7);
        var n       = 1 & (neighborhood >> 6);
        var ne      = 1 & (neighborhood >> 5);
        var w       = 1 & (neighborhood >> 4);
        var e       = 1 & (neighborhood >> 3);
        var sw      = 1 & (neighborhood >> 2);
        var s       = 1 & (neighborhood >> 1);
        var se      = 1 & (neighborhood >> 0);
        mooreRule[neighborhood] = 3 & rule(nw, n, ne,
                                           w, center, e,
                                           sw, s, se,
                                           center1);
    }
    updater = mooreUpdate;
}

function mooreUpdate(dest, src) {
    var p = SE;
    for (var r = 0; r < height; ++r) {
        for (var c = 0; c < width; ++c) {
            var neighborhood = ( ((3 & src[     p]) << 8)
                               + ((1 & src[NW + p]) << 7)
                               + ((1 & src[N  + p]) << 6)
                               + ((1 & src[NE + p]) << 5)
                               + ((1 & src[W  + p]) << 4)
                               + ((1 & src[E  + p]) << 3)
                               + ((1 & src[SW + p]) << 2)
                               + ((1 & src[S  + p]) << 1)
                               + ((1 & src[SE + p])));
            dest[p++] = mooreRule[neighborhood];
        }
        p += 2;
    }
}


// The Margolus neighborhood

var margolusRule = newUint8Array(1 << 9);

function makeMargolusBlock(center, cw, ccw, opp) {
    return (  (center << 6)
            + (cw     << 4)
            + (ccw    << 2)
            + (opp));
}

function setMargolusRule(rule) {
    for (var neighborhood = 0; neighborhood < (1 << 9); ++neighborhood) {
        var phase  = 1 & (neighborhood >> 8);
        var center = 3 & (neighborhood >> 6);
        var cw     = 3 & (neighborhood >> 4);
        var ccw    = 3 & (neighborhood >> 2);
        var opp    = 3 & (neighborhood >> 0);
        margolusRule[neighborhood] = rule(center, cw, ccw, opp, phase);
    }
    updater = margolusUpdate;
}

function margolusUpdate(dest, src) {
    // NB requires width and height to be even
    var phase = nframes & 1;
    var phasebit = phase << 8;
    var p = SE + phase * SE;
    for (var r = phase; r < height; r += 2) {
        for (var c = phase; c < width; c += 2) {
            var neighborhood = (phasebit
                                + ((src[     p]) << 6)
                                + ((src[E  + p]) << 4)
                                + ((src[S  + p]) << 2)
                                + ((src[SE + p])));
            var block = margolusRule[neighborhood];
            dest[     p] = 3 & (block >> 6);
            dest[E  + p] = 3 & (block >> 4);
            dest[S  + p] = 3 & (block >> 2);
            dest[SE + p] = 3 & (block);
            p += 2;
        }
        p += 2 + S;
    }
    if (phase === 1) {
        for (var x = 1; x <= width; ++x)
            grid[S + x] = grid[S*(height+1) + x];
        for (var y = 1; y <= height; ++y)
            grid[E + S*y] = grid[E + S*y + width];
    }
}


// Grid-cell value to color mapping

var R = [0, 0, 0, 0];
var G = [0, 0, 0, 0];
var B = [0, 0, 0, 0];
var RGB = new Int32Array(4);

var namedColors = {
    "black":   0x000000,
    "blue":    0x0000FF,
    "brown":   0xA52A2A,
    "cyan":    0x00FFFF,
    "gray":    0x808080,
    "green":   0x008000,
    "magenta": 0xFF00FF,
    "orange":  0xFFA500,
    "pink":    0xFFC0CB,
    "purple":  0x800080,
    "red":     0xFF0000,
    "teal":    0x008080,
    "white":   0xFFFFFF,
    "yellow":  0xFFFF00,
};

function setColors(array) {
    // TODO error checking
    for (var cell = 0; cell < 4; ++cell) {
        var color = array[cell];
        if (namedColors.hasOwnProperty(color))
            color = namedColors[color];
        R[cell] = 0xFF & (color >> 16);
        G[cell] = 0xFF & (color >>  8);
        B[cell] = 0xFF & (color >>  0);
        RGB[cell] = ((0xFF << 24) | color);
//                     | (B[cell] << 16)
//                     | (G[cell] << 16)
//                     | (R[cell] << 16));
    }
}

setColors(["black", "red", "green", "blue"]);


// The canvas

var ctx       = canvas.getContext("2d");
var imageData = ctx.createImageData(width, height);
var pixels    = new Int32Array(imageData.data.buffer);

function blitCanvas() {
//    var data = imageData.data;
    var src = SE; // Skip the cells past the border on top and left
    var dest = 0;
    for (var r = 0; r < height; ++r) {
        for (var c = 0; c < width; ++c) {
            var cell = grid[src++];
            pixels[dest++] = RGB[cell];
//            data[dest++] = R[cell];
//            data[dest++] = G[cell];
//            data[dest++] = B[cell];
//            data[dest++] = 0xFF;
        }
        src += 2; // Skip the cells past the border on right and left
    }
    ctx.putImageData(imageData, 0, 0);
}
