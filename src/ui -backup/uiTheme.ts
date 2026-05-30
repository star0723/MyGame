import Phaser from 'phaser';

/**
 * Backup-only portrait UI theme.
 *
 * These factories intentionally draw every frame, icon and control with Phaser
 * primitives. The reference art in docs/UI/UI.png is pixel-art heavy, but this
 * backup branch must remain asset-free and not touch the live UI chain.
 */
export const PORTRAIT = { width: 720, height: 1280 } as const;

export const SAFE = { top: 22, bottom: 24, side: 16 } as const;

export const LAYOUT = {
  top: { slotX: 360, slotY: 42, slotW: 330, slotH: 38 },
  radar: { x: 642, y: 515, w: 52, h: 190 },
} as const;

export const UI_DEPTH = {
  zones: 50,
  hud: 10_000,
  radar: 10_004,
  legion: 10_010,
  skillButton: 10_020,
  wheel: 11_000,
  slot: 12_000,
  overlay: 13_000,
} as const;

export const UI = {
  void: 0x07050b,
  ink: 0x0d0912,
  stone: 0x181621,
  stoneDeep: 0x101019,
  stoneLine: 0x2d2a36,
  panel: 0x171018,
  panelSoft: 0x231927,
  slotFill: 0x2a1020,
  cell: 0x2a1422,
  cellDark: 0x150a12,
  bronze: 0x6d4626,
  bronzeDark: 0x3a251a,
  gold: 0xc08a3e,
  goldBright: 0xffd486,
  bone: 0xe8dcc0,
  boneDim: 0xb8a68a,
  blood: 0xc8202f,
  bloodDark: 0x73141e,
  crimson: 0x8a1d34,
  crimsonBright: 0xe2323b,
  arcane: 0x8a3be6,
  arcaneBright: 0xc65cff,
  arcaneDim: 0x44205e,
  flame: 0x72d842,
  flameDim: 0x336d28,
  amber: 0xe7ad44,
  shield: 0xf0c35b,
  steel: 0x78727c,
  text: '#f8ead8',
  textDim: '#b9a39c',
  textGold: '#ffd486',
  textGreen: '#b6f08a',
  textCrimson: '#ff7c8d',
  textPurple: '#dba3ff',
  textDark: '#21120d',
  zoneAvoid: 0xb51d2a,
  zoneStretch: 0xe8b84b,
  zoneThumb: 0x4caf50,
} as const;

/** ASCII-safe Chinese text helper. Pass Unicode code points in hex, separated by spaces. */
export function zh(points: string): string {
  return points
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((point) => String.fromCodePoint(Number.parseInt(point, 16)))
    .join('');
}

export type PixelIcon =
  | 'heart'
  | 'drop'
  | 'embryo'
  | 'skull'
  | 'coin'
  | 'sword'
  | 'shield'
  | 'bat'
  | 'goblin'
  | 'core'
  | 'pause'
  | 'slash'
  | 'orb';

export interface PixelTextOpts {
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  stroke?: string;
  strokeThickness?: number;
  bold?: boolean;
  wordWrap?: number;
}

export interface PanelOpts {
  fill?: number;
  fillAlpha?: number;
  border?: number;
  borderAlpha?: number;
  borderWidth?: number;
  radius?: number;
  ornate?: boolean;
  inner?: boolean;
}

export interface StatBar {
  container: Phaser.GameObjects.Container;
  setRatio(ratio: number): void;
  setFill(color: number): void;
}

export interface MedallionOpts {
  fill?: number;
  ring?: number;
  ringWidth?: number;
  glow?: number;
  glowAlpha?: number;
}

export function designSize(_scene: Phaser.Scene): { w: number; h: number } {
  return { w: PORTRAIT.width, h: PORTRAIT.height };
}

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
    stroke: opts.stroke ?? '#050308',
    strokeThickness: opts.strokeThickness ?? 3,
    lineSpacing: 3,
    wordWrap: opts.wordWrap ? { width: opts.wordWrap, useAdvancedWrap: true } : undefined,
  });
  return t;
}

export function makePanel(
  scene: Phaser.Scene,
  w: number,
  h: number,
  opts: PanelOpts = {},
): Phaser.GameObjects.Container {
  const radius = opts.radius ?? 10;
  const border = opts.border ?? UI.gold;
  const borderWidth = opts.borderWidth ?? 2;
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();

  g.fillStyle(UI.void, 0.42);
  g.fillRoundedRect(-w / 2 + 4, -h / 2 + 5, w, h, radius);
  g.fillStyle(opts.fill ?? UI.panel, opts.fillAlpha ?? 0.95);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  g.lineStyle(borderWidth + 2, UI.bronzeDark, 0.85);
  g.strokeRoundedRect(-w / 2 + 1, -h / 2 + 1, w - 2, h - 2, radius);
  g.lineStyle(borderWidth, border, opts.borderAlpha ?? 0.95);
  g.strokeRoundedRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, Math.max(2, radius - 2));

  if (opts.inner ?? true) {
    g.lineStyle(1, UI.bone, 0.2);
    g.strokeRoundedRect(-w / 2 + 8, -h / 2 + 8, w - 16, h - 16, Math.max(2, radius - 5));
  }

  if (opts.ornate ?? true) {
    const s = 8;
    const inset = 7;
    g.fillStyle(UI.goldBright, 0.92);
    [
      [-w / 2 + inset, -h / 2 + inset],
      [w / 2 - inset, -h / 2 + inset],
      [-w / 2 + inset, h / 2 - inset],
      [w / 2 - inset, h / 2 - inset],
    ].forEach(([x, y]) => {
      g.fillCircle(x, y, 2.2);
      g.lineStyle(1, UI.bronzeDark, 0.9);
      g.strokeCircle(x, y, s / 4);
    });
  }

  c.add(g);
  return c;
}

