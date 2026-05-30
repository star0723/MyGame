import Phaser from 'phaser';
import type { DemonFormDefinition } from '../game/types';
import { SLOT_SYMBOLS } from '../data/slotSymbols';
import { chooseOne } from '../utils/math';
import { designSize } from './uiTheme';

export class AwakeningView {
  private container: Phaser.GameObjects.Container;
  private title: Phaser.GameObjects.Text;
  private subtitle: Phaser.GameObjects.Text;
  private reels: Phaser.GameObjects.Text[] = [];
  private spinTimer?: Phaser.Time.TimerEvent;

  constructor(private scene: Phaser.Scene) {
    const { w, h } = designSize(scene);
    const cx = w / 2;
    const cy = h / 2;
    this.container = scene.add.container(cx, cy).setDepth(13000).setVisible(false);
    const veil = scene.add.rectangle(0, 0, w, h, 0x050107, 0.86);
    this.title = scene.add
      .text(0, -120, '', { fontFamily: 'monospace', fontSize: '46px', color: '#ff4978' })
      .setOrigin(0.5);
    this.subtitle = scene.add
      .text(0, 96, '', { fontFamily: 'monospace', fontSize: '22px', color: '#ffe8b8' })
      .setOrigin(0.5);
    this.container.add([veil, this.title, this.subtitle]);

    const reelX = [-190, 0, 190];
    for (let i = 0; i < 3; i += 1) {
      const reel = scene.add
        .text(reelX[i], 0, '？', {
          fontFamily: 'monospace',
          fontSize: '56px',
          color: '#ffd1d9',
          backgroundColor: '#1b0a12',
          padding: { x: 18, y: 12 },
        })
        .setOrigin(0.5);
      this.reels.push(reel);
      this.container.add(reel);
    }
  }

  showRolling(): void {
    this.container.setVisible(true);
    this.title.setText('最终开奖中...');
    this.subtitle.setText('[ 主种族 ]   [ 器官 ]   [ 权能 ]');
    this.spinTimer?.remove();
    this.spinTimer = this.scene.time.addEvent({
      delay: 80,
      loop: true,
      callback: () => this.reels.forEach((r) => r.setText(chooseOne(SLOT_SYMBOLS))),
    });
  }

  showResult(form: DemonFormDefinition): void {
    this.spinTimer?.remove();
    this.spinTimer = undefined;
    this.reels.forEach((r) => r.setText(chooseOne(SLOT_SYMBOLS)));
    this.title.setText(form.name);
    this.subtitle.setText(form.subtitle);
  }

  hide(): void {
    this.spinTimer?.remove();
    this.spinTimer = undefined;
    this.container.setVisible(false);
  }
}
