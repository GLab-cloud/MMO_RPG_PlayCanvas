var Bootstrap = pc.createScript('bootstrap');

Bootstrap.attributes.add('mapSize', { type: 'number', default: 200 });
Bootstrap.attributes.add('botCount', { type: 'number', default: 19 });
Bootstrap.attributes.add('buildingCount', { type: 'number', default: 14 });
Bootstrap.attributes.add('obstacleCount', { type: 'number', default: 25 });

Bootstrap.prototype.initialize = function() {
    this.assetRefs = {};
    this.ready = false;

    var self = this;
    var defs = [
        { id: 295194857, key: 'char' },
        { id: 295194858, key: 'weapon' },
        { id: 295194860, key: 'house' },
        { id: 295194859, key: 'trees' },
        { id: 295194865, key: 'wall' }
    ];

    var total = defs.length;
    var count = 0;

    this.safetyTimer = setTimeout(function() {
        if (!self.ready) self.onReady();
    }, 30000);

    defs.forEach(function(def) {
        var asset = self.app.assets.get(def.id);
        if (asset && asset.resource) {
            self.assetRefs[def.key] = asset;
            count++;
            if (count >= total) self.onReady();
        } else if (asset) {
            asset.once('load', function() {
                self.assetRefs[def.key] = asset;
                count++;
                if (count >= total) self.onReady();
            });
            if (!asset.loaded) self.app.assets.load(asset);
            else { count++; if (count >= total) self.onReady(); }
        } else {
            count++;
            if (count >= total) self.onReady();
        }
    });

    if (total === 0) self.onReady();
};

Bootstrap.prototype.instantiate = function(key) {
    var asset = this.assetRefs[key];
    if (asset && asset.resource && asset.resource.instantiate) {
        return asset.resource.instantiate();
    }
    return null;
};

Bootstrap.prototype.onReady = function() {
    if (this.ready) return;
    this.ready = true;
    if (this.safetyTimer) { clearTimeout(this.safetyTimer); this.safetyTimer = null; }
    this.app.assetRefs = this.assetRefs;
    this.createSystemEntities();
    this.buildEnvironment();
    this.createTpsCamera();
    this.createPlayer();
    this.createZoneVisuals();
    this.createBots();

    var self = this;
    setTimeout(function() {
        self.app.fire('input:ready');
        self.app.fire('game:start');
    }, 100);
};

Bootstrap.prototype.createSystemEntities = function() {
    var entities = [
        { name: 'GameManager', script: 'gameManager', attrs: { botCount: this.botCount, mapSize: this.mapSize } },
        { name: 'LootSystem', script: 'lootSystem' },
        { name: 'HUD', script: 'hud' },
        { name: 'BulletRoot', script: 'bullet' },
        { name: 'ZoneSystem', script: 'zoneSystem' }
    ];

    for (var i = 0; i < entities.length; i++) {
        var e = new pc.Entity(entities[i].name);
        e.addComponent('script');
        e.script.create(entities[i].script, entities[i].attrs ? { attributes: entities[i].attrs } : undefined);
        this.app.root.addChild(e);
    }
};

Bootstrap.prototype.buildEnvironment = function() {
    var half = this.mapSize / 2;
    this.createTerrain(half);
    this.createLighting();
    this.createGridMarkers(half);
    this.createBuildings();
    this.createObstacles();
    this.createTrees();
    this.createBorderWalls(half);
};

Bootstrap.prototype.createTerrain = function(half) {
    var groundMat = this.createMat(0.18, 0.28, 0.12);
    var ground = new pc.Entity('Ground');
    ground.addComponent('render', { type: 'plane', material: groundMat });
    ground.setLocalScale(500, 1, 500);
    ground.setLocalPosition(0, -0.5, 0);
    this.app.root.addChild(ground);

    var patchCount = 40;
    for (var i = 0; i < patchCount; i++) {
        var shade = 0.15 + Math.random() * 0.2;
        var patch = new pc.Entity('GroundPatch_' + i);
        patch.addComponent('render', {
            type: 'plane',
            material: this.createMat(shade, shade + 0.1, shade - 0.05)
        });
        var pw = 5 + Math.random() * 15;
        var pd = 5 + Math.random() * 15;
        patch.setLocalScale(pw, 1, pd);
        patch.setLocalPosition(
            pc.math.random(-half + 5, half - 5),
            -0.45,
            pc.math.random(-half + 5, half - 5)
        );
        patch.setLocalEulerAngles(0, Math.random() * 360, 0);
        this.app.root.addChild(patch);
    }
};

