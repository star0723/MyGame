import Phaser from 'phaser';
import type { Enemy, World } from '../game/types';
import { RUN_RULES } from '../game/constants';
import type { StatBar } from './uiTheme';
import {
  SAFE,
  UI,
  UI_DEPTH,
  addIcon,
  drawPixelIcon,
  enableHit,
  makeMedallion,
  makePanel,
  makeSegmentBar,
  makeStatBar,
  pixelText,
} from './uiTheme';

interface RowRefs {
  value: Phaser.GameObjects.Text;
  bar?: StatBar;
}

export class TopStatusBar {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly slotTrack: ReturnType<typeof makeSegmentBar>;
  private readonly hpRow: RowRefs;
  private readonly bloodRow: RowRefs;
  private readonly embryoRow: RowRefs;
  private readonly minionRow: RowRefs;
  private readonly pauseBtn: Phaser.GameObjects.Container;
  private readonly bossGroup: Phaser.GameObjects.Container;
  private readonly bossBar: StatBar;
  private readonly bossText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, onPause: () => void) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.hud);

    const statPanel = makePanel(scene, 220, 132, {
      fill: UI.ink,
      fillAlpha: 0.94,
      border: UI.bronze,
      borderWidth: 2,
      radius: 7,
      ornate: true,
    }).setPosition(SAFE.side + 110, SAFE.top + 72);
    this.root.add(statPanel);

    this.hpRow = this.addInfoRow(statPanel, -48, 'heart', UI.blood, 'HP', true);
    this.bloodRow = this.addInfoRow(statPanel, -16, 'drop', UI.blood, '腐血', false);
    this.embryoRow = this.addInfoRow(statPanel, 16, 'embryo', UI.arcaneBright, '胚胎值', false);
    this.minionRow = this.addInfoRow(statPanel, 48, 'skull', UI.bone, '小怪数', false);

    this.slotTrack = makeSegmentBar(scene, 8, 30, 17, 4, UI.blood);
    this.slotTrack.container.setPosition(432, SAFE.top + 36);
    this.root.add(this.slotTrack.container);
    this.decorateSlotTrack(432, SAFE.top + 36);

    this.pauseBtn = makeMedallion(scene, 30, {
      fill: UI.panelSoft,
      ring: UI.gold,
      glow: UI.arcane,
      glowAlpha: 0.18,
    }).setPosition(674, SAFE.top + 35);
    addIcon(scene, this.pauseBtn, 'pause', 0, 0, 28, UI.bone);
    enableHit(this.pauseBtn, 62, 62);
    this.pauseBtn.on('pointerdown', () => {
      scene.tweens.add({ targets: this.pauseBtn, scale: 0.88, duration: 70, yoyo: true });
      onPause();
    });
    this.root.add(this.pauseBtn);

    this.bossGroup = scene.add.container(432, SAFE.top + 104).setVisible(false);
    const bossPanel = makePanel(scene, 320, 32, {
      fill: UI.ink,
      border: UI.crimson,
      borderWidth: 2,
      radius: 8,
      ornate: false,
    });
    this.bossBar = makeStatBar(scene, 228, 13, UI.crimsonBright);
    this.bossBar.container.setPosition(-78, 2);
    this.bossText = pixelText(scene, 42, 2, '', {
      size: 12,
      color: UI.textCrimson,
      bold: true,
      align: 'right',
    }).setOrigin(0, 0.5);
    this.bossGroup.add([bossPanel, this.bossBar.container, this.bossText]);
    this.root.add(this.bossGroup);
  }

  private decorateSlotTrack(cx: number, cy: number): void {
    const left = drawPixelIcon(this.scene, 'skull', 28, UI.bone).setPosition(cx - 154, cy);
    const right = drawPixelIcon(this.scene, 'skull', 28, UI.bone).setPosition(cx + 154, cy).setScale(-1, 1);
    const title = pixelText(this.scene, cx, cy + 27, '血肉老虎机胶囊', {
      size: 13,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    this.root.add([left, right, title]);
  }

  private addInfoRow(
    panel: Phaser.GameObjects.Container,
    y: number,
    icon: Parameters<typeof addIcon>[2],
    color: number,
    label: string,
    withBar: boolean,
  ): RowRefs {
    addIcon(this.scene, panel, icon, -84, y, 24, color);
    panel.add(pixelText(this.scene, -58, y, label, { size: 16, color: UI.text, bold: true }).setOrigin(0, 0.5));

    let bar: StatBar | undefined;
    if (withBar) {
      bar = makeStatBar(this.scene, 76, 11, color);
      bar.container.setPosition(3, y + 9);
      panel.add(bar.container);
    }

    const value = pixelText(this.scene, 86, y, '', {
      size: 15,
      color: UI.textGold,
      bold: true,
      align: 'right',
    }).setOrigin(1, 0.5);
    panel.add(value);
    return { value, bar };
  }

  private static ratio(num: number, den: number): number {
    return den > 0 ? num / den : 0;
  }

  update(world: World): void {
    const p = world.player;
    const embryoRatio = TopStatusBar.ratio(p.embryoValue, p.embryoMax);
    this.slotTrack.setRatio(embryoRatio);

    const hpRatio = TopStatusBar.ratio(p.hp, p.maxHp);
    this.hpRow.bar?.setRatio(hpRatio);
    this.hpRow.value.setText(`${Math.max(0, Math.ceil(p.hp))}/${Math.ceil(p.maxHp)}`);
    this.bloodRow.value.setText(String(world.economy.bloodChips));
    this.embryoRow.value.setText(`${Math.round(embryoRatio * 100)}%`);
    this.minionRow.value.setText(`${world.minions.length}/${world.modifiers.minionLimit}`);

    const boss = world.enemies.find((e: Enemy) => e.isBoss && e.alive);
    if (boss) {
      this.bossGroup.setVisible(true);
      this.bossBar.setRatio(TopStatusBar.ratio(boss.hp, boss.maxHp));
      this.bossText.setText(`${Math.max(0, Math.ceil(boss.hp))}/${Math.ceil(boss.maxHp)}`);
    } else {
      this.bossGroup.setVisible(false);
    }

    const bloodRatio = TopStatusBar.ratio(p.exp, RUN_RULES.expToLevel);
    this.bloodRow.value.setColor(bloodRatio >= 0.85 ? UI.textGreen : UI.textGold);
  }

  destroy(): void {
    this.pauseBtn.removeAllListeners();
    this.root.destroy(true);
  }
}

