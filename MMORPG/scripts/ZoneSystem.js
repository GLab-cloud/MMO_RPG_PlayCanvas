var ZoneSystem = pc.createScript('zoneSystem');

ZoneSystem.attributes.add('ringThickness', { type: 'number', default: 5 });
ZoneSystem.attributes.add('hazardColor', { type: 'rgba', default: [1, 0, 0, 0.3] });

ZoneSystem.prototype.initialize = function() {
    this.mapSize = 200;
    this.currentRadius = 100;
    this.targetRadius = 100;
    this.center = new pc.Vec3(0, 0, 0);
    this.damagePerSec = 0;
    this.stage = 0;
    this.warningTime = 0;
    this.isShrinking = false;
    this.shrinkSpeed = 5;

    this.app.on('zone:setStage', this.onSetStage, this);
};

ZoneSystem.prototype.onSetStage = function(data) {
    this.stage = data.stage;
    this.mapSize = data.mapSize || this.mapSize;

    var half = this.mapSize / 2;

    if (data.stage === 0) {
        this.center.set(0, 0, 0);
        this.currentRadius = half;
        this.targetRadius = half;
        this.damagePerSec = 0;
        return;
    }

    this.center.set(
        pc.math.random(-half * 0.3, half * 0.3),
        0,
        pc.math.random(-half * 0.3, half * 0.3)
    );

    this.targetRadius = Math.max(data.zoneSize || (half * (1 - (data.stage / 5) * 0.85)), 5);
    this.damagePerSec = data.damagePerSec || this.stage * 5;
    this.isShrinking = true;
    this.warningTime = 3;
};

ZoneSystem.prototype.update = function(dt) {
    if (this.isShrinking) {
        if (this.warningTime > 0) {
            this.warningTime -= dt;
            this.app.fire('hud:zoneWarning', {
                active: true,
                timeUntilShrink: this.warningTime
            });
            return;
        }

        this.app.fire('hud:zoneWarning', { active: false });

        var diff = this.currentRadius - this.targetRadius;
        if (Math.abs(diff) > 0.5) {
            this.currentRadius -= Math.sign(diff) * this.shrinkSpeed * dt;
        } else {
            this.currentRadius = this.targetRadius;
            this.isShrinking = false;
        }

        this.app.fire('hud:zoneUpdate', {
            center: this.center,
            radius: this.currentRadius,
            targetRadius: this.targetRadius
        });
    }

    this.applyZoneDamage(dt);
};

ZoneSystem.prototype.applyZoneDamage = function(dt) {
    if (this.damagePerSec <= 0) return;

    var players = this.app.root.findByTag('player');
    for (var i = 0; i < players.length; i++) {
        var pos = players[i].getPosition();
        var dist = pos.distance(this.center);

        if (dist > this.currentRadius) {
            var controller = players[i].script.playerController;
            if (controller && !controller.isDead) {
                controller.takeDamage(this.damagePerSec * dt, null);
            }
        }
    }
};

ZoneSystem.prototype.isPositionInZone = function(position) {
    return position.distance(this.center) <= this.currentRadius;
};

ZoneSystem.prototype.getClosestSafePoint = function(position) {
    var dir = position.clone().sub(this.center);
    dir.normalize();
    return this.center.clone().add(dir.clone().scale(this.currentRadius - 2));
};
