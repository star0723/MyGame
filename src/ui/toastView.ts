import Phaser from 'phaser';
import { DEPTHS } from '../game/constants';

export type ToastTone = 'hero' | 'system';

/** Transient top-center messages (hero shouts in blue, system lines in red).
 *  Screen-space (scrollFactor 0), max 3 on screen, the rest queue. */
export class ToastView {
  private queue: Array<{ text: string; tone: ToastTone }> = [];
  private active: Phaser.GameObjects.Text[] = [];
  private readonly maxActive = 3;

  constructor(private scene: Phaser.Scene) {}

  show(text: string, tone: ToastTone = 'system'): void {
    this.queue.push({ text, tone });
    this.pump();
  }

  private pump(): void {
    while (this.active.length < this.maxActive && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.spawn(item.text, item.tone);
    }
  }

  private spawn(text: string, tone: ToastTone): void {
    const color = tone === 'hero' ? '#9fd4ff' : '#ff8fa3';
    const label = this.scene.add
      .text(this.scene.scale.width / 2, 0, text, {
        fontFamily: 'monospace',
        fontSize: '20px',
        color,
        backgroundColor: '#1a0c14',
        padding: { x: 14, y: 6 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui)
      .setAlpha(0);
    this.active.push(label);
    this.reflow();
    this.scene.tweens.add({ targets: label, alpha: 1, duration: 180 });
    this.scene.time.delayedCall(2000, () => {
      this.scene.tweens.add({
        targets: label,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          this.active = this.active.filter((l) => l !== label);
          label.destroy();
          this.reflow();
          this.pump();
        },
      });
    });
  }

  private reflow(): void {
    this.active.forEach((label, i) => label.setPosition(this.scene.scale.width / 2, 108 + i * 40));
  }
}
