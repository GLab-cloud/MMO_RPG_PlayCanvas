import * as pc from 'playcanvas';

type WeatherState = 'clear' | 'cloudy' | 'rain' | 'snow';

export class EnvironmentSystem {
  private app: pc.Application;
  private timeOfDay: number = 12;
  private dayLength: number = 600;
  private weather: WeatherState = 'clear';
  private sun: pc.Entity;
  private hemisphere: pc.Entity;

  constructor(app: pc.Application) {
    this.app = app;
    this.sun = this.findEntity('directional-light');
    this.hemisphere = this.findEntity('hemisphere-light');
  }

  private findEntity(name: string): pc.Entity {
    const entity = this.app.root.findByName(name);
    if (!entity) {
      const e = new pc.Entity(name);
      e.addComponent('light');
      this.app.root.addChild(e);
      return e;
    }
    return entity as pc.Entity;
  }

  setTimeOfDay(hour: number): void {
    this.timeOfDay = Math.max(0, Math.min(24, hour));
    this.updateLighting();
  }

  setWeather(weather: WeatherState): void {
    this.weather = weather;
    this.updateLighting();
  }

  private updateLighting(): void {
    const sunAngle = ((this.timeOfDay - 6) / 12) * 180;
    this.sun.setLocalEulerAngles(sunAngle, 30, 0);

    const intensity = Math.max(0.1, Math.sin((this.timeOfDay / 24) * Math.PI));
    if (this.sun.light) this.sun.light.intensity = intensity;

    switch (this.weather) {
      case 'clear':
        this.app.scene.fog = 'none';
        break;
      case 'cloudy':
        this.app.scene.fog = 'linear';
        this.app.scene.fogColor = new pc.Color(0.6, 0.6, 0.65);
        this.app.scene.fogStart = 30;
        this.app.scene.fogEnd = 80;
        break;
      case 'rain':
        this.app.scene.fog = 'linear';
        this.app.scene.fogColor = new pc.Color(0.4, 0.4, 0.45);
        this.app.scene.fogStart = 20;
        this.app.scene.fogEnd = 60;
        break;
      case 'snow':
        this.app.scene.fog = 'linear';
        this.app.scene.fogColor = new pc.Color(0.7, 0.7, 0.75);
        this.app.scene.fogStart = 30;
        this.app.scene.fogEnd = 70;
        break;
    }
  }

  update(dt: number): void {
    this.timeOfDay += (dt / this.dayLength) * 24;
    if (this.timeOfDay >= 24) this.timeOfDay -= 24;
    this.updateLighting();
  }
}
