import Phaser from 'phaser';
import {
  UI,
  UI_DEPTH,
  designSize,
  pixelText,
  makeMedallion,
  selectionOutline,
  enableHit,
} from './uiTheme';

export interface SkillWheelOption {
  id: string;
  label: string;
  color: number;
  glyph?: string;
}

/**
 * Radial 4-skill wheel placeholder. Tapping a minion ("点击小怪" / "描边选中")
 * pops this open at the tap point: a center "技能" hub + 4 nodes at N/E/S/W,
 * color-coded toxic-green / blood / arcane-purple / bone. A full-screen backdrop
 * sits just below the nodes and catches a tap to dismiss. All primitives, no art.
 * Nodes rebuild on every {@link showAt}.
 */
const RADIUS = 118;
const NODE_ANGLES = [-90, 0, 90, 180] as const;
const DEFAULT_OPTIONS: SkillWheelOption[] = [
  { id: 'shock', label: '震荡', color: UI.flame, glyph: '震' },
  { id: 'blood', label: '血爆', color: UI.blood, glyph: '爆' },
  { id: 'corrode', label: '腐蚀', color: UI.arcane, glyph: '蚀' },
  { id: 'summon', label: '召唤', color: UI.bone, glyph: '唤' },
];

export class SkillWheelView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly nodeLayer: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onSelect: (id: string) => void,
  ) {
    const { w, h } = designSize(scene);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.wheel).setVisible(false);

    // Full-screen catcher, placed below the node layer so a tap off any node dismisses.
    this.backdrop = scene.add
      .rectangle(w / 2, h / 2, w, h, UI.void, 0.55)
      .setInteractive({ useHandCursor: false });
    this.backdrop.on('pointerdown', () => this.hide());

    this.nodeLayer = scene.add.container(0, 0);
    this.root.add([this.backdrop, this.nodeLayer]);
  }

  showAt(x: number, y: number, options?: SkillWheelOption[]): void {
    const { w, h } = designSize(this.scene);
    // Clamp the center so every node (at RADIUS) stays in [60, w-60] x [120, h-120].
    const cx = Phaser.Math.Clamp(x, 60 + RADIUS, w - 60 - RADIUS);
    const cy = Phaser.Math.Clamp(y, 120 + RADIUS, h - 120 - RADIUS);

    this.clearNodes();
    this.buildHub(cx, cy);
    (options ?? DEFAULT_OPTIONS).slice(0, 4).forEach((opt, i) => {
      const ang = Phaser.Math.DegToRad(NODE_ANGLES[i]);
      this.buildNode(opt, cx + Math.cos(ang) * RADIUS, cy + Math.sin(ang) * RADIUS);
    });

    this.root.setVisible(true);
  }

  hide(): void {
    this.clearNodes();
    this.root.setVisible(false);
  }

  destroy(): void {
    this.clearNodes();
    this.backdrop.removeAllListeners();
    this.root.destroy(true);
  }

  private buildHub(x: number, y: number): void {
    const hub = makeMedallion(this.scene, 34, { fill: UI.panel, ring: UI.gold, glow: UI.crimsonBright });
    hub.setPosition(x, y);
    const label = pixelText(this.scene, x, y, '技能', { size: 16, color: UI.textGold, align: 'center' }).setOrigin(0.5);
    this.nodeLayer.add([hub, label]);
  }

  private buildNode(opt: SkillWheelOption, x: number, y: number): void {
    const node = makeMedallion(this.scene, 42, { fill: UI.slotFill, ring: opt.color, glow: opt.color });
    node.setPosition(x, y);
    enableHit(node, 84, 84);

    const glyph = pixelText(this.scene, x, y - 4, opt.glyph ?? opt.label.charAt(0), {
      size: 26,
      color: UI.text,
      align: 'center',
      bold: true,
    }).setOrigin(0.5);
    const label = pixelText(this.scene, x, y + 58, opt.label, {
      size: 15,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5);

    // "描边选中" highlight, hover-only.
    const outline = selectionOutline(this.scene, 96, 96, opt.color, 48).setPosition(x, y).setVisible(false);

    const press = (): void => {
      this.scene.tweens.add({ targets: node, scale: 0.88, duration: 70, yoyo: true, ease: 'Quad.easeOut' });
      this.onSelect(opt.id);
      this.hide();
    };
    const showHover = (): void => {
      outline.setVisible(true);
      label.setColor(UI.textGold);
    };
    const hideHover = (): void => {
      outline.setVisible(false);
      label.setColor(UI.textDim);
    };
    const hit = this.scene.add.rectangle(x, y + 16, 104, 136, UI.void, 0.001).setInteractive({ useHandCursor: true });

    node.on('pointerover', showHover);
    node.on('pointerout', hideHover);
    node.on('pointerdown', press);
    hit.on('pointerover', showHover);
    hit.on('pointerout', hideHover);
    hit.on('pointerdown', press);

    this.nodeLayer.add([outline, node, glyph, label, hit]);
  }

  private clearNodes(): void {
    this.scene.tweens.killTweensOf(this.nodeLayer.list);
    this.nodeLayer.removeAll(true);
  }
}
