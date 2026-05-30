import Phaser from 'phaser';
import type { World } from '../game/types';
import { UI, UI_DEPTH, makePanel, pixelText } from './uiTheme';

/** Legacy compact HUD kept for backup compatibility. The main portrait HUD is TopStatusBar. */
export class HudView {
  private readonly container: Phaser.GameObjects.Container;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly expText: Phaser.GameObjects.Text;
  private readonly embryoText: Phaser.GameObjects.Text;
  private readonly chipsText: Phaser.GameObjects.Text;
  private readonly phaseText: Phaser.GameObjects.Text;
  private readonly bossText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(24, 18).setScrollFactor(0).setDepth(UI_DEPTH.hud);
    const panel = makePanel(scene, 430, 154, {
      fill: UI.ink,
      border: UI.bronze,
      borderWidth: 2,
      radius: 7,
      ornate: false,
    }).setPosition(215, 77);
    this.hpText = this.makeLine(scene, 18, 14);
    this.expText = this.makeLine(scene, 18, 42);
    this.embryoText = this.makeLine(scene, 18, 70);
    this.chipsText = this.makeLine(scene, 18, 98);
    this.phaseText = this.makeLine(scene, 18, 126);
    this.bossText = pixelText(scene, 360, 26, '', {
      size: 20,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5, 0);
    this.bossText.setDepth(UI_DEPTH.hud);
    this.container.add([panel, this.hpText, this.expText, this.embryoText, this.chipsText, this.phaseText]);
  }

  update(world: World): void {
    this.hpText.setText(`核心生命 ${Math.max(0, Math.ceil(world.player.hp))}/${world.player.maxHp}`);
    this.expText.setText(`腐血经验 ${Math.floor(world.player.exp)}  等级 ${world.player.level}`);
    this.embryoText.setText(`胚胎值 ${Math.floor(world.player.embryoValue)}/${world.player.embryoMax}`);
    this.chipsText.setText(`筹码 ${world.economy.bloodChips}  小怪 ${world.minions.length}  精英 ${world.stats.eliteUpgrades}`);
    this.phaseText.setText(`阶段 ${world.phase}  击杀 ${world.stats.kills}`);

    const boss = world.enemies.find((enemy) => enemy.isBoss);
    if (boss) {
      const tag = world.boss?.enraged ? '  [狂暴]' : '';
      this.bossText.setVisible(true).setText(`圣骑士 ${Math.max(0, Math.ceil(boss.hp))}/${boss.maxHp}${tag}`);
    } else {
      this.bossText.setVisible(false);
    }
  }

  private makeLine(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Text {
    return pixelText(scene, x, y, '', {
      size: 15,
      color: UI.text,
      strokeThickness: 2,
    });
  }
}