Bootstrap.prototype.createLighting = function() {
    var hemi = new pc.Entity('HemisphereLight');
    hemi.addComponent('light', {
        type: 'hemisphere',
        color: new pc.Color(0.5, 0.6, 0.9),
        intensity: 0.5
    });
    this.app.root.addChild(hemi);

    var sun = new pc.Entity('DirectionalLight');
    sun.addComponent('light', {
        type: 'directional',
        color: new pc.Color(1, 0.92, 0.8),
        intensity: 0.9,
        castShadows: true,
        shadowBias: 0.2,
        shadowDistance: 150
    });
    sun.setLocalPosition(60, 100, 40);
    sun.setLocalEulerAngles(50, 30, 0);
    this.app.root.addChild(sun);
};

Bootstrap.prototype.createGridMarkers = function(half) {
    var lineMat = this.createMat(0.3, 0.4, 0.25);
    for (var i = -half; i <= half; i += 20) {
        var hLine = new pc.Entity('GridH_' + i);
        hLine.addComponent('render', { type: 'box', material: lineMat });
        hLine.setLocalScale(this.mapSize, 0.05, 0.1);
        hLine.setLocalPosition(0, -0.3, i);
        this.app.root.addChild(hLine);

        var vLine = new pc.Entity('GridV_' + i);
        vLine.addComponent('render', { type: 'box', material: lineMat });
        vLine.setLocalScale(0.1, 0.05, this.mapSize);
        vLine.setLocalPosition(i, -0.3, 0);
        this.app.root.addChild(vLine);
    }
};

Bootstrap.prototype.createBuildings = function() {
    var half = this.mapSize / 2;
    var layouts = [
        { w: 10, d: 8, h: 5, stories: 2 },
        { w: 7, d: 7, h: 8, stories: 3 },
        { w: 14, d: 10, h: 4, stories: 1 },
        { w: 6, d: 5, h: 3, stories: 1 },
        { w: 12, d: 12, h: 12, stories: 4 },
        { w: 8, d: 6, h: 6, stories: 2 },
        { w: 5, d: 8, h: 3, stories: 1 }
    ];

    for (var i = 0; i < this.buildingCount; i++) {
        var layout = layouts[i % layouts.length];
        var x = pc.math.random(-half + 15, half - 15);
        var z = pc.math.random(-half + 15, half - 15);

        var model = this.instantiate('house');
        if (model) {
            model.setName('Building_' + i);
            model.setLocalPosition(x, 0, z);
            var s = 1.2 + Math.random() * 0.8;
            model.setLocalScale(s, s, s);
            model.setLocalEulerAngles(0, Math.random() * 360, 0);
            this.app.root.addChild(model);
        } else {
            this.createBuildingPrimitive('Building_' + i, x, z, layout);
        }
    }
};

Bootstrap.prototype.createBuildingPrimitive = function(name, x, z, layout) {
    var wallColor = this.getBuildingColor();
    var wallMat = this.createMat(wallColor.r, wallColor.g, wallColor.b);
    var roofColor = { r: 0.5 + Math.random() * 0.2, g: 0.2 + Math.random() * 0.15, b: 0.1 + Math.random() * 0.1 };

    var group = new pc.Entity(name);
    group.setLocalPosition(x, 0, z);
    this.app.root.addChild(group);

    for (var s = 0; s < layout.stories; s++) {
        var floorH = 2.5;
        var floor = new pc.Entity(name + '_Floor' + s);
        floor.addComponent('render', { type: 'box', material: wallMat });
        floor.setLocalScale(layout.w, floorH, layout.d);
        floor.setLocalPosition(0, s * floorH + floorH / 2, 0);
        group.addChild(floor);
    }

    var totalH = layout.stories * 2.5;
    var roof = new pc.Entity(name + '_Roof');
    roof.addComponent('render', { type: 'box', material: this.createMat(roofColor.r, roofColor.g, roofColor.b) });
    roof.setLocalScale(layout.w + 0.5, 0.3, layout.d + 0.5);
    roof.setLocalPosition(0, totalH + 0.15, 0);
    group.addChild(roof);

    var windowMat = this.createMat(0.6, 0.7, 0.9, 0.5);
    var winCount = 2 + Math.floor(Math.random() * 3);
    for (var w = 0; w < winCount; w++) {
        var win = new pc.Entity(name + '_Win' + w);
        win.addComponent('render', { type: 'box', material: windowMat });
        win.setLocalScale(0.8, 1.2, 0.1);
        var side = Math.floor(Math.random() * 4);
        var wx = 0, wz = 0;
        if (side === 0) { wx = -layout.w / 2 - 0.05; wz = (Math.random() - 0.5) * layout.d * 0.6; }
        else if (side === 1) { wx = layout.w / 2 + 0.05; wz = (Math.random() - 0.5) * layout.d * 0.6; }
        else if (side === 2) { wx = (Math.random() - 0.5) * layout.w * 0.6; wz = -layout.d / 2 - 0.05; }
        else { wx = (Math.random() - 0.5) * layout.w * 0.6; wz = layout.d / 2 + 0.05; }
        win.setLocalPosition(wx, 1.5 + Math.random() * (totalH - 2), wz);
        group.addChild(win);
    }
};

