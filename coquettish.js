// The simple sample game from https://github.com/maryrosecook/coquette

function start(canvasId, width, height) {
    var game = makeGame(canvasId, width, height, '#000');
    var paramour = makePerson({x: 243, y: 40}, '#099', {
        bump: function(actor) {
            this.pos.y = actor.pos.y;
        }
    });
    var player = makePerson({x: 249, y: 110}, '#f07', {
        tick: function() {
            if (game.isPressed(keycodes.upArrow))
                this.pos.y -= 0.4;
        }
    });
    game.addActor(paramour);
    game.addActor(player);
    game.start();
}

function makePerson(pos, color, options) {
    var extent = {x: 9, y: 9};
    return merge({
        pos: pos,
        paint: function(ctx) {
            ctx.fillStyle = color;
            ctx.fillRect(this.pos.x, this.pos.y, extent.x, extent.y);
        },
        intersects: function(person) {
            return boxesIntersect(this.pos, extent, person.pos, extent);
        }
    }, options);
}
