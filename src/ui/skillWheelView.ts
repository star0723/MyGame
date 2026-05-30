import Phaser from 'phaser';
import {
  UI,
  UI_DEPTH,
  addIcon,
  designSize,
  enableHit,
  makeMedallion,
  makePanel,
  pixelText,
  selectionOutline,
} from './uiTheme';

export interface SkillWheelOption {
  id: string;
  label: string;
  color: number;
  icon?: Parameters<typeof addIcon>[2];
}

const RADIUS = 82;
const NODE_ANGLES = [-135, -45, 45, 135] as const;
const DEFAULT_OPTIONS: SkillWheelOption[] = [
  { id: 'shock', label: '震荡', color: UI.goldBright, icon: 'slash' },
  { id: 'blood', label: '血爆', color: UI.blood, icon: 'drop' },
  { id: 'corrode', label: '腐蚀', color: UI.arcaneBright, icon: 'embryo' },
  { id: 'summon', label: '召唤', color: UI.flame, icon: 'skull' },
];

export class SkillWheelView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly nodeLayer: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onSelect: (id: string) => void,
    private readonly onClose?: () => void,
  ) {
    const { w, h } = designSize(scene);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.wheel).setVisible(false);
    this.backdrop = scene.add
      .rectangle(w / 2, h / 2, w, h, UI.void, 0.2)
      .setInteractive({ useHandCursor: false });
    this.backdrop.on('pointerdown', () => this.hide());
    this.nodeLayer = scene.add.container(0, 0);
    this.root.add([this.backdrop, this.nodeLayer]);
  }

  showAt(x: number, y: number, options?: SkillWheelOption[]): void {
    const { w, h } = designSize(this.scene);
    const cx = Phaser.Math.Clamp(x, 206, w - 152);
    const cy = Phaser.Math.Clamp(y, 348, h - 318);

    this.clearNodes();
    const panel = makePanel(this.scene, 242, 178, {
      fill: UI.ink,
      border: UI.bronze,
      borderWidth: 2,
      radius: 12,
      ornate: true,
    }).setPosition(cx, cy);
    const callout = pixelText(this.scene, cx - 112, cy - 110, '点击怪物\n打开技能轮盘', {
      size: 16,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const pointer = this.scene.add.triangle(cx - 88, cy - 72, 0, 0, 26, 8, 0, 16, UI.bronze, 0.95);
    this.nodeLayer.add([panel, callout, pointer]);
    this.buildHub(cx, cy);

    (options ?? DEFAULT_OPTIONS).slice(0, 4).forEach((opt, i) => {
      const ang = Phaser.Math.DegToRad(NODE_ANGLES[i]);
      this.buildNode(opt, cx + Math.cos(ang) * RADIUS, cy + Math.sin(ang) * RADIUS * 0.68);
    });

    this.root.setVisible(true);
  }

  hide(): void {
    const wasVisible = this.root.visible;
    this.clearNodes();
    this.root.setVisible(false);
    if (wasVisible) this.onClose?.();
  }

  isVisible(): boolean {
    return this.root.visible;
  }

  destroy(): void {
    this.clearNodes();
    this.backdrop.removeAllListeners();
    this.root.destroy(true);
  }

  private buildHub(x: number, y: number): void {
    const hub = makeMedallion(this.scene, 26, {
      fill: UI.panel,
      ring: UI.gold,
      glow: UI.crimsonBright,
      glowAlpha: 0.18,
    }).setPosition(x, y);
    const label = pixelText(this.scene, x, y, '技', {
      size: 18,
      color: UI.textGold,
      align: 'center',
      bold: true,
    }).setOrigin(0.5);
    this.nodeLayer.add([hub, label]);
  }

  private buildNode(opt: SkillWheelOption, x: number, y: number): void {
    const node = makeMedallion(this.scene, 31, {
      fill: UI.cellDark,
      ring: opt.color,
      ringWidth: 4,
      glow: opt.color,
      glowAlpha: 0.2,
    }).setPosition(x, y);
    enableHit(node, 68, 68);
    addIcon(this.scene, node, opt.icon ?? 'orb', 0, -3, 28, opt.color);

    const label = pixelText(this.scene, x, y + 42, opt.label, {
      size: 12,
      color: UI.textDim,
      align: 'center',
      bold: true,
    }).setOrigin(0.5);
    const outline = selectionOutline(this.scene, 72, 72, opt.color, 36).setPosition(x, y).setVisible(false);
    const hit = this.scene.add.rectangle(x, y + 10, 78, 92, UI.void, 0.001).setInteractive({ useHandCursor: true });

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

    node.on('pointerover', showHover);
    node.on('pointerout', hideHover);
    node.on('pointerdown', press);
    hit.on('pointerover', showHover);
    hit.on('pointerout', hideHover);
    hit.on('pointerdown', press);
    this.nodeLayer.add([outline, node, label, hit]);
  }

  private clearNodes(): void {
    this.scene.tweens.killTweensOf(this.nodeLayer.list);
    this.nodeLayer.removeAll(true);
  }
}
