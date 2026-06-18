export class EnvironmentSystem {
  private app: pc.Application;
  private currentWeather: string = 'clear';
  private skyColor: pc.Color;
  private ambientColor: pc.Color;

  constructor(app: pc.Application) {
    this.app = app;
    this.skyColor = new pc.Color(0.45, 0.6, 0.85);
    this.ambientColor = new pc.Color(0.3, 0.3, 0.4);

    this.setupLighting();
    this.setupSkybox();
  }

  private setupLighting(): void {
    const hemi = new pc.Entity('HemisphereLight');
    hemi.addComponent('light', {
      type: 'hemisphere',
      color: new pc.Color(0.5, 0.6, 0.9),
      intensity: 0.5,
    });
    this.app.root.addChild(hemi);

    const sun = new pc.Entity('DirectionalLight');
    sun.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.92, 0.8),
      intensity: 0.9,
      castShadows: true,
      shadowBias: 0.2,
      shadowDistance: 150,
    });
    sun.setLocalPosition(60, 100, 40);
    sun.setLocalEulerAngles(50, 30, 0);
    this.app.root.addChild(sun);
  }

  private setupSkybox(): void {
    if (this.app.scene) {
      this.app.scene.skyboxIntensity = 0.5;
    }
  }

  setWeather(weather: string): void {
    this.currentWeather = weather;
    switch (weather) {
      case 'clear':
        this.skyColor.set(0.45, 0.6, 0.85);
        this.ambientColor.set(0.3, 0.3, 0.4);
        break;
      case 'cloudy':
        this.skyColor.set(0.5, 0.5, 0.55);
        this.ambientColor.set(0.2, 0.2, 0.25);
        break;
      case 'rain':
        this.skyColor.set(0.3, 0.3, 0.35);
        this.ambientColor.set(0.15, 0.15, 0.2);
        break;
      case 'snow':
        this.skyColor.set(0.7, 0.7, 0.75);
        this.ambientColor.set(0.35, 0.35, 0.4);
        break;
    }
  }

  setTimeOfDay(hour: number): void {
    const nightFactor = Math.max(0, Math.sin((hour - 6) * Math.PI / 12));
    const intensity = 0.3 + nightFactor * 0.7;
    const temp = 0.5 + nightFactor * 0.5;

    this.skyColor.set(
      0.3 + temp * 0.3,
      0.4 + temp * 0.3,
      0.5 + temp * 0.4
    );

    this.app.scene.ambientLight = new pc.Color(
      this.ambientColor.r * intensity,
      this.ambientColor.g * intensity,
      this.ambientColor.b * intensity
    );
  }

  getCurrentWeather(): string {
    return this.currentWeather;
  }
}
