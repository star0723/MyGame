import Phaser from 'phaser';
import type { UpgradeDefinition } from '../game/types';
import { SLOT_SYMBOLS } from '../data/slotSymbols';
import { chooseOne } from '../utils/math';
import { SAFE, designSize } from './uiTheme';

export class SlotView {
  private container: Phaser.GameObjects.Container;
  private title: Phaser.GameObjects.Text;
  private reels: Phaser.GameObjects.Text[] = [];
  private locked = [false, false, false];
  private spinTimer?: Phaser.Time.TimerEvent;
  private pendingCalls: Phaser.Time.TimerEvent[] = [];
  private optionObjects: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private scene: Phaser.Scene,
    private onPick: (upgrade: UpgradeDefinition) => void,
  ) {
    const { w, h } = designSize(scene);
    const panelWidth = w - SAFE.side * 2;
    this.container = scene.add.container(w / 2, h / 2).setDepth(12000).setVisible(false);
    const backdrop = scene.add.rectangle(0, 0, panelWidth, 400, 0x160913, 0.96);
    backdrop.setStrokeStyle(3, 0xb51d2a);
    this.title = scene.add
      .text(0, -138, '血肉老虎机', { fontFamily: 'monospace', fontSize: '30px', color: '#ffd1d9' })
      .setOrigin(0.5);
    this.container.add([backdrop, this.title]);

    const reelX = [-170, 0, 170];
    for (let i = 0; i < 3; i += 1) {
      const reel = scene.add
        .text(reelX[i], -78, '？', {
          fontFamily: 'monospace',
          fontSize: '44px',
          color: '#ffe8b8',
          backgroundColor: '#2a1020',
          padding: { x: 16, y: 10 },
        })
        .setOrigin(0.5);
      this.reels.push(reel);
      this.container.add(reel);
    }
  }

  show(options: UpgradeDefinition[]): void {
    this.clearOptions();
    this.container.setVisible(true);
    this.title.setText('血肉老虎机  |  转动中...');
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

    // Stagger-stop the reels left -> right, then reveal the real option cards.
    this.pendingCalls.push(this.scene.time.delayedCall(450, () => (this.locked[0] = true)));
    this.pendingCalls.push(this.scene.time.delayedCall(650, () => (this.locked[1] = true)));
    this.pendingCalls.push(this.scene.time.delayedCall(850, () => (this.locked[2] = true)));
    this.pendingCalls.push(
      this.scene.time.delayedCall(950, () => {
        this.spinTimer?.remove();
        this.spinTimer = undefined;
        this.title.setText('血肉老虎机  |  选择 1 个奖励');
        this.revealOptions(options);
      }),
    );
  }

  private revealOptions(options: UpgradeDefinition[]): void {
    options.forEach((upgrade, index) => {
      const y = 14 + index * 72;
      const card = this.scene.add
        .rectangle(0, y, 560, 64, 0x2a1020, 1)
        .setInteractive({ useHandCursor: true });
      card.setStrokeStyle(2, upgrade.rarity === 'rare' ? 0xffc857 : 0x7e1b36);
      const text = this.scene.add
        .text(-260, y - 22, `${upgrade.name}\n${upgrade.description}`, {
          fontFamily: 'monospace',
          fontSize: '15px',
          color: '#fff0d1',
          lineSpacing: 2,
          wordWrap: { width: 520, useAdvancedWrap: true },
        })
        .setOrigin(0, 0);
      const pick = (): void => this.onPick(upgrade);
      card.on('pointerdown', pick);
      const hit = this.scene.add.rectangle(0, y, 560, 64, 0x000000, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', pick);
      this.container.add([card, text, hit]);
      this.optionObjects.push(card, text, hit);
    });
  }

  hide(): void {
    this.clearOptions();
    this.container.setVisible(false);
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
