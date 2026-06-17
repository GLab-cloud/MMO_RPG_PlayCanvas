var PlayerController = pc.createScript('playerController');

PlayerController.attributes.add('moveSpeed', { type: 'number', default: 8 });
PlayerController.attributes.add('sprintSpeed', { type: 'number', default: 14 });
PlayerController.attributes.add('jumpForce', { type: 'number', default: 8 });
PlayerController.attributes.add('maxHealth', { type: 'number', default: 100 });
PlayerController.attributes.add('maxArmor', { type: 'number', default: 100 });
PlayerController.attributes.add('pitchLimit', { type: 'number', default: 80 });
PlayerController.attributes.add('camDistance', { type: 'number', default: 5 });
PlayerController.attributes.add('camHeight', { type: 'number', default: 2.5 });

PlayerController.prototype.initialize = function() {
    this.health = this.maxHealth;
    this.armor = 0;
    this.kills = 0;
    this.isDead = false;
    this.weapons = { pistol: { damage: 15, fireRate: 0.3, ammo: Infinity, range: 50 } };
    this.currentWeapon = 'pistol';
    this.lastFireTime = 0;
    this.velocity = new pc.Vec3();
    this.moveDir = new pc.Vec3();
    this.euler = new pc.Vec3();
    this.camPitch = -15;

    this.camera = this.app.root.findByName('Camera');

    this.app.on('player:respawn', this.respawn, this);

    if (this.app.mouse && this.app.keyboard) {
        this.listenForInput();
    } else {
        this.app.once('input:ready', this.listenForInput, this);
    }
};

PlayerController.prototype.listenForInput = function() {
    var self = this;
    if (!this.app.mouse || !this.app.keyboard) return;
    this.app.mouse.on(pc.EVENT_MOUSEMOVE, function(event) {
        if (self.isDead) return;
        self.euler.y -= event.dx * 0.15;
        self.camPitch -= event.dy * 0.15;
        self.camPitch = pc.math.clamp(self.camPitch, -self.pitchLimit, self.pitchLimit);
        self.entity.setLocalEulerAngles(0, self.euler.y, 0);
    }, this);

    this.app.mouse.on(pc.EVENT_MOUSEDOWN, function(event) {
        if (event.button === 0 && !self.isDead) self.shoot();
    }, this);

    this.app.keyboard.on(pc.EVENT_KEYDOWN, function(event) {
        if (event.key === pc.KEY_R && !self.isDead) self.reload();
        if (event.key === pc.KEY_1) self.switchWeapon('pistol');
        if (event.key === pc.KEY_2) self.switchWeapon('rifle');
        if (event.key === pc.KEY_3) self.switchWeapon('shotgun');
    }, this);
};

PlayerController.prototype.update = function(dt) {
    if (this.isDead) return;
    this.handleMovement(dt);
    this.updateCamera();
};

PlayerController.prototype.handleMovement = function(dt) {
    var keyboard = this.app.keyboard;
    if (!keyboard) return;

    if (this.camera) {
        var camForward = this.camera.forward;
        var camRight = this.camera.right;
        camForward.y = 0;
        camRight.y = 0;
        camForward.normalize();
        camRight.normalize();
        this.moveDir.set(0, 0, 0);
        if (keyboard.isPressed(pc.KEY_W)) this.moveDir.add(camForward);
        if (keyboard.isPressed(pc.KEY_S)) this.moveDir.sub(camForward);
        if (keyboard.isPressed(pc.KEY_A)) this.moveDir.sub(camRight);
        if (keyboard.isPressed(pc.KEY_D)) this.moveDir.add(camRight);
    } else {
        var forward = this.entity.forward;
        var right = this.entity.right;
        this.moveDir.set(0, 0, 0);
        if (keyboard.isPressed(pc.KEY_W)) this.moveDir.add(forward);
        if (keyboard.isPressed(pc.KEY_S)) this.moveDir.sub(forward);
        if (keyboard.isPressed(pc.KEY_A)) this.moveDir.sub(right);
        if (keyboard.isPressed(pc.KEY_D)) this.moveDir.add(right);
    }

    var isSprinting = keyboard.isPressed(pc.KEY_SHIFT);
    var speed = isSprinting ? this.sprintSpeed : this.moveSpeed;

    if (this.moveDir.length() > 0) {
        this.moveDir.normalize();
        this.moveDir.scale(speed * dt);
        this.entity.translate(this.moveDir);
    }

    if (keyboard.wasPressed(pc.KEY_SPACE)) {
        var pos = this.entity.getPosition();
        pos.y += this.jumpForce * dt * 5;
        this.entity.setPosition(pos);
    }
};

