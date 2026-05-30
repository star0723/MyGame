import Phaser from 'phaser';
import type { World } from '../game/types';
import { SAFE, designSize } from './uiTheme';

export class ResultView {
  constructor(
    private scene: Phaser.Scene,
    private world: World,
  ) {}

  create(): void {
    const { w, h } = designSize(this.scene);
    this.scene.add.rectangle(w / 2, h / 2, w, h, 0x0b0710, 1);
    this.scene.add
      .text(w / 2, SAFE.top + 70, '屠杀报告', {
        fontFamily: 'monospace',
        fontSize: '46px',
        color: '#ffd1d9',
      })
      .setOrigin(0.5);

    const defeated = this.world.stats.bossDefeated ? '已击败' : '未击败';
    const rating = this.world.stats.bossDefeated ? '终末魔王' : '灾厄胚胎';
    const body = [
      `击杀勇者数：${this.world.stats.kills}`,
      `吞噬腐血量：${this.world.stats.bloodCollected}`,
      `消耗腐血筹码：${this.world.stats.chipsSpent}`,
      `升格精英小怪：${this.world.stats.eliteUpgrades}`,
      `最高连击：${this.world.stats.maxCombo}`,
      `献祭小怪：${this.world.stats.sacrifices}`,
      `孵化魔王形态：${this.world.demon.name ?? '未孵化'}`,
      `圣骑士：${defeated}`,
      `评级：${rating}`,
      '',
      '点击重新开始',
    ].join('\n');

    const restartHit = this.scene.add.rectangle(w / 2, h / 2, w, h, 0x000000, 0).setInteractive({ useHandCursor: true });
    restartHit.on('pointerdown', () => {
      this.scene.scene.start('TitleScene');
    });

    const report = this.scene.add
      .text(w / 2, SAFE.top + 190, body, {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#fff0d1',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: w - SAFE.side * 4, useAdvancedWrap: true },
      })
      .setOrigin(0.5, 0);
  }
}