export function makeStoneCard(
  scene: Phaser.Scene,
  w: number,
  h: number,
  opts: PanelOpts = {},
): Phaser.GameObjects.Container {
  return makePanel(scene, w, h, {
    fill: opts.fill ?? UI.stoneDeep,
    fillAlpha: opts.fillAlpha ?? 0.95,
    border: opts.border ?? UI.bronze,
    borderWidth: opts.borderWidth ?? 2,
    radius: opts.radius ?? 6,
    ornate: opts.ornate ?? false,
    inner: opts.inner ?? true,
  });
}

export function makePixelPanel(
  scene: Phaser.Scene,
  w: number,
  h: number,
  opts: PanelOpts = {},
): Phaser.GameObjects.Container {
  return makePanel(scene, w, h, opts);
}

export function makeStatBar(
  scene: Phaser.Scene,
  w: number,
  h: number,
  fillColor: number,
): StatBar {
  const container = scene.add.container(0, 0);
  const track = scene.add.rectangle(0, 0, w, h, UI.cellDark, 1).setOrigin(0, 0.5);
  track.setStrokeStyle(1, UI.bronze, 0.75);
  const fill = scene.add.rectangle(2, 0, w - 4, h - 4, fillColor, 1).setOrigin(0, 0.5);
  const shine = scene.add.rectangle(3, -Math.max(1, h * 0.18), w - 6, Math.max(2, h * 0.22), 0xffffff, 0.14).setOrigin(0, 0.5);
  container.add([track, fill, shine]);
  return {
    container,
    setRatio(ratio: number) {
      const next = Phaser.Math.Clamp(ratio, 0, 1);
      fill.scaleX = next;
      shine.scaleX = next;
    },
    setFill(color: number) {
      fill.setFillStyle(color, 1);
    },
  };
}

export function makeSegmentBar(
  scene: Phaser.Scene,
  count: number,
  cellW: number,
  cellH: number,
  gap: number,
  fill = UI.blood,
): { container: Phaser.GameObjects.Container; cells: Phaser.GameObjects.Rectangle[]; setRatio(ratio: number): void } {
  const c = scene.add.container(0, 0);
  const totalW = count * cellW + (count - 1) * gap;
  const bg = makePanel(scene, totalW + 32, cellH + 20, {
    fill: UI.cellDark,
    border: UI.bronze,
    borderWidth: 2,
    radius: 12,
    ornate: false,
  });
  c.add(bg);
  const cells: Phaser.GameObjects.Rectangle[] = [];
  for (let i = 0; i < count; i++) {
    const x = -totalW / 2 + i * (cellW + gap) + cellW / 2;
    const cell = scene.add.rectangle(x, 0, cellW, cellH, UI.crimson, 1);
    cell.setStrokeStyle(1, UI.bronzeDark, 0.9);
    const shine = scene.add.rectangle(x, -cellH * 0.22, cellW - 6, Math.max(2, cellH * 0.2), 0xffa08a, 0.32);
    c.add([cell, shine]);
    cells.push(cell);
  }
  return {
    container: c,
    cells,
    setRatio(ratio: number) {
      const lit = Math.round(Phaser.Math.Clamp(ratio, 0, 1) * count);
      cells.forEach((cell, i) => {
        cell.setFillStyle(i < lit ? fill : UI.cell, i < lit ? 1 : 0.86);
      });
    },
  };
}

export function makeMedallion(
  scene: Phaser.Scene,
  radius: number,
  opts: MedallionOpts = {},
): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);
  const glow = scene.add.circle(0, 0, radius + 7, opts.glow ?? UI.crimsonBright, opts.glowAlpha ?? 0.16);
  const outer = scene.add.circle(0, 0, radius + 3, UI.bronzeDark, 1);
  const disc = scene.add.circle(0, 0, radius, opts.fill ?? UI.cell, 1);
  disc.setStrokeStyle(opts.ringWidth ?? 4, opts.ring ?? UI.gold, 1);
  const inner = scene.add.circle(0, 0, Math.max(4, radius - 9), opts.fill ?? UI.cell, 0);
  inner.setStrokeStyle(1, UI.bone, 0.22);
  container.add([glow, outer, disc, inner]);
  return container;
}

export function enableHit(obj: Phaser.GameObjects.Container, w: number, h: number): void {
  obj.setSize(w, h);
  obj.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);
  if (obj.input) obj.input.cursor = 'pointer';
}

