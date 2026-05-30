import Phaser from 'phaser';
import type { Minion, MinionKind, World } from '../game/types';
import {
  SAFE,
  UI,
  UI_DEPTH,
  addIcon,
  designSize,
  enableHit,
  makePanel,
  makeStatBar,
  pixelText,
  selectionOutline,
} from './uiTheme';

interface CellRefs {
  kind: MinionKind;
  row: Phaser.GameObjects.Container;
  portrait: Phaser.GameObjects.Container;
  countText: Phaser.GameObjects.Text;
  levelText: Phaser.GameObjects.Text;
  hpBar: ReturnType<typeof makeStatBar>;
  eliteRing: Phaser.GameObjects.Graphics;
  emptyMask: Phaser.GameObjects.Rectangle;
}

const ORDER: MinionKind[] = ['skeleton', 'bat', 'goblin', 'slime'];

const KIND_META: Record<MinionKind, { label: string; icon: Parameters<typeof addIcon>[2]; color: number }> = {
  skeleton: { label: '骷髅兵', icon: 'skull', color: UI.bone },
  bat: { label: '血翼蝠', icon: 'bat', color: UI.arcaneBright },
  goblin: { label: '哥布林', icon: 'goblin', color: UI.flame },
  slime: { label: '腐液怪', icon: 'orb', color: UI.flameDim },
};

export class MinionLegionBar {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly cells: CellRefs[] = [];
  private readonly promoteButton: Phaser.GameObjects.Container;
  private readonly costText: Phaser.GameObjects.Text;
  private readonly counts: Record<MinionKind, number> = { skeleton: 0, bat: 0, goblin: 0, slime: 0 };
  private readonly elite: Record<MinionKind, Minion | undefined> = {
    skeleton: undefined,
    bat: undefined,
    goblin: undefined,
    slime: undefined,
  };

  constructor(scene: Phaser.Scene, onSelectKind?: (kind: MinionKind) => void) {
    this.scene = scene;
    const { h } = designSize(scene);
    const x = SAFE.side + 76;
    const y = h - SAFE.bottom - 318;

    this.root = scene.add.container(x, y).setScrollFactor(0).setDepth(UI_DEPTH.legion);
    const panel = makePanel(scene, 150, 448, {
      fill: UI.ink,
      border: UI.bronze,
      borderWidth: 2,
      radius: 8,
      ornate: true,
    });
    const tab = makePanel(scene, 120, 34, {
      fill: UI.panelSoft,
      border: UI.bronze,
      radius: 4,
      ornate: false,
      inner: false,
    }).setPosition(0, -224);
    const title = pixelText(scene, 0, -224, '队伍 / 友方', {
      size: 17,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    this.root.add([panel, tab, title]);

    ORDER.forEach((kind, index) => {
      this.buildRow(kind, -162 + index * 72, onSelectKind);
    });

    this.promoteButton = makePanel(scene, 122, 52, {
      fill: UI.arcaneDim,
      border: UI.arcaneBright,
      borderWidth: 2,
      radius: 6,
      ornate: false,
    }).setPosition(0, 144);
    enableHit(this.promoteButton, 122, 52);
    const promoteLabel = pixelText(scene, 0, 134, '晋升精英', {
      size: 17,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const promoteHint = pixelText(scene, 0, 157, '消耗腐血强化', {
      size: 12,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5);
    this.costText = pixelText(scene, 0, 200, '200', {
      size: 24,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    addIcon(scene, this.root, 'drop', -38, 200, 24, UI.blood);
    const costBox = makePanel(scene, 112, 44, {
      fill: UI.panelSoft,
      border: UI.bronze,
      radius: 6,
      ornate: false,
    }).setPosition(0, 200);
    this.root.add([this.promoteButton, promoteLabel, promoteHint, costBox, this.costText]);
  }

  private buildRow(kind: MinionKind, y: number, onSelectKind?: (kind: MinionKind) => void): void {
    const meta = KIND_META[kind];
    const row = this.scene.add.container(0, y);
    const bg = makePanel(this.scene, 124, 62, {
      fill: UI.stoneDeep,
      border: UI.bronzeDark,
      borderWidth: 2,
      radius: 6,
      ornate: false,
    });
    const portrait = this.scene.add.container(-38, 0);
    const portraitBg = this.scene.add.rectangle(0, 0, 42, 42, UI.cell, 1).setStrokeStyle(2, UI.bronze, 0.9);
    portrait.add(portraitBg);
    addIcon(this.scene, portrait, meta.icon, 0, 0, 30, meta.color);

    const countText = pixelText(this.scene, 4, -12, meta.label, {
      size: 13,
      color: UI.text,
      bold: true,
    }).setOrigin(0, 0.5);
    const levelText = pixelText(this.scene, 42, 9, 'Lv. --', {
      size: 14,
      color: UI.textGold,
      bold: true,
      align: 'right',
    }).setOrigin(1, 0.5);
    const hpBar = makeStatBar(this.scene, 48, 7, UI.flame);
    hpBar.container.setPosition(0, 23);
    const eliteRing = selectionOutline(this.scene, 128, 66, UI.arcaneBright, 8).setVisible(false);
    const emptyMask = this.scene.add.rectangle(0, 0, 124, 62, UI.void, 0.42).setVisible(true);

    const hit = this.scene.add.rectangle(0, 0, 132, 68, UI.void, 0.001).setInteractive({ useHandCursor: true });
    const press = (): void => {
      this.scene.tweens.add({ targets: row, scaleX: 0.96, scaleY: 0.96, duration: 70, yoyo: true });
      onSelectKind?.(kind);
    };
    hit.on('pointerdown', press);
    row.add([bg, eliteRing, portrait, countText, levelText, hpBar.container, emptyMask, hit]);
    this.root.add(row);
    this.cells.push({ kind, row, portrait, countText, levelText, hpBar, eliteRing, emptyMask });
  }

  update(world: World): void {
    (Object.keys(this.counts) as MinionKind[]).forEach((k) => {
      this.counts[k] = 0;
      this.elite[k] = undefined;
    });

    for (const m of world.minions as Minion[]) {
      this.counts[m.kind]++;
      if (m.elite) this.elite[m.kind] = m;
    }

    for (const cell of this.cells) {
      const n = this.counts[cell.kind];
      const elite = this.elite[cell.kind];
      const meta = KIND_META[cell.kind];
      cell.emptyMask.setVisible(n === 0);
      cell.eliteRing.setVisible(Boolean(elite));
      cell.countText.setText(n > 0 ? `${meta.label} x${n}` : meta.label);
      cell.countText.setColor(elite ? UI.textPurple : n > 0 ? UI.text : UI.textDim);
      cell.levelText.setText(elite ? `Lv.${Math.max(1, elite.kills + 10)}` : n > 0 ? `Lv.${Math.max(1, n + 8)}` : 'Lv. --');
      cell.hpBar.setFill(elite ? UI.arcaneBright : UI.flame);
      cell.hpBar.setRatio(elite ? elite.hp / elite.maxHp : n > 0 ? 0.75 : 0);
      cell.portrait.setAlpha(n > 0 ? 1 : 0.45);
    }

    const canAfford = world.economy.bloodChips >= 200;
    this.costText.setText('200');
    this.costText.setColor(canAfford ? UI.textGreen : UI.textGold);
    this.promoteButton.setAlpha(canAfford ? 1 : 0.78);
  }

  destroy(): void {
    for (const c of this.cells) {
      this.scene.tweens.killTweensOf(c.row);
      c.row.removeAllListeners();
    }
    this.promoteButton.removeAllListeners();
    this.root.destroy(true);
  }
}
