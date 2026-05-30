import Phaser from 'phaser';
import { UI, UI_DEPTH, designSize, makePanel, pixelText, enableHit } from './uiTheme';

export class PauseSettingsView {
  private readonly root: Phaser.GameObjects.Container;
  private readonly resumeButton: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, onResume: () => void) {
    const { w, h } = designSize(scene);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.overlay).setVisible(false);

    const backdrop = scene.add.rectangle(w / 2, h / 2, w, h, UI.void, 0.74).setInteractive({ useHandCursor: false });
    const panel = makePanel(scene, 560, 420, { fill: UI.panel, border: UI.gold, borderWidth: 3 }).setPosition(w / 2, h / 2);
    const title = pixelText(scene, w / 2, h / 2 - 150, '暂停设置', {
      size: 36,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const hint = pixelText(scene, w / 2, h / 2 - 54, '游戏已暂停', {
      size: 22,
      color: UI.text,
      align: 'center',
    }).setOrigin(0.5);
    const detail = pixelText(scene, w / 2, h / 2 + 4, '点击继续按钮返回战斗', {
      size: 18,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5);

    this.resumeButton = makePanel(scene, 300, 76, { fill: UI.crimson, border: UI.goldBright, borderWidth: 3 }).setPosition(w / 2, h / 2 + 122);
    enableHit(this.resumeButton, 300, 76);
    const resumeLabel = pixelText(scene, w / 2, h / 2 + 122, '继续游戏', {
      size: 24,
      color: UI.text,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);

    const resumeHit = scene.add.rectangle(w / 2, h / 2 + 122, 300, 76, UI.void, 0.001).setInteractive({ useHandCursor: true });

    const resume = (): void => onResume();
    this.resumeButton.on('pointerdown', resume);
    resumeHit.on('pointerdown', resume);
    this.root.add([backdrop, panel, title, hint, detail, this.resumeButton, resumeLabel, resumeHit]);
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
