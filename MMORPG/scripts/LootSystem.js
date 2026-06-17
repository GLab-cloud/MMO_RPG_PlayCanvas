var LootSystem = pc.createScript('lootSystem');

LootSystem.attributes.add('pickupRange', { type: 'number', default: 2 });
LootSystem.attributes.add('respawnTime', { type: 'number', default: 15 });

LootSystem.prototype.initialize = function() {
    this.lootEntities = [];
    this.app.on('loot:spawn', this.spawnLoot, this);
};

LootSystem.prototype.getModel = function(key) {
    var refs = this.app.assetRefs;
    if (!refs) return null;
    var asset = refs[key];
    if (asset && asset.resource && asset.resource.instantiate) return asset;
    return null;
};

LootSystem.prototype.spawnLoot = function(data) {
    var visual = this.createLootVisual(data.type, data.position);
    var loot = {
        position: data.position.clone(),
        type: data.type,
        active: true,
        respawnTimer: 0,
        visual: visual
    };
    this.lootEntities.push(loot);
};

LootSystem.prototype.createLootVisual = function(type, position) {
    if (type === 'health') {
        var asset = this.getModel('wall');
        if (asset) {
            var e = asset.resource.instantiate();
            e.setName('Loot_Health');
            e.setLocalPosition(position.x, position.y, position.z);
            e.setLocalScale(0.3, 0.3, 0.3);
            this.app.root.addChild(e);
            return e;
        }
    }

    if (type === 'armor' || type === 'ammo') {
        var asset = this.getModel('weapon');
        if (asset) {
            var e = asset.resource.instantiate();
            e.setName('Loot_' + type);
            e.setLocalPosition(position.x, position.y, position.z);
            e.setLocalScale(0.2, 0.2, 0.2);
            this.app.root.addChild(e);
            return e;
        }
    }

    if (type === 'rifle' || type === 'shotgun') {
        var asset = this.getModel('weapon');
        if (asset) {
            var e = asset.resource.instantiate();
            e.setName('Loot_' + type);
            e.setLocalPosition(position.x, position.y, position.z);
            e.setLocalScale(0.3, 0.3, 0.3);
            this.app.root.addChild(e);
            return e;
        }
    }

    var e = new pc.Entity('Loot_' + type);
    e.setLocalPosition(position.x, position.y, position.z);
    var mat = new pc.StandardMaterial();
    switch (type) {
        case 'health': mat.diffuse = new pc.Color(0.1, 0.8, 0.1); break;
        case 'armor': mat.diffuse = new pc.Color(0.1, 0.3, 0.9); break;
        case 'rifle': mat.diffuse = new pc.Color(0.9, 0.6, 0.1); break;
        case 'shotgun': mat.diffuse = new pc.Color(0.8, 0.2, 0.2); break;
        case 'ammo': mat.diffuse = new pc.Color(0.9, 0.9, 0.2); break;
        default: mat.diffuse = new pc.Color(0.5, 0.5, 0.5); break;
    }
    mat.update();
    var shape = type === 'armor' ? 'cylinder' : (type === 'ammo' ? 'sphere' : 'box');
    e.addComponent('render', { type: shape, material: mat });
    if (shape === 'box') e.setLocalScale(0.5, 0.3, 0.5);
    else if (shape === 'cylinder') e.setLocalScale(0.5, 0.3, 0.5);
    else e.setLocalScale(0.4, 0.4, 0.4);
    this.app.root.addChild(e);
    return e;
};

LootSystem.prototype.update = function(dt) {
    this.handlePickups(dt);
    this.handleRespawns(dt);
    this.animateLoot(dt);
};

LootSystem.prototype.animateLoot = function(dt) {
    for (var i = 0; i < this.lootEntities.length; i++) {
        var loot = this.lootEntities[i];
        if (!loot.active || !loot.visual) continue;
        var pos = loot.visual.getLocalPosition();
        pos.y = loot.position.y + 0.3 + Math.sin(Date.now() * 0.003 + i) * 0.15;
        loot.visual.setLocalPosition(pos);
        loot.visual.rotateLocal(0, 60 * dt, 0);
    }
};

LootSystem.prototype.handlePickups = function(dt) {
    var players = this.app.root.findByTag('player');
    for (var i = 0; i < this.lootEntities.length; i++) {
        var loot = this.lootEntities[i];
        if (!loot.active) continue;
        for (var j = 0; j < players.length; j++) {
            if (!players[j].enabled) continue;
            var pos = players[j].getPosition();
            if (pos.distance(loot.position) < this.pickupRange) {
                var controller = players[j].script.playerController;
                var bot = players[j].script.botAI;
                if (controller) {
                    controller.pickupLoot(loot.type);
                    this.app.fire('loot:pickup', { player: players[j], type: loot.type, position: loot.position });
                    this.deactivateLoot(loot, i);
                } else if (bot && loot.type === 'health' && bot.health < bot.maxHealth) {
                    bot.health = Math.min(bot.maxHealth, bot.health + 50);
                    this.deactivateLoot(loot, i);
                }
                break;
            }
        }
    }
};

LootSystem.prototype.deactivateLoot = function(loot, index) {
    loot.active = false;
    loot.respawnTimer = this.respawnTime;
    if (loot.visual) loot.visual.enabled = false;
};

LootSystem.prototype.handleRespawns = function(dt) {
    for (var i = 0; i < this.lootEntities.length; i++) {
        var loot = this.lootEntities[i];
        if (!loot.active) {
            loot.respawnTimer -= dt;
            if (loot.respawnTimer <= 0) {
                loot.active = true;
                if (loot.visual) {
                    loot.visual.enabled = true;
                    loot.visual.setLocalPosition(loot.position.x, loot.position.y, loot.position.z);
                }
                this.app.fire('hud:message', { text: 'Loot respawned' });
            }
        }
    }
};
