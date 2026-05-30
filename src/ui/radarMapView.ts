import Phaser from 'phaser';
import type { World } from '../game/types';
import { LAYOUT, UI, UI_DEPTH, makePanel, pixelText } from './uiTheme';

/** Optional standalone right-side radar/minimap replica. Not wired into main chain. */
export class RadarMapView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly dots: Phaser.GameObjects.Arc[] = [];

  constructor(scene: Phaser.Scene) {
    const panel = makePanel(scene, LAYOUT.radar.w, LAYOUT.radar.h, {
      fill: UI.ink,
      border: UI.bronze,
      borderWidth: 2,
      radius: 12,
      ornate: true,
    });
    this.root = scene.add.container(LAYOUT.radar.x, LAYOUT.radar.y, [panel]).setScrollFactor(0).setDepth(UI_DEPTH.radar);
    const grid = scene.add.graphics();
    grid.lineStyle(1, UI.stoneLine, 0.45);
    for (let y = -72; y <= 72; y += 36) grid.lineBetween(-18, y, 18, y);
    grid.lineBetween(0, -82, 0, 82);
    this.root.add(grid);
    this.root.add(pixelText(scene, 0, -108, '雷达', { size: 10, color: UI.textGold, bold: true }).setOrigin(0.5));
    this.root.add(scene.add.circle(0, 0, 4, UI.arcaneBright, 1).setStrokeStyle(1, UI.bone, 0.8));
    for (let i = 0; i < 18; i++) {
      const dot = scene.add.circle(0, 0, 2, UI.bone, 0.9).setVisible(false);
      this.dots.push(dot);
      this.root.add(dot);
    }
  }

  update(world: World): void {
    const px = world.player.x;
    const py = world.player.y;
    const enemies = world.enemies.filter((e) => e.alive).slice(0, this.dots.length);
    this.dots.forEach((dot, index) => {
      const enemy = enemies[index];
      dot.setVisible(Boolean(enemy));
      if (!enemy) return;
      dot.setPosition(
        Phaser.Math.Clamp((enemy.x - px) / 900, -1, 1) * 22,
        Phaser.Math.Clamp((enemy.y - py) / 1300, -1, 1) * 78,
      );
      dot.setFillStyle(enemy.isBoss ? UI.goldBright : UI.crimsonBright, enemy.isBoss ? 1 : 0.9);
      dot.setScale(enemy.isBoss ? 1.8 : 1);
    });
  }

  destroy(): void {
    this.root.destroy(true);
  }
}