export function selectionOutline(
  scene: Phaser.Scene,
  w: number,
  h: number,
  color: number = UI.goldBright,
  radius = 8,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.lineStyle(3, color, 1);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  g.lineStyle(1, 0xffffff, 0.32);
  g.strokeRoundedRect(-w / 2 + 5, -h / 2 + 5, w - 10, h - 10, Math.max(2, radius - 4));
  return g;
}

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

export function drawPixelIcon(
  scene: Phaser.Scene,
  kind: PixelIcon,
  size = 26,
  color: number = UI.bone,
): Phaser.GameObjects.Container {
  const c = scene.add.container(0, 0);
  const g = scene.add.graphics();
  const s = size / 32;
  const px = (x: number) => (x - 16) * s;
  const py = (y: number) => (y - 16) * s;

  g.lineStyle(Math.max(1, 2 * s), 0x070407, 0.8);
  g.fillStyle(color, 1);

  switch (kind) {
    case 'heart':
      g.fillCircle(px(11), py(11), 5 * s);
      g.fillCircle(px(21), py(11), 5 * s);
      g.fillTriangle(px(6), py(13), px(26), py(13), px(16), py(28));
      break;
    case 'drop':
      g.fillTriangle(px(16), py(3), px(7), py(18), px(25), py(18));
      g.fillCircle(px(16), py(18), 8 * s);
      break;
    case 'embryo':
      g.fillCircle(px(16), py(16), 12 * s);
      g.fillStyle(UI.panel, 1);
      g.fillCircle(px(19), py(13), 5 * s);
      g.lineStyle(Math.max(1, 2 * s), color, 1);
      g.strokeCircle(px(16), py(16), 8 * s);
      break;
    case 'skull':
      g.fillCircle(px(16), py(13), 10 * s);
      g.fillRect(px(9), py(18), 14 * s, 8 * s);
      g.fillStyle(UI.void, 1);
      g.fillCircle(px(12), py(13), 2.6 * s);
      g.fillCircle(px(20), py(13), 2.6 * s);
      g.fillRect(px(13), py(22), 2 * s, 4 * s);
      g.fillRect(px(18), py(22), 2 * s, 4 * s);
      break;
    case 'coin':
      g.fillCircle(px(16), py(16), 11 * s);
      g.lineStyle(Math.max(1, 2 * s), UI.goldBright, 0.9);
      g.strokeCircle(px(16), py(16), 7 * s);
      break;
    case 'sword':
      g.fillRect(px(15), py(4), 3 * s, 19 * s);
      g.fillTriangle(px(16.5), py(1), px(12), py(7), px(21), py(7));
      g.fillRect(px(8), py(22), 17 * s, 3 * s);
      g.fillRect(px(14), py(24), 5 * s, 7 * s);
      break;
    case 'shield':
      g.fillTriangle(px(6), py(6), px(26), py(6), px(16), py(29));
      g.fillStyle(UI.panelSoft, 1);
      g.fillTriangle(px(11), py(10), px(21), py(10), px(16), py(23));
      break;
    case 'bat':
      g.fillCircle(px(16), py(16), 5 * s);
      g.fillTriangle(px(12), py(14), px(2), py(8), px(7), py(23));
      g.fillTriangle(px(20), py(14), px(30), py(8), px(25), py(23));
      break;
    case 'goblin':
      g.fillCircle(px(16), py(16), 8 * s);
      g.fillTriangle(px(9), py(12), px(1), py(8), px(7), py(18));
      g.fillTriangle(px(23), py(12), px(31), py(8), px(25), py(18));
      g.fillStyle(UI.void, 1);
      g.fillCircle(px(13), py(15), 1.8 * s);
      g.fillCircle(px(19), py(15), 1.8 * s);
      break;
    case 'core':
      g.fillTriangle(px(16), py(2), px(27), py(21), px(16), py(31));
      g.fillTriangle(px(16), py(2), px(5), py(21), px(16), py(31));
      g.fillStyle(UI.arcaneBright, 0.55);
      g.fillCircle(px(16), py(18), 5 * s);
      break;
    case 'pause':
      g.fillRect(px(9), py(7), 5 * s, 18 * s);
      g.fillRect(px(18), py(7), 5 * s, 18 * s);
      break;
    case 'slash':
      g.fillTriangle(px(23), py(3), px(28), py(8), px(10), py(28));
      g.fillTriangle(px(15), py(1), px(19), py(4), px(4), py(18));
      g.fillTriangle(px(29), py(14), px(31), py(18), px(18), py(29));
      break;
    case 'orb':
      g.fillCircle(px(16), py(16), 11 * s);
      g.fillStyle(0xffffff, 0.35);
      g.fillCircle(px(12), py(11), 3 * s);
      break;
  }

  c.add(g);
  return c;
}

export function addIcon(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  kind: PixelIcon,
  x: number,
  y: number,
  size: number,
  color: number,
): Phaser.GameObjects.Container {
  const icon = drawPixelIcon(scene, kind, size, color).setPosition(x, y);
  parent.add(icon);
  return icon;
}
