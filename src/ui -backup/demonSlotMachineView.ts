import Phaser from 'phaser';
import type { UpgradeDefinition } from '../game/types';
import { SLOT_SYMBOLS } from '../data/slotSymbols';
import {
  SAFE,
  UI,
  UI_DEPTH,
  addIcon,
  designSize,
  enableHit,
  makeMedallion,
  makePanel,
  pixelText,
  selectionOutline,
} from './uiTheme';

const COLS = 3;
const CELL_W = 92;
const CELL_H = 86;
const GAP = 10;
const MACHINE_X = 474;
const MACHINE_Y = 226;
const HANDLE_Y = SAFE.top + 44;
const LEVER_X = 158;
const LEVER_TOP = -42;
const LEVER_BOTTOM = 106;

export class DemonSlotMachineView {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly handle: Phaser.GameObjects.Container;
  private readonly machine: Phaser.GameObjects.Container;
  private readonly backdrop: Phaser.GameObjects.Rectangle;
  private readonly cellTexts: Phaser.GameObjects.Text[] = [];
  private readonly rewardTexts: Phaser.GameObjects.Text[] = [];
  private readonly multiplierText: Phaser.GameObjects.Text;
  private readonly selOutline: Phaser.GameObjects.Graphics;
  private readonly knob: Phaser.GameObjects.Container;

  private selectedCol = 0;
  private rewards: UpgradeDefinition[] = [];
  private resultSymbols: string[] = [];
  private debugResult?: string[];
  private multiplier = 1;
  private dragging: 'lever' | null = null;
  private dragStartY = 0;
  private spinning = false;

  private readonly onPointerMove: (p: Phaser.Input.Pointer) => void;
  private readonly onPointerUp: () => void;

  constructor(
    scene: Phaser.Scene,
    private readonly hooks: { onClaim: (reward: UpgradeDefinition) => void; onClose?: () => void },
  ) {
    this.scene = scene;
    const { w, h } = designSize(scene);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.slot).setVisible(false);
    this.backdrop = scene.add
      .rectangle(w / 2, h / 2, w, h, UI.void, 0.32)
      .setInteractive({ useHandCursor: false })
      .setVisible(false);
    this.root.add(this.backdrop);

    this.handle = this.buildHandle();
    this.machine = this.buildMachine();
    this.multiplierText = pixelText(scene, MACHINE_X - 36, MACHINE_Y + 148, '', {
      size: 15,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5).setVisible(false);
    this.selOutline = selectionOutline(scene, CELL_W + 8, CELL_H + 8, UI.goldBright, 8);
    this.machine.add(this.selOutline);
    this.knob = this.buildLever();
    this.machine.add(this.knob);
    this.positionSelection();

    this.root.add([this.handle, this.machine, this.multiplierText]);
    this.onPointerMove = (p) => this.handleMove(p);
    this.onPointerUp = () => this.handleUp();
    scene.input.on('pointermove', this.onPointerMove);
    scene.input.on('pointerup', this.onPointerUp);
    scene.input.on('pointerupoutside', this.onPointerUp);
  }

