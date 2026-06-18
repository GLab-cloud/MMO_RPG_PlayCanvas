export class ParticleSystem {
  private app: pc.Application;
  private pools: Map<string, pc.Entity[]> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
  }

  emit(name: string, position: pc.Vec3, count: number = 10): void {
    for (let i = 0; i < count; i++) {
      const particle = this.getParticle(name);
      if (!particle) continue;
      particle.setPosition(position.x + (Math.random() - 0.5), position.y + (Math.random() - 0.5), position.z + (Math.random() - 0.5));
      particle.enabled = true;

      setTimeout(() => {
        particle.enabled = false;
        this.returnParticle(name, particle);
      }, 1000);
    }
  }

  private getParticle(name: string): pc.Entity | null {
    let pool = this.pools.get(name);
    if (!pool) {
      pool = [];
      this.pools.set(name, pool);
    }
    const existing = pool.find((p) => !p.enabled);
    if (existing) return existing;

    const entity = new pc.Entity(`Particle_${name}_${pool.length}`);
    entity.addComponent('render', { type: 'sphere' });
    entity.setLocalScale(0.1, 0.1, 0.1);
    this.app.root.addChild(entity);
    entity.enabled = false;
    pool.push(entity);
    return entity;
  }

  private returnParticle(name: string, entity: pc.Entity): void {
    entity.enabled = false;
  }

  clear(): void {
    for (const [, pool] of this.pools) {
      for (const p of pool) {
        p.destroy();
      }
    }
    this.pools.clear();
  }
}
