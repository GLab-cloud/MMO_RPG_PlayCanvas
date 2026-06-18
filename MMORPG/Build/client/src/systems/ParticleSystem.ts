import * as pc from 'playcanvas';

interface Particle {
  entity: pc.Entity;
  lifetime: number;
  elapsed: number;
}

export class ParticleSystem {
  private app: pc.Application;
  private pool: Particle[] = [];
  private active: Particle[] = [];

  constructor(app: pc.Application) {
    this.app = app;
  }

  emit(name: string, position: pc.Vec3, count: number): void {
    const colors: Record<string, number[]> = {
      hit: [1, 0.3, 0.2],
      levelup: [1, 0.85, 0],
      loot: [0.3, 1, 0.3],
      sparkle: [1, 1, 0.5],
      heal: [0.3, 1, 0.5],
    };
    const color = colors[name] || [1, 1, 1];

    for (let i = 0; i < count; i++) {
      let particle = this.pool.pop();
      if (!particle) {
        const entity = new pc.Entity(`particle-${name}-${Date.now()}-${i}`);
        entity.addComponent('render', {
          type: 'sphere',
          material: this.createMaterial(color, [0.3, 0.3, 0.3]),
        });
        entity.setLocalScale(0.1, 0.1, 0.1);
        this.app.root.addChild(entity);
        particle = { entity, lifetime: 0.5 + Math.random() * 0.5, elapsed: 0 };
      } else {
        particle.entity.enabled = true;
        particle.lifetime = 0.5 + Math.random() * 0.5;
        particle.elapsed = 0;
      }

      const offset = new pc.Vec3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * 0.5,
        (Math.random() - 0.5) * 0.5
      );
      particle.entity.setLocalPosition(
        position.x + offset.x,
        position.y + offset.y,
        position.z + offset.z
      );
      this.active.push(particle);
    }
  }

  private createMaterial(diffuse: number[], specular: number[]): pc.Material {
    const mat = new pc.StandardMaterial();
    mat.diffuse = new pc.Color(diffuse[0], diffuse[1], diffuse[2]);
    mat.specular = new pc.Color(specular[0], specular[1], specular[2]);
    mat.metalness = 0;
    mat.update();
    return mat;
  }

  update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.elapsed += dt;
      if (p.elapsed >= p.lifetime) {
        p.entity.enabled = false;
        this.pool.push(p);
        this.active.splice(i, 1);
      } else {
        const alpha = 1 - p.elapsed / p.lifetime;
        p.entity.setLocalScale(0.1 * alpha, 0.1 * alpha, 0.1 * alpha);
      }
    }
  }
}
