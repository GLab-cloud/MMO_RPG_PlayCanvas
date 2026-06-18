import * as pc from 'playcanvas';

export class App {
  canvas: HTMLCanvasElement;
  pcApp!: pc.Application;

  constructor() {
    this.canvas = document.createElement('canvas');
  }

  async init(): Promise<void> {
    this.pcApp.start();

    this.setupLighting();
    this.setupSkybox();
    this.setupClouds();
  }

  private setupLighting(): void {
    this.pcApp.scene.ambientLight = new pc.Color(0.5, 0.55, 0.65);

    const directionalLight = new pc.Entity('directional-light');
    directionalLight.addComponent('light', {
      type: pc.LIGHTTYPE_DIRECTIONAL,
      color: new pc.Color(1, 0.9, 0.78),
      intensity: 1.5,
      castShadows: true,
      shadowBias: 0.0001,
      shadowResolution: 2048,
    });
    directionalLight.setLocalEulerAngles(35, 40, 0);
    this.pcApp.root.addChild(directionalLight);

    const hemisphereLight = new pc.Entity('hemisphere-light');
    hemisphereLight.addComponent('light', {
      type: pc.LIGHTTYPE_DIRECTIONAL,
      color: new pc.Color(0.5, 0.7, 0.95),
      intensity: 0.5,
    });
    hemisphereLight.setLocalEulerAngles(-90, 0, 0);
    this.pcApp.root.addChild(hemisphereLight);
  }

  private setupSkybox(): void {
    this.pcApp.scene.skyboxIntensity = 0.6;
    this.pcApp.scene.skyboxRotation = new pc.Quat();
  }

  private setupClouds(): void {
    const positions = [
      [-30, 38, -40], [20, 34, -50], [0, 42, -30],
      [40, 36, 20], [-20, 33, 55], [55, 40, -10],
      [-45, 38, 35], [15, 35, 65], [-55, 39, -25],
      [35, 42, -25], [-10, 36, -60], [60, 37, 40],
    ];
    for (let i = 0; i < positions.length; i++) {
      const cloud = new pc.Entity(`cloud-${i}`);
      cloud.addComponent('render', {
        type: 'sphere',
      });
      const mat = new pc.StandardMaterial();
      mat.diffuse = new pc.Color(1, 1, 1);
      mat.opacity = 0.5;
      mat.blendType = pc.BLEND_NORMAL;
      mat.update();
      cloud.render!.material = mat;
      const [x, y, z] = positions[i];
      cloud.setLocalPosition(x, y, z);
      cloud.setLocalScale(
        12 + Math.random() * 10,
        2 + Math.random() * 2.5,
        8 + Math.random() * 8
      );
      this.pcApp.root.addChild(cloud);
    }
  }
}