Bootstrap.prototype.getBuildingColor = function() {
    var palettes = [
        { r: 0.5, g: 0.4, b: 0.3 }, { r: 0.6, g: 0.5, b: 0.4 },
        { r: 0.4, g: 0.35, b: 0.3 }, { r: 0.55, g: 0.45, b: 0.35 },
        { r: 0.45, g: 0.4, b: 0.35 }, { r: 0.5, g: 0.45, b: 0.4 },
        { r: 0.35, g: 0.35, b: 0.35 }
    ];
    var p = palettes[Math.floor(Math.random() * palettes.length)];
    return { r: p.r + (Math.random() - 0.5) * 0.1, g: p.g + (Math.random() - 0.5) * 0.1, b: p.b + (Math.random() - 0.5) * 0.1 };
};

Bootstrap.prototype.createObstacles = function() {
    var half = this.mapSize / 2;
    for (var i = 0; i < this.obstacleCount; i++) {
        var x = pc.math.random(-half + 5, half - 5);
        var z = pc.math.random(-half + 5, half - 5);

        var model = this.instantiate('wall');
        if (model) {
            model.setName('Obstacle_' + i);
            model.setLocalPosition(x, 0, z);
            var s = 0.6 + Math.random() * 0.8;
            model.setLocalScale(s, s, s);
            model.setLocalEulerAngles(0, Math.random() * 360, 0);
            this.app.root.addChild(model);
        } else {
            var types = ['crate', 'barrel', 'wall', 'container'];
            this.createObstaclePrimitive('Obstacle_' + i, x, z, types[Math.floor(Math.random() * types.length)]);
        }
    }
};

Bootstrap.prototype.createObstaclePrimitive = function(name, x, z, type) {
    var obs = new pc.Entity(name);
    obs.setLocalPosition(x, 0, z);
    this.app.root.addChild(obs);

    switch (type) {
        case 'crate':
            var cs = 0.8 + Math.random() * 1.2;
            var crate = new pc.Entity();
            crate.addComponent('render', { type: 'box', material: this.createMat(0.5, 0.35, 0.2) });
            crate.setLocalScale(cs, cs, cs);
            crate.setLocalPosition(0, cs / 2, 0);
            obs.addChild(crate);
            break;
        case 'barrel':
            var br = 0.4 + Math.random() * 0.3;
            var bh = 0.8 + Math.random() * 0.4;
            var barrel = new pc.Entity();
            barrel.addComponent('render', { type: 'cylinder', material: this.createMat(0.3, 0.25, 0.15) });
            barrel.setLocalScale(br * 2, bh, br * 2);
            barrel.setLocalPosition(0, bh / 2, 0);
            obs.addChild(barrel);
            break;
        case 'wall':
            var ww = 0.3 + Math.random() * 0.5;
            var wl = 2 + Math.random() * 3;
            var wh = 1 + Math.random() * 1.5;
            var wall = new pc.Entity();
            wall.addComponent('render', { type: 'box', material: this.createMat(0.4, 0.38, 0.35) });
            wall.setLocalScale(wl, wh, ww);
            wall.setLocalPosition(0, wh / 2, 0);
            obs.addChild(wall);
            break;
        case 'container':
            var cw = 2 + Math.random() * 2;
            var cd = 2 + Math.random() * 2;
            var ch = 1.5 + Math.random() * 1;
            var cont = new pc.Entity();
            cont.addComponent('render', { type: 'box', material: this.createMat(0.2, 0.4, 0.2) });
            cont.setLocalScale(cw, ch, cd);
            cont.setLocalPosition(0, ch / 2, 0);
            obs.addChild(cont);
            break;
    }
};

