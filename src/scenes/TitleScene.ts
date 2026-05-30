import Phaser from 'phaser';
import { COLORS } from '../game/constants';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(COLORS.void);

    this.add.rectangle(width / 2, height / 2, width, height, 0x0b0710, 1);
    for (let i = 0; i < 22; i += 1) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const radius = Phaser.Math.Between(3, 9);
      this.add.circle(x, y, radius, 0x5b1027, Phaser.Math.FloatBetween(0.25, 0.65));
    }

    this.add
      .text(width / 2, 170, '噬主：魔王胚胎', {
        fontFamily: 'monospace',
        fontSize: '54px',
        color: '#ffd1d9',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 252, '用勇者当筹码，靠老虎机孵化魔王', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#fff0d1',
      })
      .setOrigin(0.5);

    const start = this.add
      .text(width / 2, 420, '点击开始', {
        fontFamily: 'monospace',
        fontSize: '30px',
        color: '#ffe8b8',
        backgroundColor: '#5a1029',
        padding: { x: 28, y: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    start.on('pointerdown', () => {
      this.scene.start('GameScene');
      this.scene.launch('UIScene');
    });

    this.add
      .text(width / 2, 548, 'WASD/方向键 或 左屏摇杆移动  |  Q/右下按钮 血肉震荡  |  腐血满后开奖', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#cdb7b7',
      })
      .setOrigin(0.5);
  }
}
