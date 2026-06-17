var HUD = pc.createScript('hud');

HUD.prototype.initialize = function() {
    this.health = 100;
    this.maxHealth = 100;
    this.armor = 0;
    this.maxArmor = 100;
    this.alive = 1;
    this.kills = 0;
    this.currentWeapon = 'pistol';
    this.ammo = Infinity;
    this.zoneRadius = 0;
    this.zoneTargetRadius = 0;
    this.isDead = false;
    this.killFeedItems = [];
    this.messages = [];

    this.setupUI();

    this.app.on('hud:healthUpdate', function(data) {
        this.health = data.health;
        this.maxHealth = data.maxHealth;
        this.updateHealthBar();
    }, this);

    this.app.on('hud:armorUpdate', function(data) {
        this.armor = data.armor;
        this.maxArmor = data.maxArmor;
        this.updateArmorBar();
    }, this);

    this.app.on('hud:updateAlive', function(data) {
        this.alive = data.alive;
        this.updateAliveCount();
    }, this);

    this.app.on('hud:ammoUpdate', function(data) {
        this.ammo = data.ammo;
        this.updateAmmo();
    }, this);

    this.app.on('hud:weaponSwitch', function(data) {
        this.currentWeapon = data.weapon;
        this.updateWeaponDisplay();
    }, this);

    this.app.on('hud:killFeed', function(data) {
        this.addKillFeed(data);
    }, this);

    this.app.on('hud:zoneUpdate', function(data) {
        this.zoneRadius = data.radius;
        this.zoneTargetRadius = data.targetRadius;
        this.updateZoneInfo();
    }, this);

    this.app.on('hud:zoneWarning', function(data) {
        this.showZoneWarning(data);
    }, this);

    this.app.on('hud:message', function(data) {
        this.showMessage(data.text);
    }, this);

    this.app.on('hud:showDeathScreen', function(data) {
        this.showDeathScreen(data);
    }, this);

    this.app.on('hud:hideDeathScreen', function() {
        this.hideDeathScreen();
    }, this);

    this.app.on('game:started', function(data) {
        this.alive = data.playerCount;
        this.updateAliveCount();
    }, this);

    this.app.on('game:ended', function(data) {
        this.showGameEnded(data);
    }, this);

    if (this.app.mouse) {
        this.app.mouse.disableContextMenu();
        this.app.mouse.enablePointerLock();
    }
};

HUD.prototype.setupUI = function() {
    this.entity.addComponent('screen', {
        screenSpace: true,
        resolution: new pc.Vec2(1920, 1080)
    });

    this.healthBar = this.createBar('healthBar', 20, 40, 200, 20, '#e74c3c');
    this.armorBar = this.createBar('armorBar', 20, 65, 200, 16, '#3498db');
    this.healthLabel = this.createText('healthLabel', 'HP: 100/100', 20, 35, '#fff');
    this.armorLabel = this.createText('armorLabel', 'Armor: 0', 20, 62, '#fff');

    this.crosshair = this.createText('crosshair', '+', 960, 550, '#fff', 32, 'center');

    this.killCounter = this.createText('killCounter', 'Kills: 0', 1780, 30, '#f39c12', 18, 'right');
    this.aliveCounter = this.createText('aliveCounter', 'Alive: 1', 1780, 52, '#fff', 16, 'right');

    this.weaponDisplay = this.createText('weaponDisplay', 'Pistol', 960, 1020, '#fff', 16, 'center');
    this.ammoDisplay = this.createText('ammoDisplay', 'INF', 960, 1038, '#ddd', 14, 'center');

    this.zoneInfo = this.createText('zoneInfo', 'Zone: 100m', 960, 60, '#2ecc71', 16, 'center');
    this.zoneWarningText = this.createText('zoneWarning', '', 960, 200, '#e74c3c', 24, 'center');

    this.killFeedContainer = { y: 100, items: [] };

    this.deathScreen = this.createText('deathScreen', '', 960, 480, '#e74c3c', 36, 'center');
    this.deathScreenSub = this.createText('deathScreenSub', 'Press R to respawn', 960, 520, '#fff', 18, 'center');

    this.messageText = this.createText('messageText', '', 960, 150, '#f1c40f', 16, 'center');
    this.messageTimer = 0;

    this.gameEndedText = this.createText('gameEnded', '', 960, 400, '#f1c40f', 48, 'center');
    this.gameEndedSub = this.createText('gameEndedSub', '', 960, 450, '#fff', 24, 'center');

    this.deathScreen.element.opacity = 0;
    this.deathScreenSub.element.opacity = 0;
    this.gameEndedText.element.opacity = 0;
    this.gameEndedSub.element.opacity = 0;
    this.zoneWarningText.element.opacity = 0;
    this.messageText.element.opacity = 0;
};

