import { WorldRoom } from '../rooms/WorldRoom.js';

const WEATHERS = ['clear', 'cloudy', 'rain', 'snow'] as const;
const WEATHER_DURATION = 120;

export class EnvironmentSystem {
  private room: WorldRoom;
  private time = 0;
  private weatherTimer = 0;
  private currentWeather: string = 'clear';

  constructor(room: WorldRoom) {
    this.room = room;
  }

  update(dt: number): void {
    this.time += dt;
    this.weatherTimer += dt;

    const gameTime = this.time * 0.1;
    this.room.state.time = gameTime % 24;

    if (this.weatherTimer >= WEATHER_DURATION) {
      this.weatherTimer = 0;
      this.currentWeather = WEATHERS[Math.floor(Math.random() * WEATHERS.length)];
      this.room.state.weather = this.currentWeather;
      this.room.broadcast('environment:weather', { weather: this.currentWeather });
    }

    if (this.room.state.weather !== this.currentWeather) {
      this.room.state.weather = this.currentWeather;
    }
  }
}
