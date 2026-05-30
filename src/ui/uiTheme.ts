import Phaser from 'phaser';

/**
 * Shared visual language for the portrait "噬主：魔王胚胎" UI mockup.
 *
 * Everything here is ART-FREE: panels, frames, bars and buttons are drawn with
 * Phaser primitives (Graphics / Rectangle / Arc / Text) as PLACEHOLDERS. When
 * real pixel art lands (see UI-ASSET-PROMPTS.md), swap the placeholder body of
 * each factory for an Image without touching call sites.
 *
 * Design space is portrait 720x1280 (docs/mobile-dev-plan.md §3.3). All mockup
 * coordinates are authored in this space; set main.ts width/height to 720x1280
 * when integrating. Views read {@link designSize} instead of scene.scale so the
 * layout is deterministic even while the live game is still 1280x720.
 */
export const PORTRAIT = { width: 720, height: 1280 } as const;

/** Padding that approximates notch / gesture-bar safe areas. */
export const SAFE = { top: 28, bottom: 30, side: 18 } as const;

/** Depth layers, low -> high. Keeps overlays above HUD above gameplay. */
export const UI_DEPTH = {
  zones: 50,
  hud: 10_000,
  legion: 10_010,
  skillButton: 10_020,
  wheel: 11_000,
  slot: 12_000,
  overlay: 13_000,
} as const;

/**
 * Dark-pixel palette. `0x` numbers feed Phaser fills/strokes; `#` strings feed
 * Text colors. Tuned to the mockup: blood crimson + bone gold + arcane purple +
 * toxic flame green over a near-black void.
 */
export const UI = {
  // Surfaces
  void: 0x070409,
  panel: 0x150a17,
  panelSoft: 0x21121f,
  slotFill: 0x2a1020,
  cell: 0x241326,
  // Accents
  crimson: 0x7e1b36,
  crimsonBright: 0xb51d2a,
  blood: 0xd5223a,
  gold: 0xc99437,
  goldBright: 0xffd76a,
  flame: 0x7ad13a,
  flameDim: 0x4f8f25,
  arcane: 0x8a4bd6,
  arcaneDim: 0x4a2470,
  frame: 0x3a1840,
  bone: 0xe8dcc0,
  // Thumb-reach zones (col D reference)
  zoneAvoid: 0xb51d2a,
  zoneStretch: 0xe8b84b,
  zoneThumb: 0x4caf50,
  // Text
  text: '#f8ead8',
  textDim: '#b9a39c',
  textGold: '#ffd76a',
  textGreen: '#b6f08a',
  textCrimson: '#ff6d8f',
} as const;

/** Deterministic portrait layout size (ignores live landscape scale). */
export function designSize(_scene: Phaser.Scene): { w: number; h: number } {
  return { w: PORTRAIT.width, h: PORTRAIT.height };
}

export interface PixelTextOpts {
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  stroke?: string;
  strokeThickness?: number;
  bold?: boolean;
}

/** Monospace pixel-flavored text with sane defaults + crisp outline. */
export function pixelText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  opts: PixelTextOpts = {},
): Phaser.GameObjects.Text {
  const t = scene.add.text(x, y, text, {
    fontFamily: 'monospace',
    fontSize: `${opts.size ?? 18}px`,
    color: opts.color ?? UI.text,
    fontStyle: opts.bold ? 'bold' : 'normal',
    align: opts.align ?? 'left',
    stroke: opts.stroke ?? '#000000',
    strokeThickness: opts.strokeThickness ?? 3,
  });
  return t;
}

export interface PanelOpts {
  fill?: number;
  fillAlpha?: number;
  border?: number;
  borderAlpha?: number;
  borderWidth?: number;
  radius?: number;
}

/**
 * A rounded panel placeholder centered on its container origin (0,0). Returns a
 * Container holding one Graphics so callers can position / add it freely.
 */
