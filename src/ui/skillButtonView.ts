import Phaser from 'phaser';
import { SAFE, UI, UI_DEPTH, designSize, makeMedallion, pixelText } from './uiTheme';
import type { World } from '../game/types';

/**
 * "震荡" skill medallion (bottom-right): a crimson disc with a gold slash glyph
 * in an ornate gold ring. A radial cooldown sweep (dark wedge from the top)
 * dims it while the shockwave is recharging. PLACEHOLDER art only.
 */
export class SkillButtonView {
  private readonly scene: Phaser.Scene;
  private readonly onPress: () => void;
  private readonly root: Phaser.GameObjects.Container;
  private readonly disc: Phaser.GameObjects.Arc;
  private readonly glyph: Phaser.GameObjects.Text;
  private readonly sweep: Phaser.GameObjects.Graphics;
  private readonly radius = 60;
  private ratio = 0;

  constructor(scene: Phaser.Scene, onPress: () => void, opts: { label?: string } = {}) {
    this.scene = scene;
    this.onPress = onPress;

    const { w, h } = designSize(scene);
    const cx = w - SAFE.side - this.radius - 10;
    const cy = h - SAFE.bottom - this.radius - 24;
    this.root = scene.add.container(cx, cy).setScrollFactor(0).setDepth(UI_DEPTH.skillButton);

    const medallion = makeMedallion(scene, this.radius, {
      fill: UI.crimsonBright,
      ring: UI.gold,
      ringWidth: 5,
      glow: UI.blood,
    });

    this.glyph = pixelText(scene, 0, 0, '⚡', {
      size: 36,
      color: UI.textGold,
      align: 'center',
    }).setOrigin(0.5);

    this.sweep = scene.add.graphics();

    const label = pixelText(scene, 0, this.radius + 18, opts.label ?? '震荡', {
      size: 16,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);

    // The disc itself is the hit target (matches the medallion's inner circle).
    this.disc = scene.add
      .circle(0, 0, this.radius, UI.crimsonBright, 0)
      .setInteractive({ useHandCursor: true });
    this.disc.on('pointerdown', () => this.handlePress());

    this.root.add([medallion, this.glyph, this.sweep, label, this.disc]);
    this.setCooldownRatio(0);
  }

  update(world: World): void {
    const cd = world.player.shockwaveCooldown || 1;
    this.setCooldownRatio(world.player.shockwaveTimer / cd);
  }

  setCooldownRatio(ratio: number): void {
    this.ratio = Phaser.Math.Clamp(ratio, 0, 1);
    const ready = this.ratio <= 0;

    this.glyph.setColor(ready ? UI.textGold : UI.textDim);

    this.sweep.clear();
    if (!ready) {
      // Dim the whole disc, then carve a dark wedge sweeping clockwise from top.
      this.sweep.fillStyle(UI.void, 0.35);
      this.sweep.fillCircle(0, 0, this.radius - 2);
      const start = -Math.PI / 2;
      const end = start + this.ratio * Math.PI * 2;
      this.sweep.fillStyle(UI.void, 0.78);
      this.sweep.slice(0, 0, this.radius - 2, start, end, false);
      this.sweep.fillPath();
    }
  }

  private handlePress(): void {
    if (this.ratio <= 0) {
      this.onPress();
      this.scene.tweens.add({
        targets: this.root,
        scale: 1.08,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    } else {
      // Cooling: tiny shake on the whole button cluster.
      this.scene.tweens.add({
        targets: this.root,
        x: this.root.x + 4,
        duration: 45,
        yoyo: true,
        repeat: 1,
      });
    }
  }

  destroy(): void {
    this.disc.removeAllListeners();
    this.scene.tweens.killTweensOf(this.glyph);
    this.scene.tweens.killTweensOf(this.sweep);
    this.root.destroy(true);
  }
}
