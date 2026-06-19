import * as pc from 'playcanvas';

export class TextRenderer {
  private app: pc.Application;
  private scale = 4; // 4x for crisp text

  constructor(app: pc.Application) {
    this.app = app;
  }

  createText(text: string, fontSize: number, color: pc.Color, parent?: pc.Entity, x?: number, y?: number): pc.Entity {
    const s = this.scale;
    const canvas = document.createElement('canvas');
    canvas.style.imageRendering = 'pixelated';
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    // Measure with scaled font
    ctx.font = `bold ${fontSize * s}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const metrics = ctx.measureText(text);
    const pad = 6 * s;
    const tw = Math.max(1, Math.ceil(metrics.width) + pad * 2);
    const th = Math.max(1, Math.ceil(fontSize * s * 1.2));
    
    canvas.width = tw;
    canvas.height = th;

    // Clear and draw
    ctx.clearRect(0, 0, tw, th);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.font = `bold ${fontSize * s}px Arial, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`;
    ctx.fillText(text, pad, pad * 0.6);

    const texture = new pc.Texture(this.app.graphicsDevice, {
      width: tw,
      height: th,
      format: pc.PIXELFORMAT_R8_G8_B8_A8,
      mipmaps: false,
      minFilter: pc.FILTER_LINEAR,
      magFilter: pc.FILTER_LINEAR,
    });
    texture.setSource(canvas);
    texture.upload();

    const entity = new pc.Entity('txt');
    entity.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      texture,
      width: Math.round(tw / s),
      height: Math.round(th / s),
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    if (x !== undefined) entity.setLocalPosition(x, y ?? 0, 0);
    if (parent) parent.addChild(entity);
    return entity;
  }

  createButton(label: string, w: number, h: number, bg: pc.Color, parent?: pc.Entity, x?: number, y?: number): pc.Entity {
    const entity = new pc.Entity('btn');
    entity.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      color: bg,
      width: w,
      height: h,
      useInput: true,
      anchor: new pc.Vec4(0.5, 0.5, 0.5, 0.5),
      pivot: new pc.Vec2(0.5, 0.5),
    });
    if (x !== undefined) entity.setLocalPosition(x, y ?? 0, 0);
    if (parent) parent.addChild(entity);

    const labelSize = Math.min(15, h - 10);
    this.createText(label, labelSize, new pc.Color(1, 1, 1), entity, 0, 0);
    return entity;
  }
}