Bootstrap.prototype.createTrees = function() {
    var half = this.mapSize / 2;
    var treePositions = [];
    for (var i = 0; i < 25; i++) {
        var cx = pc.math.random(-half + 15, half - 15);
        var cz = pc.math.random(-half + 15, half - 15);
        var tooClose = false;
        for (var j = 0; j < treePositions.length; j++) {
            var dx = cx - treePositions[j].x;
            var dz = cz - treePositions[j].z;
            if (dx * dx + dz * dz < 200) { tooClose = true; break; }
        }
        if (tooClose) continue;
        treePositions.push({ x: cx, z: cz });

        var treeModel = this.instantiate('trees');
        if (treeModel) {
            treeModel.setName('Tree_' + i);
            treeModel.setLocalPosition(cx, 0, cz);
            var s = 1.5 + Math.random() * 2;
            treeModel.setLocalScale(s, s, s);
            treeModel.setLocalEulerAngles(0, Math.random() * 360, 0);
            this.app.root.addChild(treeModel);
        } else {
            for (var k = 0; k < 3 + Math.random() * 4; k++) {
                var tx = cx + pc.math.random(-6, 6);
                var tz = cz + pc.math.random(-6, 6);
                if (Math.random() > 0.5) this.createPineTree('Tree_' + i + '_' + k, tx, tz);
                else this.createRoundTree('Tree_' + i + '_' + k, tx, tz);
            }
        }
    }
};

Bootstrap.prototype.createPineTree = function(name, x, z) {
    var th = 3 + Math.random() * 4;
    var trunkMat = this.createMat(0.35, 0.2, 0.1);
    var trunk = new pc.Entity(name + '_trunk');
    trunk.addComponent('render', { type: 'cylinder', material: trunkMat });
    trunk.setLocalScale(0.25, th * 0.4, 0.25);
    trunk.setLocalPosition(x, th * 0.2, z);
    this.app.root.addChild(trunk);

    var greenMat = this.createMat(0.1, 0.45 + Math.random() * 0.25, 0.1);
    for (var i = 0; i < 3; i++) {
        var foliage = new pc.Entity(name + '_foliage' + i);
        foliage.addComponent('render', { type: 'cone', material: greenMat });
        var fr = 1.5 + Math.random() * 1.5 - i * 0.3;
        foliage.setLocalScale(fr, 1.2 + Math.random() * 0.8, fr);
        foliage.setLocalPosition(x, th * 0.4 + i * 0.8 + 0.5, z);
        this.app.root.addChild(foliage);
    }
};

Bootstrap.prototype.createRoundTree = function(name, x, z) {
    var th = 2 + Math.random() * 3;
    var trunkMat = this.createMat(0.4, 0.25, 0.12);
    var trunk = new pc.Entity(name + '_trunk');
    trunk.addComponent('render', { type: 'cylinder', material: trunkMat });
    trunk.setLocalScale(0.3, th, 0.3);
    trunk.setLocalPosition(x, th / 2, z);
    this.app.root.addChild(trunk);

    var greenMat = this.createMat(0.15, 0.4 + Math.random() * 0.3, 0.1);
    var foliage = new pc.Entity(name + '_foliage');
    foliage.addComponent('render', { type: 'sphere', material: greenMat });
    var fr = 1.8 + Math.random() * 2;
    foliage.setLocalScale(fr, fr * 0.8, fr);
    foliage.setLocalPosition(x, th + fr * 0.3, z);
    this.app.root.addChild(foliage);
};

Bootstrap.prototype.createBorderWalls = function(half) {
    var wallMat = this.createMat(0.4, 0.15, 0.1);
    var wallH = 4;
    var sides = [
        { x: 0, z: -half, sx: this.mapSize + 6, sz: 1 },
        { x: 0, z: half, sx: this.mapSize + 6, sz: 1 },
        { x: -half, z: 0, sx: 1, sz: this.mapSize + 6 },
        { x: half, z: 0, sx: 1, sz: this.mapSize + 6 }
    ];
    for (var i = 0; i < sides.length; i++) {
        var s = sides[i];

        var wallModel = this.instantiate('wall');
        if (wallModel) {
            wallModel.setName('BorderWall_' + i);
            wallModel.setLocalPosition(s.x, 1.5, s.z);
            wallModel.setLocalScale(1, 1.5, 1);
            if (i < 2) wallModel.setLocalEulerAngles(0, 0, 0);
            else wallModel.setLocalEulerAngles(0, 90, 0);
            this.app.root.addChild(wallModel);
        } else {
            var wall = new pc.Entity('Wall_' + i);
            wall.addComponent('render', { type: 'box', material: wallMat });
            wall.setLocalScale(s.sx, wallH, s.sz);
            wall.setLocalPosition(s.x, wallH / 2, s.z);
            this.app.root.addChild(wall);
        }
    }
};

