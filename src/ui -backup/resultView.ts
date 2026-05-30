import Phaser from 'phaser';
import type { World } from '../game/types';
import { SAFE, UI, addIcon, designSize, makePanel, pixelText } from './uiTheme';

export class ResultView {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly world: World,
  ) {}

  create(): void {
    const { w, h } = designSize(this.scene);
    this.scene.add.rectangle(w / 2, h / 2, w, h, UI.void, 1);
    const panel = makePanel(this.scene, w - SAFE.side * 2, 820, {
      fill: UI.ink,
      border: UI.gold,
      borderWidth: 3,
      radius: 10,
      ornate: true,
    }).setPosition(w / 2, h / 2);
    addIcon(this.scene, panel, 'skull', 0, -330, 70, UI.goldBright);

    this.scene.add
      .text(w / 2, SAFE.top + 92, '屠戮报告', {
        fontFamily: 'monospace',
        fontSize: '44px',
        color: UI.textGold,
        fontStyle: 'bold',
        stroke: '#050308',
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const defeated = this.world.stats.bossDefeated ? '已击败' : '未击败';
    const rating = this.world.stats.bossDefeated ? '终末魔王' : '灾厄胚胎';
    const rows = [
      ['击杀勇者数', this.world.stats.kills],
      ['吞噬腐血量', this.world.stats.bloodCollected],
      ['消耗腐血筹码', this.world.stats.chipsSpent],
      ['晋升精英小怪', this.world.stats.eliteUpgrades],
      ['最高连击', this.world.stats.maxCombo],
      ['献祭小怪', this.world.stats.sacrifices],
      ['孵化魔王形态', this.world.demon.name ?? '未孵化'],
      ['圣骑士', defeated],
      ['评级', rating],
    ] as const;

    const startY = SAFE.top + 196;
    rows.forEach(([label, value], index) => {
      const y = startY + index * 58;
      const row = makePanel(this.scene, 548, 42, {
        fill: index % 2 === 0 ? UI.cellDark : UI.panelSoft,
        border: UI.bronzeDark,
        borderWidth: 1,
        radius: 5,
        ornate: false,
        inner: false,
      }).setPosition(w / 2, y);
      pixelText(this.scene, w / 2 - 246, y, String(label), {
        size: 17,
        color: UI.textDim,
        bold: true,
      }).setOrigin(0, 0.5);
      pixelText(this.scene, w / 2 + 246, y, String(value), {
        size: 18,
        color: label === '评级' ? UI.textGold : UI.text,
        bold: label === '评级',
        align: 'right',
      }).setOrigin(1, 0.5);
    });

    pixelText(this.scene, w / 2, h - SAFE.bottom - 86, '点击任意位置重新开始', {
      size: 22,
      color: UI.textCrimson,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);

    const restartHit = this.scene.add.rectangle(w / 2, h / 2, w, h, UI.void, 0).setInteractive({ useHandCursor: true });
    restartHit.on('pointerdown', () => {
      this.scene.scene.start('TitleScene');
    });
  }
}
