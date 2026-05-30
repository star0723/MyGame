import Phaser from 'phaser';
import type { EliteUpgradeDefinition } from '../game/types';
import { SAFE, UI, UI_DEPTH, designSize, makePanel, pixelText } from './uiTheme';

export class EliteUpgradeView {
  private container: Phaser.GameObjects.Container;

  constructor(
    private scene: Phaser.Scene,
    private onPick: (upgrade: EliteUpgradeDefinition) => void,
  ) {
    const { w, h } = designSize(scene);
    this.container = scene.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(UI_DEPTH.slot + 10).setVisible(false);
    const backdrop = scene.add.rectangle(0, 0, w, h, UI.void, 0.78).setInteractive({ useHandCursor: false });
    const panel = makePanel(scene, w - SAFE.side * 2, 760, { fill: UI.panel, border: UI.gold, borderWidth: 4 });
    const title = pixelText(scene, 0, -304, '升格祭坛', {
      size: 38,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const subtitle = pixelText(scene, 0, -254, '选择升格对象', {
      size: 18,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5);
    this.container.add([backdrop, panel, title, subtitle]);
  }

  show(options: EliteUpgradeDefinition[], cost: number): void {
    this.clearOptions();
    this.container.setVisible(true);

    const costText = pixelText(this.scene, 0, -214, `消耗 ${cost} 腐血筹码`, {
      size: 18,
      color: UI.text,
      align: 'center',
    }).setOrigin(0.5);
    this.container.add(costText);

    const cardW = 252;
    const cardH = 300;
    const gap = 28;
    const totalW = options.length * cardW + Math.max(0, options.length - 1) * gap;
    const startX = -totalW / 2 + cardW / 2;

    options.slice(0, 2).forEach((upgrade, index) => {
      const x = startX + index * (cardW + gap);
      this.buildCard(x, 42, cardW, cardH, upgrade);
    });
  }

  hide(): void {
    this.clearOptions();
    this.container.setVisible(false);
  }

  private buildCard(x: number, y: number, w: number, h: number, upgrade: EliteUpgradeDefinition): void {
    const card = makePanel(this.scene, w, h, { fill: UI.slotFill, border: UI.gold, borderWidth: 3 }).setPosition(x, y);
    const medallion = this.scene.add.circle(x, y - 92, 42, UI.crimsonBright, 1).setStrokeStyle(4, UI.goldBright, 1);
    const glyph = pixelText(this.scene, x, y - 94, upgrade.name.charAt(0), {
      size: 34,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const name = pixelText(this.scene, x, y - 36, upgrade.name, {
      size: 22,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const title = pixelText(this.scene, x, y - 4, upgrade.title, {
      size: 16,
      color: UI.textGreen,
      align: 'center',
    }).setOrigin(0.5);
    const desc = pixelText(this.scene, x, y + 46, upgrade.description, {
      size: 15,
      color: UI.text,
      align: 'center',
    }).setOrigin(0.5, 0);
    desc.setWordWrapWidth(w - 38, true);
    const traits = pixelText(this.scene, x, y + 122, upgrade.traits.join(' / '), {
      size: 14,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(x, y, w, h, UI.void, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.onPick(upgrade));
    this.container.add([card, medallion, glyph, name, title, desc, traits, hit]);
  }

  private clearOptions(): void {
    const children = this.container.getAll().slice(4);
    children.forEach((child) => child.destroy());
  }
}
