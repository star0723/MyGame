import Phaser from 'phaser';
import { UI, UI_DEPTH, addIcon, designSize, enableHit, makePanel, pixelText } from './uiTheme';

export class PauseSettingsView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly resumeButton: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, onResume: () => void) {
    const { w, h } = designSize(scene);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.overlay).setVisible(false);

    const backdrop = scene.add.rectangle(w / 2, h / 2, w, h, UI.void, 0.74).setInteractive({ useHandCursor: false });
    const panel = makePanel(scene, 544, 388, {
      fill: UI.ink,
      border: UI.gold,
      borderWidth: 3,
      radius: 10,
      ornate: true,
    }).setPosition(w / 2, h / 2);
    const pauseIcon = scene.add.container(w / 2, h / 2 - 132);
    addIcon(scene, pauseIcon, 'pause', 0, 0, 46, UI.goldBright);
    const title = pixelText(scene, w / 2, h / 2 - 82, '暂停设置', {
      size: 34,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const hint = pixelText(scene, w / 2, h / 2 - 24, '战斗已暂停', {
      size: 22,
      color: UI.text,
      align: 'center',
    }).setOrigin(0.5);
    const detail = pixelText(scene, w / 2, h / 2 + 28, '点击继续按钮返回战斗', {
      size: 18,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5);

    this.resumeButton = makePanel(scene, 294, 72, {
      fill: UI.crimson,
      border: UI.goldBright,
      borderWidth: 3,
      radius: 8,
      ornate: false,
    }).setPosition(w / 2, h / 2 + 124);
    enableHit(this.resumeButton, 294, 72);
    const resumeLabel = pixelText(scene, w / 2, h / 2 + 124, '继续游戏', {
      size: 23,
      color: UI.text,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const resumeHit = scene.add.rectangle(w / 2, h / 2 + 124, 294, 72, UI.void, 0.001).setInteractive({ useHandCursor: true });

    const resume = (): void => onResume();
    this.resumeButton.on('pointerdown', resume);
    resumeHit.on('pointerdown', resume);
    this.root.add([backdrop, panel, pauseIcon, title, hint, detail, this.resumeButton, resumeLabel, resumeHit]);
  }

  show(): void {
    this.root.setVisible(true);
  }

  hide(): void {
    this.root.setVisible(false);
  }

  isVisible(): boolean {
    return this.root.visible;
  }

  destroy(): void {
    this.resumeButton.removeAllListeners();
    this.root.destroy(true);
  }
}

