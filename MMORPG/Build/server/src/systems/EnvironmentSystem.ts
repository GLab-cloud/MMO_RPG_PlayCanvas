export type Weather = 'clear' | 'cloudy' | 'rain' | 'snow';

export class EnvironmentSystem {
  gameTime: number = 0;
  dayLength: number = 3600;
  currentWeather: Weather = 'clear';
  weatherTimer: number = 0;
  weatherInterval: number = 120;

  update(deltaTime: number): { timeOfDay: number; weather: Weather } {
    this.gameTime = (this.gameTime + deltaTime) % this.dayLength;
    this.weatherTimer += deltaTime;
    if (this.weatherTimer >= this.weatherInterval) {
      this.weatherTimer = 0;
      this.currentWeather = this.randomWeather();
    }
    return { timeOfDay: this.gameTime / this.dayLength, weather: this.currentWeather };
  }

  private randomWeather(): Weather {
    const roll = Math.random();
    if (roll < 0.5) return 'clear';
    if (roll < 0.75) return 'cloudy';
    if (roll < 0.9) return 'rain';
    return 'snow';
  }
}