  private buildHandle(): Phaser.GameObjects.Container {
    const c = this.scene.add.container(MACHINE_X, HANDLE_Y).setVisible(false);
    const panel = makePanel(this.scene, 310, 46, {
      fill: UI.cellDark,
      border: UI.bronze,
      borderWidth: 2,
      radius: 12,
      ornate: false,
    });
    const cells = 7;
    const startX = -116;
    for (let i = 0; i < cells; i++) {
      c.add(
        this.scene.add
          .rectangle(startX + i * 38, -4, 32, 16, UI.crimsonBright, 1)
          .setStrokeStyle(1, UI.bronzeDark, 0.9),
      );
    }
    const label = pixelText(this.scene, 0, 24, '槽机已满 自动下拉', {
      size: 13,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const hit = this.scene.add.rectangle(0, 0, 330, 64, UI.void, 0.001).setInteractive({ useHandCursor: true });
    const open = (): void => this.open();
    enableHit(panel, 310, 46);
    panel.on('pointerdown', open);
    hit.on('pointerdown', open);
    c.addAt(panel, 0);
    c.add([label, hit]);
    return c;
  }

  private buildMachine(): Phaser.GameObjects.Container {
    const c = this.scene.add.container(MACHINE_X, MACHINE_Y).setVisible(false);
    const frame = makePanel(this.scene, 416, 344, {
      fill: UI.ink,
      border: UI.arcaneBright,
      borderWidth: 3,
      radius: 8,
      ornate: true,
    });
    const title = pixelText(this.scene, -28, -142, '老虎奖励界面', {
      size: 18,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const crown = pixelText(this.scene, -28, -116, '满后自动下拉', {
      size: 13,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5);
    c.add([frame, title, crown]);

    const gridX = -120;
    const gridY = -26;
    for (let col = 0; col < COLS; col++) {
      const cx = gridX + col * (CELL_W + GAP);
      const hit = this.scene.add.rectangle(cx, gridY, CELL_W + 8, CELL_H + 8, UI.void, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.selectColumn(col));
      const cell = makePanel(this.scene, CELL_W, CELL_H, {
        fill: UI.cellDark,
        border: UI.bronze,
        borderWidth: 2,
        radius: 4,
        ornate: false,
      }).setPosition(cx, gridY);
      const glyph = pixelText(this.scene, cx, gridY - 18, this.randomSymbol(), {
        size: 25,
        color: UI.textGold,
        bold: true,
        align: 'center',
      }).setOrigin(0.5);
      const reward = pixelText(this.scene, cx, gridY + 26, '', {
        size: 11,
        color: UI.text,
        align: 'center',
        wordWrap: CELL_W - 12,
      }).setOrigin(0.5);
      c.add([hit, cell, glyph, reward]);
      this.cellTexts.push(glyph);
      this.rewardTexts.push(reward);
    }

    const hint = pixelText(this.scene, -28, 72, '选择一列领取对应奖励', {
      size: 12,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5);
    const claim = makePanel(this.scene, 192, 46, {
      fill: UI.gold,
      border: UI.goldBright,
      borderWidth: 2,
      radius: 7,
      ornate: false,
      inner: false,
    }).setPosition(-28, 116);
    const claimHit = this.scene.add.rectangle(-28, 116, 192, 46, UI.void, 0.001).setInteractive({ useHandCursor: true });
    const claimLabel = pixelText(this.scene, -28, 116, '确定领取', {
      size: 17,
      color: UI.textDark,
      bold: true,
      align: 'center',
      strokeThickness: 1,
    }).setOrigin(0.5);
    const claimReward = (): void => {
      this.scene.tweens.add({ targets: claim, scaleX: 0.95, scaleY: 0.95, duration: 70, yoyo: true });
      const reward = this.selectedReward();
      if (reward) {
        for (let i = 0; i < this.multiplier; i++) this.hooks.onClaim(reward);
      }
      this.hide();
    };
    claim.on('pointerdown', claimReward);
    claimHit.on('pointerdown', claimReward);
    c.add([hint, claim, claimLabel, claimHit]);
    return c;
  }

  private buildLever(): Phaser.GameObjects.Container {
    const track = this.scene.add.graphics();
    track.fillStyle(UI.panelSoft, 1).fillRoundedRect(LEVER_X - 5, LEVER_TOP, 10, LEVER_BOTTOM - LEVER_TOP, 5);
    track.lineStyle(2, UI.gold, 0.85).strokeRoundedRect(LEVER_X - 5, LEVER_TOP, 10, LEVER_BOTTOM - LEVER_TOP, 5);
    this.machine.add(track);
    this.machine.add(
      pixelText(this.scene, LEVER_X, LEVER_BOTTOM + 18, '拉杆', {
        size: 10,
        color: UI.textDim,
        align: 'center',
      }).setOrigin(0.5),
    );
    const knob = makeMedallion(this.scene, 22, { fill: UI.blood, ring: UI.gold, glow: UI.blood });
    addIcon(this.scene, knob, 'drop', 0, 0, 22, UI.goldBright);
    knob.setPosition(LEVER_X, LEVER_TOP);
    const grip = this.scene.add.circle(0, 0, 28, UI.void, 0.001).setInteractive({ useHandCursor: true });
    grip.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragging = 'lever';
      this.dragStartY = p.y - this.knob.y;
    });
    knob.add(grip);
    return knob;
  }

  private randomSymbol(): string {
    return SLOT_SYMBOLS[Phaser.Math.Between(0, SLOT_SYMBOLS.length - 1)];
  }

  private selectColumn(col: number): void {
    this.selectedCol = Phaser.Math.Clamp(col, 0, Math.max(0, this.resultSymbols.length - 1));
    this.positionSelection();
  }

  private positionSelection(): void {
    const gridX = -120;
    const gridY = -26;
    this.selOutline.setPosition(gridX + this.selectedCol * (CELL_W + GAP), gridY);
  }

  private selectedReward(): UpgradeDefinition | undefined {
    return this.rewards[this.selectedCol];
  }

  private settleSymbols(symbols: string[]): void {
    this.resultSymbols = symbols.slice(0, COLS);
    this.resultSymbols.forEach((symbol, index) => this.cellTexts[index]?.setText(symbol));
    this.multiplier = this.calculateMultiplier(this.resultSymbols);
    this.multiplierText.setText(`奖励倍率 x${this.multiplier}`).setVisible(true);
    this.selectColumn(this.bestRewardIndex(this.resultSymbols));
  }

  private calculateMultiplier(symbols: string[]): number {
    const counts = new Map<string, number>();
    symbols.forEach((symbol) => counts.set(symbol, (counts.get(symbol) ?? 0) + 1));
    const best = Math.max(...counts.values());
    if (best === 3) return 9;
    if (best === 2) return 6;
    return 1;
  }

  private bestRewardIndex(symbols: string[]): number {
    const target =
      this.multiplier === 1 ? symbols[0] : symbols.find((symbol) => symbols.filter((s) => s === symbol).length > 1);
    return Phaser.Math.Clamp(SLOT_SYMBOLS.indexOf(target as (typeof SLOT_SYMBOLS)[number]), 0, this.rewards.length - 1);
  }

  private refreshRewards(): void {
    this.rewardTexts.forEach((text, index) => {
      text.setText(this.rewards[index]?.name ?? '-');
      text.setVisible(index < this.rewards.length);
    });
    this.selectedCol = Phaser.Math.Clamp(this.selectedCol, 0, Math.max(0, this.rewards.length - 1));
    this.positionSelection();
  }

  setDebugResult(symbols: string[]): void {
    this.debugResult = symbols.slice(0, COLS);
    if (this.machine.visible) this.settleSymbols(this.debugResult);
  }

  private handleMove(p: Phaser.Input.Pointer): void {
    if (this.dragging === 'lever') {
      this.knob.y = Phaser.Math.Clamp(p.y - this.dragStartY, LEVER_TOP, LEVER_BOTTOM);
    }
  }

  private handleUp(): void {
    if (this.dragging === 'lever') {
      const pulled = this.knob.y >= LEVER_BOTTOM - 6;
      this.dragging = null;
      this.scene.tweens.add({ targets: this.knob, y: LEVER_TOP, duration: 180, ease: 'Back.out' });
      if (pulled) this.spin();
    }
  }

  show(options: UpgradeDefinition[]): void {
    this.rewards = options.slice(0, COLS);
    this.selectedCol = 0;
    this.refreshRewards();
    this.settleSymbols(this.debugResult ?? [this.randomSymbol(), this.randomSymbol(), this.randomSymbol()]);
    this.root.setVisible(true);
    this.handle.setVisible(false);
    this.open();
  }

  showHandle(options: UpgradeDefinition[]): void {
    this.rewards = options.slice(0, COLS);
    this.selectedCol = 0;
    this.refreshRewards();
    this.root.setVisible(true);
    this.backdrop.setVisible(false);
    this.machine.setVisible(false);
    this.handle.setVisible(true).setPosition(MACHINE_X, HANDLE_Y);
  }

  open(): void {
    this.root.setVisible(true);
    this.handle.setVisible(false);
    this.backdrop.setVisible(true);
    this.machine.setVisible(true).setY(MACHINE_Y - 28);
    this.scene.tweens.add({ targets: this.machine, y: MACHINE_Y, duration: 180, ease: 'Back.out' });
  }

  spin(result?: string[]): void {
    if (this.spinning) return;
    this.spinning = true;
    const finalSymbols = result?.slice(0, COLS) ?? [this.randomSymbol(), this.randomSymbol(), this.randomSymbol()];
    let ticks = 0;
    const settle = (): void => {
      for (let i = 0; i < this.cellTexts.length; i++) {
        this.cellTexts[i].setText(ticks >= 8 ? finalSymbols[i] : this.randomSymbol());
      }
      ticks++;
      if (ticks <= 8) {
        this.scene.time.delayedCall(60, settle);
      } else {
        this.spinning = false;
        this.settleSymbols(finalSymbols);
      }
    };
    settle();
  }

  hide(): void {
    const wasVisible = this.root.visible;
    this.dragging = null;
    this.backdrop.setVisible(false);
    this.machine.setVisible(false);
    this.handle.setVisible(false);
    this.root.setVisible(false);
    this.rewards = [];
    this.resultSymbols = [];
    this.debugResult = undefined;
    this.multiplier = 1;
    this.multiplierText.setVisible(false);
    if (wasVisible) this.hooks.onClose?.();
  }

  isVisible(): boolean {
    return this.root.visible;
  }

  destroy(): void {
    this.scene.input.off('pointermove', this.onPointerMove);
    this.scene.input.off('pointerup', this.onPointerUp);
    this.scene.input.off('pointerupoutside', this.onPointerUp);
    this.root.destroy(true);
  }
}
