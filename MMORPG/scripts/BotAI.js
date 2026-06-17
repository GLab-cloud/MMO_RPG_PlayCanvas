var BotAI = pc.createScript('botAI');

BotAI.attributes.add('detectionRange', { type: 'number', default: 40 });
BotAI.attributes.add('attackRange', { type: 'number', default: 25 });
BotAI.attributes.add('moveSpeed', { type: 'number', default: 6 });
BotAI.attributes.add('patrolRadius', { type: 'number', default: 30 });

BotAI.prototype.initialize = function() {
    this.state = 'patrol';
    this.health = 100;
    this.maxHealth = 100;
    this.target = null;
    this.patrolPoint = this.getRandomPatrolPoint();
    this.idleTimer = 0;
    this.shootCooldown = 0;
    this.botName = 'Bot ' + Math.floor(Math.random() * 1000);

    this.entity.tags.add('player', 'bot');

    this.app.on('bot:spawn', function(data) {
        if (data.index === this.getBotIndex()) {
            this.entity.setPosition(data.position);
        }
    }, this);
};

BotAI.prototype.getBotIndex = function() {
    var all = this.app.root.findByTag('bot');
    for (var i = 0; i < all.length; i++) {
        if (all[i] === this.entity) return i;
    }
    return -1;
};

BotAI.prototype.update = function(dt) {
    if (this.health <= 0) return;

    this.shootCooldown = Math.max(0, this.shootCooldown - dt);
    this.idleTimer = Math.max(0, this.idleTimer - dt);

    this.detectEnemies();

    switch (this.state) {
        case 'patrol': this.patrol(dt); break;
        case 'chase': this.chase(dt); break;
        case 'attack': this.attack(dt); break;
        case 'flee': this.flee(dt); break;
    }
};

BotAI.prototype.detectEnemies = function() {
    var players = this.app.root.findByTag('player');
    var closest = null;
    var closestDist = this.detectionRange;
    var myPos = this.entity.getPosition();

    for (var i = 0; i < players.length; i++) {
        if (players[i] === this.entity) continue;
        var pos = players[i].getPosition();
        var dist = myPos.distance(pos);
        if (dist < closestDist) {
            closestDist = dist;
            closest = players[i];
        }
    }

    this.target = closest;

    if (this.target && closestDist <= this.attackRange && this.health > 30) {
        this.state = 'attack';
    } else if (this.target && closestDist <= this.detectionRange && this.health > 30) {
        this.state = 'chase';
    } else if (this.health <= 30 && this.target) {
        this.state = 'flee';
    } else if (this.idleTimer <= 0) {
        this.state = 'patrol';
        this.patrolPoint = this.getRandomPatrolPoint();
        this.idleTimer = 5 + Math.random() * 5;
    }
};

BotAI.prototype.patrol = function(dt) {
    if (!this.patrolPoint) return;
    this.moveToward(this.patrolPoint, dt);
    this.lookToward(this.patrolPoint);
};

BotAI.prototype.chase = function(dt) {
    if (!this.target) return;
    var pos = this.target.getPosition();
    this.moveToward(pos, dt);
    this.lookToward(pos);
};

BotAI.prototype.attack = function(dt) {
    if (!this.target) return;
    var pos = this.target.getPosition();
    this.lookToward(pos);

    if (this.shootCooldown <= 0) {
        this.shoot();
        this.shootCooldown = 0.3 + Math.random() * 0.5;
    }

    var dist = this.entity.getPosition().distance(pos);
    if (dist > this.attackRange * 1.5) {
        this.moveToward(pos, dt);
    } else if (dist < this.attackRange * 0.3) {
        var away = this.entity.getPosition().clone().sub(pos);
        away.normalize().scale(10);
        this.moveToward(this.entity.getPosition().clone().add(away), dt);
    }
};

BotAI.prototype.flee = function(dt) {
    if (!this.target) { this.state = 'patrol'; return; }
    var away = this.entity.getPosition().clone().sub(this.target.getPosition());
    away.normalize().scale(30);
    var fleePos = this.entity.getPosition().clone().add(away);
    this.moveToward(fleePos, dt);
    this.lookToward(fleePos);
};

BotAI.prototype.shoot = function() {
    var origin = this.entity.getPosition();
    var dir = this.entity.forward;
    var damage = 10 + Math.random() * 5;

    this.app.fire('bullet:fire', {
        origin: origin,
        direction: dir,
        range: 50,
        damage: damage,
        shooter: this.entity
    });
};

BotAI.prototype.takeDamage = function(amount, attacker) {
    this.health = Math.max(0, this.health - amount);
    this.target = attacker || this.target;

    var pos = this.entity.getPosition();
    this.app.fire('hit:fx', { position: pos });

    if (this.health <= 0) {
        this.die(attacker);
    } else if (this.health <= 30) {
        this.state = 'flee';
    } else if (attacker) {
        this.state = 'chase';
    }
};

BotAI.prototype.die = function(killer) {
    this.entity.enabled = false;

    this.app.fire('player:death', { player: this.entity, killer: killer });
    if (killer) {
        this.app.fire('player:kill', {
            killer: killer.name || killer.script.playerController ? 'Player' : 'Bot',
            victim: this.botName
        });
    }

    var pos = this.entity.getPosition();
    this.app.fire('loot:spawn', {
        position: pos.clone().add(new pc.Vec3(0, 0.5, 0)),
        type: ['health', 'armor', 'ammo'][Math.floor(Math.random() * 3)]
    });
};

BotAI.prototype.moveToward = function(target, dt) {
    var pos = this.entity.getPosition();
    var dir = target.clone().sub(pos);
    dir.y = 0;
    if (dir.length() < 1) return;
    dir.normalize();
    dir.scale(this.moveSpeed * dt);
    this.entity.translate(dir);
};

BotAI.prototype.lookToward = function(target) {
    var pos = this.entity.getPosition();
    var dir = target.clone().sub(pos);
    dir.y = 0;
    if (dir.length() < 0.01) return;
    var angle = Math.atan2(dir.x, dir.z) * (180 / Math.PI);
    this.entity.setLocalEulerAngles(0, angle, 0);
};

BotAI.prototype.getRandomPatrolPoint = function() {
    var spawnPos = this.entity.getPosition();
    return new pc.Vec3(
        spawnPos.x + pc.math.random(-this.patrolRadius, this.patrolRadius),
        0,
        spawnPos.z + pc.math.random(-this.patrolRadius, this.patrolRadius)
    );
};
