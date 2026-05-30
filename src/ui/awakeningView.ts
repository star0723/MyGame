import Phaser from 'phaser';
import type { DemonFormDefinition } from '../game/types';
import { SLOT_SYMBOLS } from '../data/slotSymbols';
import { chooseOne } from '../utils/math';
import { UI, UI_DEPTH, addIcon, designSize, makePanel, pixelText } from './uiTheme';

export class AwakeningView {
  private readonly container: Phaser.GameObjects.Container;
  private readonly title: Phaser.GameObjects.Text;
  private readonly subtitle: Phaser.GameObjects.Text;
  private readonly reels: Phaser.GameObjects.Text[] = [];
  private spinTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    const { w, h } = designSize(scene);
    const cx = w / 2;
    const cy = h / 2;
    this.container = scene.add.container(cx, cy).setScrollFactor(0).setDepth(UI_DEPTH.overlay + 20).setVisible(false);
    const veil = scene.add.rectangle(0, 0, w, h, UI.void, 0.88).setInteractive({ useHandCursor: false });
    const panel = makePanel(scene, 584, 402, {
      fill: UI.ink,
      border: UI.arcaneBright,
      borderWidth: 4,
      radius: 10,
      ornate: true,
    });
    const core = scene.add.container(0, -152);
    addIcon(scene, core, 'core', 0, 0, 72, UI.arcaneBright);
    this.title = pixelText(scene, 0, -102, '', {
      size: 34,
      color: UI.textCrimson,
      bold: true,
      align: 'center',
      strokeThickness: 4,
    }).setOrigin(0.5);
    this.subtitle = pixelText(scene, 0, 132, '', {
      size: 18,
      color: UI.textGold,
      align: 'center',
      wordWrap: 480,
    }).setOrigin(0.5);
    this.container.addAt(veil, 0);
    this.container.addAt(panel, 1);
    this.container.add([core, this.title, this.subtitle]);

    const reelX = [-154, 0, 154];
    for (let i = 0; i < 3; i += 1) {
      const box = makePanel(scene, 102, 92, {
        fill: UI.cellDark,
        border: UI.bronze,
        borderWidth: 2,
        radius: 5,
        ornate: false,
      }).setPosition(reelX[i], 22);
      const reel = pixelText(scene, reelX[i], 18, '?', {
        size: 40,
        color: UI.textGold,
        bold: true,
        align: 'center',
      }).setOrigin(0.5);
      this.reels.push(reel);
      this.container.add([box, reel]);
    }
  }

  showRolling(): void {
    this.container.setVisible(true);
    this.title.setText('最终觉醒抽取中...');
    this.subtitle.setText('[ 主种族 ]    [ 器官 ]    [ 权能 ]');
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
