var GameManager = pc.createScript('gameManager');

GameManager.attributes.add('mapSize', { type: 'number', default: 200 });
GameManager.attributes.add('zoneShrinkInterval', { type: 'number', default: 30 });
GameManager.attributes.add('zoneShrinkStages', { type: 'number', default: 5 });
GameManager.attributes.add('playerCount', { type: 'number', default: 20 });
GameManager.attributes.add('botCount', { type: 'number', default: 19 });
GameManager.attributes.add('lootSpawnCount', { type: 'number', default: 50 });

GameManager.prototype.initialize = function() {
    this.state = 'lobby';
    this.players = [];
    this.bots = [];
    this.lootItems = [];
    this.aliveCount = 0;
    this.matchTime = 0;
    this.currentStage = 0;
    this.kills = {};
    this.started = false;

    this.app.on('player:damage', this.onPlayerDamage, this);
    this.app.on('player:death', this.onPlayerDeath, this);
    this.app.on('player:kill', this.onPlayerKill, this);
    this.app.on('loot:pickup', this.onLootPickup, this);
    this.app.on('game:start', this.startMatch, this);
};

GameManager.prototype.startMatch = function() {
    if (this.started) return;
    this.started = true;
    this.state = 'playing';
    this.matchTime = 0;
    this.currentStage = 0;
    this.aliveCount = this.botCount + 1;

    this.spawnPlayers();
    this.spawnLoot();

    this.app.fire('game:started', {
        mapSize: this.mapSize,
        playerCount: this.aliveCount
    });

    this.app.fire('zone:setStage', {
        stage: 0,
        mapSize: this.mapSize,
        interval: this.zoneShrinkInterval
    });
};

GameManager.prototype.spawnPlayers = function() {
    var half = this.mapSize / 2;
    for (var i = 0; i < this.botCount; i++) {
        var pos = new pc.Vec3(
            pc.math.random(-half, half),
            0,
            pc.math.random(-half, half)
        );
        this.app.fire('bot:spawn', { index: i, position: pos });
    }
};

GameManager.prototype.spawnLoot = function() {
    var half = this.mapSize / 2;
    var types = ['health', 'armor', 'rifle', 'shotgun', 'ammo'];
    for (var i = 0; i < this.lootSpawnCount; i++) {
        this.app.fire('loot:spawn', {
            position: new pc.Vec3(
                pc.math.random(-half, half),
                0.5,
                pc.math.random(-half, half)
            ),
            type: types[Math.floor(Math.random() * types.length)]
        });
    }
};

GameManager.prototype.update = function(dt) {
    if (this.state !== 'playing') return;
    this.matchTime += dt;

    var stageDuration = this.zoneShrinkInterval;
    var elapsed = this.matchTime;
    var newStage = Math.min(
        Math.floor(elapsed / stageDuration),
        this.zoneShrinkStages
    );

    if (newStage !== this.currentStage) {
        this.currentStage = newStage;
        var zoneSize = this.mapSize * (1 - (newStage / this.zoneShrinkStages) * 0.85);

        this.app.fire('zone:setStage', {
            stage: newStage,
            zoneSize: Math.max(zoneSize, 10),
            mapSize: this.mapSize,
            damagePerSec: (newStage + 1) * 5
        });
    }

    this.checkWinCondition();
};

GameManager.prototype.checkWinCondition = function() {
    if (this.aliveCount <= 1 && this.matchTime > 5) {
        this.state = 'ended';
        this.app.fire('game:ended', {
            winner: this.getLastAlive(),
            kills: this.kills
        });
    }
};

GameManager.prototype.getLastAlive = function() {
    return 'Player';
};

GameManager.prototype.onPlayerDamage = function(data) {
    if (data.health <= 0) {
        this.app.fire('player:death', data);
    }
};

GameManager.prototype.onPlayerDeath = function(data) {
    this.aliveCount = Math.max(0, this.aliveCount - 1);
    this.app.fire('hud:updateAlive', { alive: this.aliveCount });
};

GameManager.prototype.onPlayerKill = function(data) {
    if (!this.kills[data.killer]) this.kills[data.killer] = 0;
    this.kills[data.killer]++;
    this.app.fire('hud:killFeed', data);
};

GameManager.prototype.onLootPickup = function(data) {
    this.app.fire('hud:message', { text: 'Picked up ' + data.type });
};

GameManager.prototype.swap = function(old) {
    this.state = old.state;
    this.players = old.players;
    this.bots = old.bots;
    this.aliveCount = old.aliveCount;
    this.matchTime = old.matchTime;
    this.currentStage = old.currentStage;
    this.kills = old.kills;
};