HUD.prototype.createBar = function(name, x, y, w, h, color) {
    var entity = new pc.Entity(name);
    this.entity.addChild(entity);
    entity.addComponent('element', {
        type: pc.ELEMENTTYPE_IMAGE,
        anchor: [0, 1, 0, 1],
        pivot: [0, 1],
        width: w,
        height: h,
        color: new pc.Color(0.2, 0.2, 0.2, 0.8),
        useInput: false
    });
    entity.setLocalPosition(x, -y, 0);
    return entity;
};

HUD.prototype.createText = function(name, text, x, y, color, size, align) {
    var entity = new pc.Entity(name);
    this.entity.addChild(entity);
    entity.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        anchor: align === 'center' ? [0.5, 0.5, 0.5, 0.5] : (align === 'right' ? [1, 0, 1, 0] : [0, 1, 0, 1]),
        pivot: align === 'center' ? [0.5, 0.5] : (align === 'right' ? [1, 1] : [0, 1]),
        fontSize: size || 16,
        text: text,
        color: new pc.Color(color || '#fff'),
        autoWidth: true,
        autoHeight: true
    });
    var px = align === 'center' ? 0 : (align === 'right' ? -x : x);
    var py = align === 'center' ? (540 - y / 2) : -y;
    entity.setLocalPosition(px, py, 0);
    return entity;
};

HUD.prototype.updateHealthBar = function() {
    var pct = this.health / this.maxHealth;
    if (this.healthBar && this.healthBar.element) {
        this.healthBar.element.width = 200 * pct;
        this.healthBar.element.color = new pc.Color(
            1 - pct + 0.2,
            pct,
            0.2,
            0.9
        );
    }
    this.healthLabel.element.text = 'HP: ' + Math.ceil(this.health) + '/' + this.maxHealth;
};

HUD.prototype.updateArmorBar = function() {
    var pct = this.armor / this.maxArmor;
    if (this.armorBar && this.armorBar.element) {
        this.armorBar.element.width = 200 * pct;
    }
    this.armorLabel.element.text = 'Armor: ' + Math.ceil(this.armor);
};

HUD.prototype.updateAliveCount = function() {
    this.aliveCounter.element.text = 'Alive: ' + this.alive;
};

HUD.prototype.updateAmmo = function() {
    var ammoText = this.ammo === Infinity ? 'INF' : this.ammo;
    this.ammoDisplay.element.text = '' + ammoText;
};

HUD.prototype.updateWeaponDisplay = function() {
    var name = this.currentWeapon.charAt(0).toUpperCase() + this.currentWeapon.slice(1);
    this.weaponDisplay.element.text = name;
};

HUD.prototype.updateZoneInfo = function() {
    var radius = Math.ceil(this.zoneRadius);
    this.zoneInfo.element.text = 'Zone: ' + radius + 'm';
};

HUD.prototype.showZoneWarning = function(data) {
    if (data.active) {
        this.zoneWarningText.element.text = 'Zone shrinking in ' + Math.ceil(data.timeUntilShrink) + 's';
        this.zoneWarningText.element.opacity = 0.8 + Math.sin(Date.now() * 0.01) * 0.2;
    } else {
        this.zoneWarningText.element.opacity = 0;
    }
};

HUD.prototype.addKillFeed = function(data) {
    this.killFeedItems.unshift(data.killer + ' eliminated ' + data.victim);
    if (this.killFeedItems.length > 5) this.killFeedItems.pop();
    this.killCounter.element.text = 'Kills: ' + (this.kills++);
};

HUD.prototype.showDeathScreen = function(data) {
    this.deathScreen.element.text = 'ELIMINATED';
    this.deathScreenSub.element.text = 'Killed by ' + data.killerName;
    this.deathScreen.element.opacity = 1;
    this.deathScreenSub.element.opacity = 1;
    this.isDead = true;
    this.crosshair.element.opacity = 0;
};

HUD.prototype.hideDeathScreen = function() {
    this.deathScreen.element.opacity = 0;
    this.deathScreenSub.element.opacity = 0;
    this.isDead = false;
    this.crosshair.element.opacity = 1;
};

HUD.prototype.showMessage = function(text) {
    this.messageText.element.text = text;
    this.messageText.element.opacity = 1;
    this.messageTimer = 3;
};

HUD.prototype.showGameEnded = function(data) {
    this.gameEndedText.element.text = 'VICTORY ROYALE!';
    this.gameEndedSub.element.text = 'Winner: ' + (data.winner || 'Player');
    this.gameEndedText.element.opacity = 1;
    this.gameEndedSub.element.opacity = 1;
};

HUD.prototype.update = function(dt) {
    if (this.messageTimer > 0) {
        this.messageTimer -= dt;
        if (this.messageTimer <= 0) {
            this.messageText.element.opacity = 0;
        }
    }
};
