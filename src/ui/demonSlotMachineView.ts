import Phaser from 'phaser';
import type { UpgradeDefinition } from '../game/types';
import {
  UI, UI_DEPTH, designSize, pixelText, makePanel, makeMedallion, selectionOutline, enableHit,
} from './uiTheme';
import { SLOT_SYMBOLS } from '../data/slotSymbols';

const COLS = 3;
const CELL_W = 150;
const CELL_H = 140;
const GAP = 14;

const MACHINE_X = 360;
const MACHINE_Y = 600;
const HANDLE_Y = 120;
const LEVER_X = 632 - MACHINE_X;
const LEVER_TOP = 470 - MACHINE_Y;
const LEVER_BOTTOM = 760 - MACHINE_Y;

/** Portrait "恶魔老虎机" placeholder: pull-tab -> ornate reel grid + lever + claim. */
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
  private dragging: 'handle' | 'lever' | null = null;
  private dragStartY = 0;
  private spinning = false;

  private readonly onPointerMove: (p: Phaser.Input.Pointer) => void;
  private readonly onPointerUp: (p: Phaser.Input.Pointer) => void;

  constructor(
    scene: Phaser.Scene,
    private readonly hooks: { onClaim: (reward: UpgradeDefinition) => void },
  ) {
    this.scene = scene;
    const { w, h } = designSize(scene);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.slot).setVisible(false);

    // Full-screen dim backdrop (shown with the machine, not the handle). Interactive
    // so taps off the machine are swallowed rather than reaching the game below.
    this.backdrop = scene.add
      .rectangle(w / 2, h / 2, w, h, UI.void, 0.82)
      .setInteractive({ useHandCursor: false })
      .setVisible(false);
    this.root.add(this.backdrop);

    this.handle = this.buildHandle();
    this.machine = this.buildMachine();
    this.multiplierText = pixelText(scene, MACHINE_X, MACHINE_Y + 134, '', {
      size: 20,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5).setVisible(false);
    this.selOutline = selectionOutline(scene, CELL_W + 6, CELL_H + 6, UI.goldBright, 12);
    this.machine.add(this.selOutline);
    this.knob = this.buildLever();
    this.machine.add(this.knob);
    this.positionSelection();

    this.root.add([this.handle, this.machine, this.multiplierText]);

    this.onPointerMove = (p) => this.handleMove(p);
    this.onPointerUp = (p) => this.handleUp(p);
    scene.input.on('pointermove', this.onPointerMove);
    scene.input.on('pointerup', this.onPointerUp);
    scene.input.on('pointerupoutside', this.onPointerUp);
  }

  private buildHandle(): Phaser.GameObjects.Container {
    const c = this.scene.add.container(MACHINE_X, HANDLE_Y).setVisible(false);
    const panel = makePanel(this.scene, 360, 70, { fill: UI.panelSoft, border: UI.flame });
    const label = pixelText(this.scene, 0, -10, '血肉老虎机已就绪', { size: 20, color: UI.textGreen, bold: true }).setOrigin(0.5);
    const arrow = pixelText(this.scene, 0, 18, '点击开奖', { size: 18, color: UI.textGreen, bold: true }).setOrigin(0.5);
    const open = (): void => this.open();
    const hit = this.scene.add.rectangle(0, 0, 360, 70, UI.void, 0.001).setInteractive({ useHandCursor: true });
    enableHit(panel, 360, 70);
    panel.on('pointerdown', open);
    hit.on('pointerdown', open);
    c.add([panel, label, arrow, hit]);
    return c;
  }

  private buildMachine(): Phaser.GameObjects.Container {
    const c = this.scene.add.container(MACHINE_X, MACHINE_Y).setVisible(false);
    const frame = makePanel(this.scene, 580, 760, { fill: UI.panel, border: UI.arcane, borderWidth: 3 });
    const banner = pixelText(this.scene, 0, -300, '恶魔老虎机', { size: 30, color: UI.textCrimson, bold: true, strokeThickness: 4 }).setOrigin(0.5);
    c.add([frame, banner]);

    const gridX = -(COLS - 1) * (CELL_W + GAP) / 2;
    const gridY = -72;
    for (let col = 0; col < COLS; col++) {
      const cx = gridX + col * (CELL_W + GAP);
      const hit = this.scene.add.rectangle(cx, gridY, CELL_W + 6, CELL_H + 6, UI.void, 0.001).setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this.selectColumn(col));
      c.add(hit);

      const cell = this.scene.add.rectangle(cx, gridY, CELL_W, CELL_H, UI.cell, 1);
      cell.setStrokeStyle(2, UI.gold, 0.9);
      const glyph = pixelText(this.scene, cx, gridY - 18, this.randomSymbol(), {
        size: 26,
        color: UI.textGold,
        bold: true,
      }).setOrigin(0.5);
      const reward = pixelText(this.scene, cx, gridY + 42, '', {
        size: 14,
        color: UI.text,
        align: 'center',
      }).setOrigin(0.5);
      c.add([cell, glyph, reward]);
      this.cellTexts.push(glyph);
      this.rewardTexts.push(reward);
    }

    const hint = pixelText(this.scene, 0, 120, '抽到图案后领取对应奖励', { size: 18, color: UI.textDim }).setOrigin(0.5);
    const claim = makePanel(this.scene, 360, 84, { fill: UI.gold, border: UI.goldBright, borderWidth: 3 });
    claim.setPosition(0, 200);
    const claimHit = this.scene.add.rectangle(0, 200, 360, 84, UI.void, 0.001).setInteractive({ useHandCursor: true });
    const claimLabel = pixelText(this.scene, 0, 200, '确定领取', { size: 24, color: UI.text, bold: true }).setOrigin(0.5);
    const claimReward = (): void => {
      this.scene.tweens.add({ targets: claim, scaleX: 0.95, scaleY: 0.95, duration: 70, yoyo: true });
      const reward = this.selectedReward();
      const multiplier = this.multiplier;
      if (reward) {
        for (let i = 0; i < multiplier; i++) this.hooks.onClaim(reward);
      }
      this.hide();
    };
    claim.on('pointerdown', claimReward);
    claimHit.on('pointerdown', claimReward);
    c.add([hint, claim, claimLabel, claimHit]);
    return c;
  }

  private buildLever(): Phaser.GameObjects.Container {
    // Track + label drawn relative to the machine container (centered at MACHINE_X/Y).
    const track = this.scene.add.graphics();
    track.fillStyle(UI.panelSoft, 1).fillRoundedRect(LEVER_X - 6, LEVER_TOP, 12, LEVER_BOTTOM - LEVER_TOP, 6);
    track.lineStyle(2, UI.frame, 1).strokeRoundedRect(LEVER_X - 6, LEVER_TOP, 12, LEVER_BOTTOM - LEVER_TOP, 6);
    this.machine.add(track);
    const leverLabel = pixelText(this.scene, LEVER_X, LEVER_BOTTOM + 18, '滑动拉杆', { size: 14, color: UI.textDim }).setOrigin(0.5);
    this.machine.add(leverLabel);

    const knob = makeMedallion(this.scene, 28, { fill: UI.blood, ring: UI.crimsonBright, glow: UI.blood });
    knob.setPosition(LEVER_X, LEVER_TOP);
    // Grip hit area lives at the knob's local origin (0,0); makeMedallion stacks its
    // ring/disc there too, so the interactive zone tracks the knob as it slides.
    const grip = this.scene.add.circle(0, 0, 30, UI.void, 0.001).setInteractive({ useHandCursor: true });
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
    const gridX = -(COLS - 1) * (CELL_W + GAP) / 2;
    const gridY = -72;
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
    const bestIndex = this.bestRewardIndex(this.resultSymbols);
    this.selectColumn(bestIndex);
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
    const target = this.multiplier === 1 ? symbols[0] : symbols.find((symbol) => symbols.filter((s) => s === symbol).length > 1);
    return Phaser.Math.Clamp(SLOT_SYMBOLS.indexOf(target as (typeof SLOT_SYMBOLS)[number]), 0, this.rewards.length - 1);
  }

  private refreshRewards(): void {
    this.rewardTexts.forEach((text, index) => {
      text.setText(this.rewards[index]?.name ?? '—');
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

  private handleUp(p: Phaser.Input.Pointer): void {
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
    this.machine.setVisible(true);
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
      if (ticks <= 8) this.scene.time.delayedCall(60, settle);
      else {
        this.spinning = false;
        this.settleSymbols(finalSymbols);
      }
    };
    settle();
  }

  hide(): void {
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
  }

  destroy(): void {
    this.scene.input.off('pointermove', this.onPointerMove);
    this.scene.input.off('pointerup', this.onPointerUp);
    this.scene.input.off('pointerupoutside', this.onPointerUp);
    this.root.destroy(true);
  }
}
