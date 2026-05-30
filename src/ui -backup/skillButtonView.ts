import Phaser from 'phaser';
import type { Enemy, Minion, Pickup, World } from '../game/types';
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
} from './uiTheme';

interface Dot {
  obj: Phaser.GameObjects.Arc;
  kind: 'enemy' | 'ally' | 'core' | 'blood';
}

export class SkillButtonView {
  private readonly scene: Phaser.Scene;
  private readonly onPress: () => void;
  private readonly root: Phaser.GameObjects.Container;
  private readonly mainButton: Phaser.GameObjects.Container;
  private readonly mainHit: Phaser.GameObjects.Arc;
  private readonly sweep: Phaser.GameObjects.Graphics;
  private readonly mainGlyph: Phaser.GameObjects.Container;
  private readonly auxButtons: Phaser.GameObjects.Container[] = [];
  private joystickKnob!: Phaser.GameObjects.Container;
  private readonly radarDots: Dot[] = [];
  private readonly radarPanel: Phaser.GameObjects.Container;
  private radarPlot!: Phaser.GameObjects.Rectangle;
  private readonly cooldownText: Phaser.GameObjects.Text;
  private readonly radius = 58;
  private ratio = 0;

  constructor(scene: Phaser.Scene, onPress: () => void, opts: { label?: string } = {}) {
    this.scene = scene;
    this.onPress = onPress;
    const { w, h } = designSize(scene);
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(UI_DEPTH.skillButton);

    this.radarPanel = this.buildRadar(w - SAFE.side - 58, 610);
    this.root.add(this.radarPanel);

    const joyX = w - SAFE.side - 132;
    const joyY = h - SAFE.bottom - 118;
    this.buildJoystick(joyX, joyY);

    this.mainButton = this.buildMainSkill(w - SAFE.side - 83, h - SAFE.bottom - 182, opts.label ?? '震荡');
    this.root.add(this.mainButton);

    this.auxButtons.push(this.buildAuxButton(joyX - 116, joyY - 8, 'bat', UI.arcaneBright, '召唤'));
    this.auxButtons.push(this.buildAuxButton(joyX + 108, joyY - 88, 'shield', UI.shield, '护盾'));
    this.auxButtons.push(this.buildAuxButton(joyX - 28, joyY - 142, 'embryo', UI.arcaneBright, '腐蚀'));
    this.root.add(this.auxButtons);

    const hintBox = makePanel(scene, 226, 58, {
      fill: UI.ink,
      border: UI.bronze,
      borderWidth: 2,
      radius: 6,
      ornate: false,
    }).setPosition(w - SAFE.side - 178, h - SAFE.bottom - 28);
    const finger = pixelText(scene, w - SAFE.side - 270, h - SAFE.bottom - 48, '☝', {
      size: 26,
      color: UI.textGold,
      strokeThickness: 2,
    }).setOrigin(0.5);
    const hint = pixelText(scene, w - SAFE.side - 168, h - SAFE.bottom - 38, '长按技能按钮', {
      size: 16,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    const subHint = pixelText(scene, w - SAFE.side - 168, h - SAFE.bottom - 16, '打开技能面板 / 释放强化技能', {
      size: 12,
      color: UI.text,
      align: 'center',
    }).setOrigin(0.5);
    this.root.add([hintBox, finger, hint, subHint]);

    this.sweep = scene.add.graphics();
    this.mainButton.add(this.sweep);
    this.mainGlyph = this.mainButton.getByName('mainGlyph') as Phaser.GameObjects.Container;
    this.mainHit = scene.add.circle(0, 0, this.radius, UI.void, 0.001).setInteractive({ useHandCursor: true });
    this.mainHit.on('pointerdown', () => this.handlePress());
    this.mainButton.add(this.mainHit);
    this.cooldownText = pixelText(scene, 0, 74, '', {
      size: 14,
      color: UI.textCrimson,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    this.mainButton.add(this.cooldownText);
    this.setCooldownRatio(0);
  }

  private buildRadar(x: number, y: number): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const panel = makePanel(this.scene, 84, 250, {
      fill: UI.ink,
      border: UI.bronze,
      radius: 8,
      ornate: true,
    });
    this.radarPlot = this.scene.add.rectangle(0, 0, 54, 204, UI.stoneDeep, 1).setStrokeStyle(2, UI.bronzeDark, 0.95);
    const maskLines = this.scene.add.graphics();
    maskLines.lineStyle(1, UI.stoneLine, 0.45);
    for (let yy = -78; yy <= 78; yy += 39) {
      maskLines.lineBetween(-22, yy, 22, yy);
    }
    maskLines.lineBetween(0, -98, 0, 98);
    const core = this.scene.add.circle(0, 0, 5, UI.arcaneBright, 1).setStrokeStyle(1, UI.bone, 0.8);
    c.add([panel, this.radarPlot, maskLines, core]);

    for (let i = 0; i < 22; i++) {
      const dot = this.scene.add.circle(0, 0, 2.5, UI.blood, 1).setVisible(false);
      this.radarDots.push({ obj: dot, kind: 'enemy' });
      c.add(dot);
    }

    const title = pixelText(this.scene, 0, -142, '雷达', {
      size: 13,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    c.add(title);
    return c;
  }

  private buildJoystick(x: number, y: number): void {
    const base = this.scene.add.container(x, y);
    const outer = makeMedallion(this.scene, 76, {
      fill: UI.panelSoft,
      ring: UI.bronze,
      ringWidth: 5,
      glow: UI.void,
      glowAlpha: 0.28,
    });
    const arrows = [
      pixelText(this.scene, 0, -52, '▲', { size: 20, color: UI.textGold }).setOrigin(0.5),
      pixelText(this.scene, 0, 52, '▼', { size: 20, color: UI.textGold }).setOrigin(0.5),
      pixelText(this.scene, -52, 0, '◀', { size: 20, color: UI.textGold }).setOrigin(0.5),
      pixelText(this.scene, 52, 0, '▶', { size: 20, color: UI.textGold }).setOrigin(0.5),
    ];
    this.joystickKnob = makeMedallion(this.scene, 36, {
      fill: UI.steel,
      ring: UI.boneDim,
      ringWidth: 4,
      glow: UI.void,
      glowAlpha: 0.1,
    });
    addIcon(this.scene, this.joystickKnob, 'skull', 0, 0, 34, UI.void);
    base.add([outer, ...arrows, this.joystickKnob]);
    this.root.add(base);
  }

  private buildMainSkill(x: number, y: number, label: string): Phaser.GameObjects.Container {
    const c = this.scene.add.container(x, y);
    const medal = makeMedallion(this.scene, this.radius, {
      fill: UI.crimsonBright,
      ring: UI.gold,
      ringWidth: 5,
      glow: UI.blood,
      glowAlpha: 0.22,
    });
    const glyph = addIcon(this.scene, c, 'slash', 0, -2, 54, UI.goldBright);
    glyph.setName('mainGlyph');
    const text = pixelText(this.scene, 0, 58, label, {
      size: 14,
      color: UI.textGold,
      bold: true,
      align: 'center',
    }).setOrigin(0.5);
    c.addAt(medal, 0);
    c.add(text);
    return c;
  }

  private buildAuxButton(
    x: number,
    y: number,
    icon: Parameters<typeof addIcon>[2],
    color: number,
    label: string,
  ): Phaser.GameObjects.Container {
    const c = makeMedallion(this.scene, 42, {
      fill: UI.cellDark,
      ring: color,
      ringWidth: 4,
      glow: color,
      glowAlpha: 0.16,
    }).setPosition(x, y);
    addIcon(this.scene, c, icon, 0, -2, 36, color);
    c.add(pixelText(this.scene, 0, 48, label, {
      size: 12,
      color: UI.textDim,
      align: 'center',
    }).setOrigin(0.5));
    enableHit(c, 84, 96);
    c.on('pointerdown', () => {
      this.scene.tweens.add({ targets: c, scale: 0.9, duration: 70, yoyo: true });
    });
    return c;
  }

  update(world: World): void {
    const cd = world.player.shockwaveCooldown || 1;
    this.setCooldownRatio(world.player.shockwaveTimer / cd);
    this.updateRadar(world);
    const pulse = 1 + Math.sin(world.elapsed * 4) * 0.025;
    this.joystickKnob.setScale(pulse);
  }

  setCooldownRatio(ratio: number): void {
    this.ratio = Phaser.Math.Clamp(ratio, 0, 1);
    const ready = this.ratio <= 0;
    this.mainGlyph.setAlpha(ready ? 1 : 0.38);
    this.cooldownText.setText(ready ? '' : `${Math.ceil(this.ratio * 5)}s`);

    this.sweep.clear();
    if (!ready) {
      this.sweep.fillStyle(UI.void, 0.46);
      this.sweep.fillCircle(0, 0, this.radius - 3);
      const start = -Math.PI / 2;
      const end = start + this.ratio * Math.PI * 2;
      this.sweep.fillStyle(UI.void, 0.8);
      this.sweep.slice(0, 0, this.radius - 3, start, end, false);
      this.sweep.fillPath();
    }
  }

  private updateRadar(world: World): void {
    const px = world.player.x;
    const py = world.player.y;
    let index = 0;
    const place = (x: number, y: number, color: number, radius: number): void => {
      const dot = this.radarDots[index++]?.obj;
      if (!dot) return;
      const dx = Phaser.Math.Clamp((x - px) / 900, -1, 1);
      const dy = Phaser.Math.Clamp((y - py) / 1300, -1, 1);
      dot.setPosition(dx * 24, dy * 94).setFillStyle(color, 1).setRadius(radius).setVisible(true);
    };

    world.enemies
      .filter((e: Enemy) => e.alive)
      .slice(0, 10)
      .forEach((e) => place(e.x, e.y, e.isBoss ? UI.crimsonBright : UI.blood, e.isBoss ? 4 : 2.5));
    world.minions
      .filter((m: Minion) => m.alive)
      .slice(0, 6)
      .forEach((m) => place(m.x, m.y, m.elite ? UI.arcaneBright : UI.flame, m.elite ? 3.5 : 2.5));
    world.pickups
      .filter((p: Pickup) => p.active)
      .slice(0, 5)
      .forEach((p) => place(p.x, p.y, UI.blood, 2.1));

    for (; index < this.radarDots.length; index++) {
      this.radarDots[index].obj.setVisible(false);
    }
  }

  private handlePress(): void {
    if (this.ratio <= 0) {
      this.onPress();
      this.scene.tweens.add({
        targets: this.mainButton,
        scale: 1.08,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut',
      });
    } else {
      this.scene.tweens.add({
        targets: this.mainButton,
        x: this.mainButton.x + 4,
        duration: 45,
        yoyo: true,
        repeat: 1,
      });
    }
  }

  destroy(): void {
    this.mainHit.removeAllListeners();
    for (const b of this.auxButtons) b.removeAllListeners();
    this.scene.tweens.killTweensOf(this.mainButton);
    this.root.destroy(true);
  }
}