Bootstrap.prototype.createTpsCamera = function() {
    var cam = new pc.Entity('Camera');
    cam.addComponent('camera', {
        clearColor: new pc.Color(0.45, 0.6, 0.85),
        farClip: 500,
        nearClip: 0.1
    });
    this.app.root.addChild(cam);
};

Bootstrap.prototype.createPlayer = function() {
    var player = new pc.Entity('Player');

    var charModel = this.instantiate('char');
    if (charModel) {
        charModel.setName('CharModel');
        charModel.setLocalPosition(0, 0, 0);
        charModel.setLocalScale(1.2, 1.2, 1.2);
        player.addChild(charModel);
    } else {
        var capsule = new pc.Entity('CharPrimitive');
        capsule.addComponent('render', { type: 'capsule', material: this.createMat(0.15, 0.45, 0.9) });
        capsule.setLocalScale(0.6, 1.8, 0.6);
        capsule.setLocalPosition(0, 0.9, 0);
        player.addChild(capsule);
        var head = new pc.Entity('Head');
        head.addComponent('render', { type: 'sphere', material: this.createMat(0.8, 0.7, 0.5) });
        head.setLocalScale(0.35, 0.35, 0.35);
        head.setLocalPosition(0, 1.1, 0);
        player.addChild(head);
    }

    player.setLocalPosition(0, 0, 0);
    player.tags.add('player');

    player.addComponent('script');
    player.script.create('playerController');
    this.app.root.addChild(player);
};

Bootstrap.prototype.createZoneVisuals = function() {
    var zoneRing = new pc.Entity('ZoneVisualizer');
    zoneRing.addComponent('render', {
        type: 'cylinder',
        material: this.createMat(1, 0.1, 0.1, 0.12)
    });
    zoneRing.setLocalScale(200, 0.3, 200);
    zoneRing.setLocalPosition(0, 0.05, 0);
    zoneRing.tags.add('zoneRing');
    this.app.root.addChild(zoneRing);
};

Bootstrap.prototype.createBots = function() {
    var half = this.mapSize / 2;

    for (var i = 0; i < this.botCount; i++) {
        var bot = new pc.Entity('Bot_' + i);
        bot.setLocalPosition(pc.math.random(-half, half), 0, pc.math.random(-half, half));
        bot.tags.add('player', 'bot');

        var charModel = this.instantiate('char');
        if (charModel) {
            charModel.setName('CharModel');
            charModel.setLocalPosition(0, 0, 0);
            charModel.setLocalScale(1.2, 1.2, 1.2);
            bot.addChild(charModel);
        } else {
            var botColors = [
                [0.8, 0.15, 0.1], [0.1, 0.7, 0.1], [0.9, 0.6, 0.1],
                [0.2, 0.5, 0.7], [0.6, 0.1, 0.6], [0.9, 0.4, 0.1],
                [0.1, 0.6, 0.6], [0.5, 0.5, 0.5], [0.7, 0.3, 0.3]
            ];
            var color = botColors[i % botColors.length];
            var capsule = new pc.Entity('BotPrimitive');
            capsule.addComponent('render', { type: 'capsule', material: this.createMat(color[0], color[1], color[2]) });
            capsule.setLocalScale(0.6, 1.8, 0.6);
            capsule.setLocalPosition(0, 0.9, 0);
            bot.addChild(capsule);
            var head = new pc.Entity('BotHead');
            head.addComponent('render', { type: 'sphere', material: this.createMat(0.8, 0.65, 0.45) });
            head.setLocalScale(0.3, 0.3, 0.3);
            head.setLocalPosition(0, 1.1, 0);
            bot.addChild(head);
        }

        bot.addComponent('script');
        bot.script.create('botAI');
        this.app.root.addChild(bot);
    }
};

Bootstrap.prototype.createMat = function(r, g, b, opacity) {
    var mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(r, g, b);
    if (opacity !== undefined && opacity < 1) {
        mat.opacity = opacity;
        mat.blendType = pc.BLEND_NORMAL;
    } else {
        mat.opacity = 1;
    }
    mat.update();
    return mat;
};
