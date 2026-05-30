import Phaser from 'phaser';
import type { EliteUpgradeDefinition } from '../game/types';
import {
  SAFE,
  UI,
  UI_DEPTH,
  addIcon,
  designSize,
  makeMedallion,
  makePanel,
  pixelText,
} from './uiTheme';

export class EliteUpgradeView {
  private readonly container: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onPick: (upgrade: EliteUpgradeDefinition) => void,
  ) {
    const { w, h } = designSize(scene);
    this.container = scene.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(UI_DEPTH.slot + 10).setVisible(false);
    const backdrop = scene.add.rectangle(0, 0, w, h, UI.void, 0.78).setInteractive({ useHandCursor: false });
    const panel = makePanel(scene, w - SAFE.side * 2, 740, {
      fill: UI.ink,
      border: UI.arcaneBright,
      borderWidth: 4,
      radius: 10,
      ornate: true,
    });
    const title = pixelText(scene, 0, -304, '晋升精英', {
      size: 38,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const subtitle = pixelText(scene, 0, -254, '选择一个友方小怪成为精英单位', {
      size: 18,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5);
    this.container.add([backdrop, panel, title, subtitle]);
  }

  show(options: EliteUpgradeDefinition[], cost: number): void {
    this.clearOptions();
    this.container.setVisible(true);

    const costText = pixelText(this.scene, 0, -214, `消耗 ${cost} 腐血晋升`, {
      size: 18,
      color: UI.textCrimson,
      align: 'center',
      bold: true,
    }).setOrigin(0.5);
    this.container.add(costText);

    const cardW = 254;
    const cardH = 312;
    const gap = 28;
    const totalW = Math.min(options.length, 2) * cardW + Math.max(0, Math.min(options.length, 2) - 1) * gap;
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
    const card = makePanel(this.scene, w, h, {
      fill: UI.cellDark,
      border: UI.arcaneBright,
      borderWidth: 3,
      radius: 8,
      ornate: true,
    }).setPosition(x, y);
    const medallion = makeMedallion(this.scene, 44, {
      fill: UI.arcaneDim,
      ring: UI.arcaneBright,
      ringWidth: 4,
      glow: UI.arcaneBright,
      glowAlpha: 0.2,
    }).setPosition(x, y - 96);
    addIcon(this.scene, medallion, upgrade.sourceKind === 'bat' ? 'bat' : upgrade.sourceKind === 'goblin' ? 'goblin' : 'skull', 0, 0, 36, UI.goldBright);

    const name = pixelText(this.scene, x, y - 34, upgrade.name, {
      size: 22,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const title = pixelText(this.scene, x, y - 2, upgrade.title, {
      size: 16,
      color: UI.textPurple,
      align: 'center',
      bold: true,
    }).setOrigin(0.5);
    const desc = pixelText(this.scene, x, y + 42, upgrade.description, {
      size: 15,
      color: UI.text,
      align: 'center',
      wordWrap: w - 38,
    }).setOrigin(0.5, 0);
    const traits = pixelText(this.scene, x, y + 128, upgrade.traits.join(' / '), {
      size: 13,
      color: UI.textDim,
      align: 'center',
      wordWrap: w - 38,
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(x, y, w, h, UI.void, 0.001).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => this.onPick(upgrade));
    this.container.add([card, medallion, name, title, desc, traits, hit]);
  }

  private clearOptions(): void {
    const children = this.container.getAll().slice(4);
    children.forEach((child) => child.destroy());
  }
}

