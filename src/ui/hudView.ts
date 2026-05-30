import Phaser from 'phaser';
import { COLORS } from '../game/constants';
import type { World } from '../game/types';

export class HudView {
  private container: Phaser.GameObjects.Container;
  private hpText: Phaser.GameObjects.Text;
  private expText: Phaser.GameObjects.Text;
  private embryoText: Phaser.GameObjects.Text;
  private chipsText: Phaser.GameObjects.Text;
  private phaseText: Phaser.GameObjects.Text;
  private bossText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.container = scene.add.container(24, 18).setDepth(10000);
    const panel = scene.add.rectangle(0, 0, 430, 150, 0x100812, 0.78).setOrigin(0, 0);
    panel.setStrokeStyle(2, 0x7e1b36, 0.9);
    this.hpText = this.makeLine(scene, 18, 14);
    this.expText = this.makeLine(scene, 18, 42);
    this.embryoText = this.makeLine(scene, 18, 70);
    this.chipsText = this.makeLine(scene, 18, 98);
    this.phaseText = this.makeLine(scene, 18, 126);
    this.bossText = scene.add.text(360, 26, '', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#fff0d1',
      backgroundColor: '#481a22',
      padding: { x: 12, y: 6 },
    });
    this.bossText.setOrigin(0.5, 0).setDepth(10000);

    this.container.add([panel, this.hpText, this.expText, this.embryoText, this.chipsText, this.phaseText]);
  }

  update(world: World): void {
    this.hpText.setText(`核心生命 ${Math.max(0, Math.ceil(world.player.hp))}/${world.player.maxHp}`);
    this.expText.setText(`腐血经验 ${Math.floor(world.player.exp)}  等级 ${world.player.level}`);
    this.embryoText.setText(`胚胎值 ${Math.floor(world.player.embryoValue)}/${world.player.embryoMax}`);
    this.chipsText.setText(
      `筹码 ${world.economy.bloodChips}  小怪 ${world.minions.length}  精英 ${world.stats.eliteUpgrades}`,
    );
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
    return scene.add.text(x, y, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: COLORS.uiText,
    });
  }
}