export function makePanel(
  scene: Phaser.Scene,
  w: number,
  h: number,
  opts: PanelOpts = {},
): Phaser.GameObjects.Container {
  const g = scene.add.graphics();
  const radius = opts.radius ?? 14;
  g.fillStyle(opts.fill ?? UI.panel, opts.fillAlpha ?? 0.92);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  g.lineStyle(opts.borderWidth ?? 2, opts.border ?? UI.crimson, opts.borderAlpha ?? 0.9);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  return scene.add.container(0, 0, [g]);
}

export interface StatBar {
  container: Phaser.GameObjects.Container;
  /** ratio is clamped to [0,1]; fill grows left -> right. */
  setRatio(ratio: number): void;
  setFill(color: number): void;
}

/**
 * Horizontal stat bar placeholder (HP / 腐血 / 胚胎). Track + left-anchored fill;
 * fill width is driven by scaleX so {@link StatBar.setRatio} is allocation-free.
 */
export function makeStatBar(
  scene: Phaser.Scene,
  w: number,
  h: number,
  fillColor: number,
): StatBar {
  const container = scene.add.container(0, 0);
  const track = scene.add.rectangle(0, 0, w, h, UI.void, 0.85).setOrigin(0, 0.5);
  track.setStrokeStyle(1, 0x000000, 0.6);
  const fill = scene.add.rectangle(1, 0, w - 2, h - 4, fillColor, 1).setOrigin(0, 0.5);
  container.add([track, fill]);
  return {
    container,
    setRatio(ratio: number) {
      fill.scaleX = Phaser.Math.Clamp(ratio, 0, 1);
    },
    setFill(color: number) {
      fill.setFillStyle(color, 1);
    },
  };
}

export interface MedallionOpts {
  fill?: number;
  ring?: number;
  ringWidth?: number;
  glow?: number;
}

/**
 * Circular medallion placeholder (skill button / wheel node): outer ring + inner
 * disc. Returns a Container; callers stack an icon glyph + label on top.
 */
export function makeMedallion(
  scene: Phaser.Scene,
  radius: number,
  opts: MedallionOpts = {},
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);
  const glow = scene.add.circle(0, 0, radius + 5, opts.glow ?? UI.crimsonBright, 0.18);
  const disc = scene.add.circle(0, 0, radius, opts.fill ?? UI.slotFill, 1);
  disc.setStrokeStyle(opts.ringWidth ?? 4, opts.ring ?? UI.gold, 1);
  container.add([glow, disc]);
  return container;
}

/** Stroke a dashed arc (used for the thumb-reach zone boundaries in col D). */
export function dashedArc(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number,
  color: number,
  width = 2,
  dashDeg = 6,
  gapDeg = 5,
): void {
  g.lineStyle(width, color, 0.9);
  for (let a = startDeg; a < endDeg; a += dashDeg + gapDeg) {
    const a0 = Phaser.Math.DegToRad(a);
    const a1 = Phaser.Math.DegToRad(Math.min(a + dashDeg, endDeg));
    g.beginPath();
    g.arc(cx, cy, radius, a0, a1, false);
    g.strokePath();
  }
}

/** Bright rounded-rect outline placeholder for "描边选中" selection highlight. */
export function selectionOutline(
  scene: Phaser.Scene,
  w: number,
  h: number,
  color: number = UI.goldBright,
  radius = 10,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.lineStyle(3, color, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  return g;
}

/**
 * Give a Container a CENTERED rectangular hit area + hand cursor. Phaser's auto
 * hit area for a sized Container is Rectangle(0,0,w,h) anchored at the container
 * transform point — but makePanel/makeMedallion draw their children centered on
 * (0,0), so the auto area would sit half-off the art and clicks would miss. This
 * anchors the hit box on the visual center. (Shapes/Text don't need this; their
 * origin is handled by Phaser's input transform.)
 */
export function enableHit(obj: Phaser.GameObjects.Container, w: number, h: number): void {
  obj.setSize(w, h);
  obj.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  if (obj.input) {
    obj.input.cursor = 'pointer';
  }
}
