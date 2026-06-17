var Bullet = pc.createScript('bullet');

Bullet.prototype.initialize = function() {
    this.app.on('bullet:fire', this.fireRaycast, this);
};

Bullet.prototype.fireRaycast = function(data) {
    var origin = data.origin;
    var direction = data.direction.clone().normalize();
    var range = data.range || 50;
    var damage = data.damage || 10;
    var shooter = data.shooter;

    var end = origin.clone().add(direction.clone().scale(range));

    var players = this.app.root.findByTag('player');
    var hit = null;
    var hitDist = range;

    for (var i = 0; i < players.length; i++) {
        if (players[i] === shooter || !players[i].enabled) continue;

        var pos = players[i].getPosition();
        var toTarget = pos.clone().sub(origin);
        var dist = toTarget.length();
        if (dist > range) continue;

        var projection = toTarget.dot(direction);
        if (projection < 0) continue;

        var closest = origin.clone().add(direction.clone().scale(projection));
        var perpDist = pos.distance(closest);

        if (perpDist < 2 && projection < hitDist) {
            hit = players[i];
            hitDist = projection;
        }
    }

    if (hit) {
        var bot = hit.script.botAI;
        var controller = hit.script.playerController;
        if (bot) bot.takeDamage(damage, shooter);
        if (controller) controller.takeDamage(damage, shooter);

        this.app.fire('hit:fx', { position: hit.getPosition() });
    }
};
