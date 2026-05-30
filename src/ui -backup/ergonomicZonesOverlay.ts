import Phaser from 'phaser';
import { UI, UI_DEPTH, dashedArc, designSize, pixelText } from './uiTheme';

export class ErgonomicZonesOverlay {
  private readonly root: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    const { w } = designSize(scene);
    const cx = w / 2;
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.zones);
    this.root.setVisible(false);

    const avoid = scene.add.rectangle(0, 0, w, 300, UI.zoneAvoid, 0.1).setOrigin(0, 0);
    const stretch = scene.add.rectangle(0, 300, w, 460, UI.zoneStretch, 0.08).setOrigin(0, 0);
    const thumb = scene.add.rectangle(0, 760, w, 520, UI.zoneThumb, 0.1).setOrigin(0, 0);
    this.root.add([avoid, stretch, thumb]);

    const arcs = scene.add.graphics();
    dashedArc(arcs, 632, 1230, 520, 150, 270, UI.zoneStretch, 2);
    dashedArc(arcs, 632, 1230, 980, 150, 270, UI.zoneThumb, 2);
    this.root.add(arcs);

    this.root.add([
      pixelText(scene, cx, 150, '避免高频点击区', {
        size: 20,
        color: UI.textCrimson,
        align: 'center',
      }).setOrigin(0.5),
      pixelText(scene, 250, 520, '拉伸区 / 可触达', {
        size: 20,
        color: UI.textGold,
        align: 'center',
      }).setOrigin(0.5),
      pixelText(scene, cx, 650, '技能轮盘区', {
        size: 16,
        color: UI.textDim,
        align: 'center',
      }).setOrigin(0.5),
      pixelText(scene, cx, 1000, '拇指拖拽移动区', {
        size: 22,
        color: UI.textGreen,
        align: 'center',
      }).setOrigin(0.5),
      pixelText(scene, cx, 1252, '右手拇指友好布局', {
        size: 14,
        color: UI.textDim,
        align: 'center',
      }).setOrigin(0.5),
    ]);
  }

  setVisible(visible: boolean): void {
    this.root.setVisible(visible);
  }

  toggle(): void {
    this.root.setVisible(!this.root.visible);
  }

  isVisible(): boolean {
    return this.root.visible;
  }

  destroy(): void {
    this.root.destroy();
  }
}