PlayerController.prototype.updateCamera = function() {
    if (!this.camera) return;

    var playerPos = this.entity.getPosition();
    var q = new pc.Quat();
    q.setFromEulerAngles(this.camPitch, this.euler.y, 0);
    var offset = q.transformVector(new pc.Vec3(0, 0, -this.camDistance));
    offset.y += this.camHeight;

    this.camera.setPosition(playerPos.clone().add(offset));
    this.camera.lookAt(playerPos);
};

PlayerController.prototype.shoot = function() {
    var weapon = this.weapons[this.currentWeapon];
    if (!weapon || weapon.ammo <= 0) return;

    var now = Date.now();
    if (now - this.lastFireTime < weapon.fireRate * 1000) return;
    this.lastFireTime = now;

    if (weapon.ammo !== Infinity) weapon.ammo--;

    var origin = this.entity.getPosition();
    var dir = this.camera ? this.camera.forward : this.entity.forward;
    var end = origin.clone().add(dir.clone().scale(weapon.range));

    this.app.fire('bullet:fire', {
        origin: origin,
        direction: dir,
        range: weapon.range,
        damage: weapon.damage,
        shooter: this.entity
    });

    this.app.fire('hud:ammoUpdate', { weapon: this.currentWeapon, ammo: weapon.ammo });

    this.entity.fire('weapon:fire', { position: origin, direction: dir });
};

PlayerController.prototype.takeDamage = function(amount, attacker) {
    if (this.isDead) return;
    var remaining = amount;
    if (this.armor > 0) {
        var armorAbsorb = Math.min(this.armor, remaining * 0.6);
        this.armor -= armorAbsorb;
        remaining -= armorAbsorb;
    }
    this.health = Math.max(0, this.health - remaining);
    this.app.fire('hud:healthUpdate', { health: this.health, maxHealth: this.maxHealth });
    this.app.fire('hud:armorUpdate', { armor: this.armor, maxArmor: this.maxArmor });
    if (this.health <= 0) this.die(attacker);
};

PlayerController.prototype.die = function(killer) {
    this.isDead = true;
    this.entity.enabled = false;
    this.app.fire('player:death', { player: this.entity, killer: killer });
    if (killer) this.app.fire('player:kill', { killer: killer.name || 'Player', victim: 'Player' });
    this.app.fire('hud:showDeathScreen', { killerName: killer ? killer.name || 'Unknown' : 'Zone' });
};

PlayerController.prototype.respawn = function(data) {
    this.health = this.maxHealth;
    this.armor = 0;
    this.isDead = false;
    this.entity.enabled = true;
    if (data && data.position) this.entity.setPosition(data.position);
    this.app.fire('hud:healthUpdate', { health: this.health, maxHealth: this.maxHealth });
    this.app.fire('hud:armorUpdate', { armor: this.armor, maxArmor: this.maxArmor });
    this.app.fire('hud:hideDeathScreen');
};

PlayerController.prototype.reload = function() {
    var weapon = this.weapons[this.currentWeapon];
    if (weapon && weapon.ammo !== Infinity) {
        weapon.ammo = weapon.maxAmmo || 30;
        this.app.fire('hud:ammoUpdate', { weapon: this.currentWeapon, ammo: weapon.ammo });
    }
};

PlayerController.prototype.switchWeapon = function(weaponName) {
    if (!this.weapons[weaponName]) return;
    this.currentWeapon = weaponName;
    this.app.fire('hud:weaponSwitch', { weapon: weaponName });
    var w = this.weapons[weaponName];
    this.app.fire('hud:ammoUpdate', { weapon: weaponName, ammo: w.ammo });
};

PlayerController.prototype.pickupLoot = function(lootType) {
    switch (lootType) {
        case 'health':
            this.health = Math.min(this.maxHealth, this.health + 50);
            this.app.fire('hud:healthUpdate', { health: this.health, maxHealth: this.maxHealth });
            break;
        case 'armor':
            this.armor = Math.min(this.maxArmor, this.armor + 50);
            this.app.fire('hud:armorUpdate', { armor: this.armor, maxArmor: this.maxArmor });
            break;
        case 'rifle':
            this.weapons.rifle = { damage: 25, fireRate: 0.15, ammo: 30, maxAmmo: 30, range: 100 };
            break;
        case 'shotgun':
            this.weapons.shotgun = { damage: 50, fireRate: 0.8, ammo: 8, maxAmmo: 8, range: 30 };
            break;
        case 'ammo':
            Object.keys(this.weapons).forEach(function(key) {
                var w = this.weapons[key];
                if (w.ammo !== Infinity) w.ammo = Math.min(w.ammo + 10, w.maxAmmo);
            }.bind(this));
            break;
    }
};
