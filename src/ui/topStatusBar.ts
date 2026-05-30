import Phaser from 'phaser';
import type { World, Enemy } from '../game/types';
import { RUN_RULES } from '../game/constants';
import type { StatBar } from './uiTheme';
import {
  SAFE,
  UI,
  UI_DEPTH,
  designSize,
  pixelText,
  makePanel,
  makeStatBar,
  makeMedallion,
  enableHit,
} from './uiTheme';

/**
 * Portrait HUD top bar PLACEHOLDER. A slot-machine embryo progress track, three
 * stat rows (HP / 腐血 / 胚胎值), a pause medallion, and a boss bar that surfaces
 * only while a boss is alive. All Phaser primitives, no art assets.
 */
export class TopStatusBar {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;

  private readonly slotCells: Phaser.GameObjects.Rectangle[] = [];

  private readonly hpBar: StatBar;
  private readonly expBar: StatBar;
  private readonly embryoBar: StatBar;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly expText: Phaser.GameObjects.Text;
  private readonly embryoText: Phaser.GameObjects.Text;

  private readonly bossGroup: Phaser.GameObjects.Container;
  private readonly bossBar: StatBar;

  private readonly pauseBtn: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, onPause: () => void) {
    this.scene = scene;
    const { w } = designSize(scene);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.hud);

    // Slot-machine "老虎机进度" track: skull glyph + 11 gem cells + arrow.
    const cells = 10;
    const cw = 44;
    const gap = 6;
    const startX = w / 2 - (cells * cw + (cells - 1) * gap) / 2;
    this.root.add(pixelText(scene, w / 2, 32, '老虎机进度', { size: 12, color: UI.textDim }).setOrigin(0.5));
    this.root.add(pixelText(scene, 70, 54, '☠', { size: 22, color: UI.textCrimson }).setOrigin(0.5));
    for (let i = 0; i < cells; i++) {
      const cell = scene.add
        .rectangle(startX + i * (cw + gap) + cw / 2, 54, cw, 20, UI.cell, 1)
        .setStrokeStyle(1, UI.frame, 0.9);
      this.slotCells.push(cell);
      this.root.add(cell);
    }
    this.root.add(pixelText(scene, 624, 54, '>', { size: 22, color: UI.textGold }).setOrigin(0.5));

    // HUD panel + three stat rows, root at (320,150).
    const panel = makePanel(scene, 596, 140, { border: UI.crimson }).setPosition(360, 150);
    this.root.add(panel);
    this.hpBar = makeStatBar(scene, 250, 18, UI.blood);
    this.expBar = makeStatBar(scene, 250, 18, UI.flame);
    this.embryoBar = makeStatBar(scene, 250, 18, UI.arcane);
    this.hpText = this.addRow(panel, -40, UI.blood, UI.textCrimson, 'HP', this.hpBar);
    this.expText = this.addRow(panel, 0, UI.flame, UI.textGreen, '腐血', this.expBar);
    this.embryoText = this.addRow(panel, 40, UI.arcane, UI.text, '胚胎值', this.embryoBar);

    const pauseX = w - SAFE.side - 30;

    // Pause medallion (top-right) -> onPause().
    this.pauseBtn = makeMedallion(scene, 30, { ring: UI.gold, fill: UI.panelSoft }).setPosition(pauseX, 58);
    this.pauseBtn.add(pixelText(scene, 0, 0, 'II', { size: 20, color: UI.textGold, bold: true }).setOrigin(0.5));
    enableHit(this.pauseBtn, 60, 60);
    this.pauseBtn.on('pointerdown', () => {
      scene.tweens.add({ targets: this.pauseBtn, scale: 0.86, duration: 70, yoyo: true });
      onPause();
    });
    this.root.add(this.pauseBtn);
    this.root.add(pixelText(scene, pauseX, 96, '暂停设置', { size: 12, color: UI.textDim }).setOrigin(0.5));

    // Boss bar (hidden by default).
    this.bossGroup = scene.add.container(100, 232).setVisible(false);
    this.bossGroup.add(pixelText(scene, 0, -16, '圣骑士', { size: 14, color: UI.textCrimson, bold: true }));
    this.bossBar = makeStatBar(scene, 520, 16, UI.crimsonBright);
    this.bossGroup.add(this.bossBar.container);
    this.root.add(this.bossGroup);
  }

  private addRow(
    panel: Phaser.GameObjects.Container,
    y: number,
    barColor: number,
    iconGlyphColor: string,
    label: string,
    bar: StatBar,
  ): Phaser.GameObjects.Text {
    const icon = this.scene.add.circle(-270, y, 12, UI.panelSoft, 1).setStrokeStyle(2, barColor, 1);
    panel.add(icon);
    panel.add(pixelText(this.scene, -270, y, '●', { size: 12, color: iconGlyphColor }).setOrigin(0.5));
    panel.add(pixelText(this.scene, -244, y, label, { size: 14, color: UI.textDim }).setOrigin(0, 0.5));
    bar.container.setPosition(-40, y);
    panel.add(bar.container);
    const value = pixelText(this.scene, 282, y, '', { size: 14, align: 'right' }).setOrigin(1, 0.5);
    panel.add(value);
    return value;
  }

  private static ratio(num: number, den: number): number {
    return den > 0 ? num / den : 0;
  }

  update(world: World): void {
    const p = world.player;
    const slotRatio = TopStatusBar.ratio(p.embryoValue, p.embryoMax);
    const lit = Math.round(slotRatio * this.slotCells.length);
    this.slotCells.forEach((c, i) => c.setFillStyle(i < lit ? UI.arcane : UI.cell, 1));

    this.hpBar.setRatio(TopStatusBar.ratio(p.hp, p.maxHp));
    this.hpText.setText(`${Math.round(p.hp)}/${Math.round(p.maxHp)}`);

    this.expBar.setRatio(TopStatusBar.ratio(p.exp, RUN_RULES.expToLevel));
    this.expText.setText(`${Math.round(p.exp)}/${RUN_RULES.expToLevel}`);

    this.embryoBar.setRatio(slotRatio);
    this.embryoText.setText(`${Math.round(p.embryoValue)}`);

    const boss = world.enemies.find((e: Enemy) => e.isBoss && e.alive);
    if (boss) {
      this.bossGroup.setVisible(true);
      this.bossBar.setRatio(TopStatusBar.ratio(boss.hp, boss.maxHp));
    } else {
      this.bossGroup.setVisible(false);
    }
  }

  destroy(): void {
    this.pauseBtn.off('pointerdown');
    this.root.destroy(true);
  }
}
