import Phaser from 'phaser';
import type { UpgradeDefinition } from '../game/types';
import { SLOT_SYMBOLS } from '../data/slotSymbols';
import { chooseOne } from '../utils/math';
import { SAFE, UI, UI_DEPTH, designSize, makePanel, pixelText } from './uiTheme';

export class SlotView {
  private readonly container: Phaser.GameObjects.Container;
  private readonly title: Phaser.GameObjects.Text;
  private readonly reels: Phaser.GameObjects.Text[] = [];
  private locked = [false, false, false];
  private spinTimer?: Phaser.Time.TimerEvent;
  private pendingCalls: Phaser.Time.TimerEvent[] = [];
  private optionObjects: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onPick: (upgrade: UpgradeDefinition) => void,
  ) {
    const { w, h } = designSize(scene);
    const panelWidth = w - SAFE.side * 2;
    this.container = scene.add.container(w / 2, h / 2).setScrollFactor(0).setDepth(UI_DEPTH.slot).setVisible(false);
    const backdrop = scene.add.rectangle(0, 0, w, h, UI.void, 0.78).setInteractive({ useHandCursor: false });
    const panel = makePanel(scene, panelWidth, 506, {
      fill: UI.ink,
      border: UI.crimson,
      borderWidth: 3,
      radius: 10,
      ornate: true,
    });
    this.title = pixelText(scene, 0, -202, '血肉老虎机', {
      size: 30,
      color: UI.textCrimson,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    this.container.add([backdrop, panel, this.title]);

    const reelX = [-156, 0, 156];
    for (let i = 0; i < 3; i += 1) {
      const box = makePanel(scene, 106, 88, {
        fill: UI.cellDark,
        border: UI.bronze,
        borderWidth: 2,
        radius: 5,
        ornate: false,
      }).setPosition(reelX[i], -118);
      const reel = pixelText(scene, reelX[i], -122, '?', {
        size: 40,
        color: UI.textGold,
        bold: true,
        align: 'center',
      }).setOrigin(0.5);
      this.reels.push(reel);
      this.container.add([box, reel]);
    }
  }

  show(options: UpgradeDefinition[]): void {
    this.clearOptions();
    this.container.setVisible(true);
    this.title.setText('血肉老虎机 | 转动中...');
    this.locked = [false, false, false];

    this.spinTimer = this.scene.time.addEvent({
      delay: 70,
      loop: true,
      callback: () => {
        this.reels.forEach((reel, i) => {
          if (!this.locked[i]) reel.setText(chooseOne(SLOT_SYMBOLS));
        });
      },
    });

    this.pendingCalls.push(this.scene.time.delayedCall(450, () => (this.locked[0] = true)));
    this.pendingCalls.push(this.scene.time.delayedCall(650, () => (this.locked[1] = true)));
    this.pendingCalls.push(this.scene.time.delayedCall(850, () => (this.locked[2] = true)));
    this.pendingCalls.push(
      this.scene.time.delayedCall(950, () => {
        this.spinTimer?.remove();
        this.spinTimer = undefined;
        this.title.setText('血肉老虎机 | 选择 1 个奖励');
        this.revealOptions(options);
      }),
    );
  }

  hide(): void {
    this.clearOptions();
    this.container.setVisible(false);
  }

  private revealOptions(options: UpgradeDefinition[]): void {
    options.forEach((upgrade, index) => {
      const y = -24 + index * 82;
      const rare = upgrade.rarity === 'rare' || upgrade.rarity === 'cursed';
      const card = makePanel(this.scene, 568, 70, {
        fill: rare ? UI.arcaneDim : UI.cellDark,
        border: rare ? UI.arcaneBright : UI.bronze,
        borderWidth: 2,
        radius: 6,
        ornate: false,
      }).setPosition(0, y);
      const name = pixelText(this.scene, -264, y - 20, upgrade.name, {
        size: 16,
        color: rare ? UI.textPurple : UI.textGold,
        bold: true,
      }).setOrigin(0, 0.5);
      const desc = pixelText(this.scene, -264, y + 10, upgrade.description, {
        size: 13,
        color: UI.text,
        wordWrap: 520,
      }).setOrigin(0, 0.5);
      const hit = this.scene.add.rectangle(0, y, 568, 70, UI.void, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.onPick(upgrade));
      this.container.add([card, name, desc, hit]);
      this.optionObjects.push(card, name, desc, hit);
    });
  }

  private clearOptions(): void {
    this.spinTimer?.remove();
    this.spinTimer = undefined;
    this.pendingCalls.forEach((c) => c.remove(false));
    this.pendingCalls = [];
    this.optionObjects.forEach((o) => o.destroy());
    this.optionObjects = [];
    this.locked = [false, false, false];
  }
}

