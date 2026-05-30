import Phaser from 'phaser';
import { UI, UI_DEPTH, designSize, makePanel, pixelText } from './uiTheme';

export type ToastTone = 'hero' | 'system';

export class ToastView {
  private queue: Array<{ text: string; tone: ToastTone }> = [];
  private active: Phaser.GameObjects.Container[] = [];
  private readonly maxActive = 3;

  constructor(private readonly scene: Phaser.Scene) {}

  show(text: string, tone: ToastTone = 'system'): void {
    this.queue.push({ text, tone });
    this.pump();
  }

  clear(): void {
    this.queue = [];
    const active = [...this.active];
    this.active = [];
    active.forEach((toast) => {
      this.scene.tweens.killTweensOf(toast);
      toast.destroy(true);
    });
  }

  private pump(): void {
    while (this.active.length < this.maxActive && this.queue.length > 0) {
      const item = this.queue.shift()!;
      this.spawn(item.text, item.tone);
    }
  }

  private spawn(text: string, tone: ToastTone): void {
    const { w } = designSize(this.scene);
    const color = tone === 'hero' ? UI.textGold : UI.textCrimson;
    const border = tone === 'hero' ? UI.gold : UI.crimson;
    const label = pixelText(this.scene, 0, 0, text, {
      size: 18,
      color,
      bold: tone === 'hero',
      align: 'center',
      wordWrap: 420,
    }).setOrigin(0.5);
    const width = Math.min(520, Math.max(220, label.width + 34));
    const panel = makePanel(this.scene, width, label.height + 20, {
      fill: UI.ink,
      border,
      borderWidth: 2,
      radius: 6,
      ornate: false,
    });
    const toast = this.scene.add.container(w / 2, 0, [panel, label]).setScrollFactor(0).setDepth(UI_DEPTH.overlay).setAlpha(0);
    this.active.push(toast);
    this.reflow();
    this.scene.tweens.add({ targets: toast, alpha: 1, y: toast.y + 8, duration: 160, ease: 'Quad.easeOut' });
    this.scene.time.delayedCall(1400, () => {
      if (!toast.active) return;
      this.scene.tweens.add({
        targets: toast,
        alpha: 0,
        y: toast.y - 8,
        duration: 360,
        onComplete: () => {
          this.active = this.active.filter((l) => l !== toast);
          toast.destroy(true);
          this.reflow();
          this.pump();
        },
      });
    });
  }

  private reflow(): void {
    this.active.forEach((label, i) => label.setPosition(designSize(this.scene).w / 2, 316 + i * 46));
  }
}
