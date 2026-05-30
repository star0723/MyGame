import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH } from './game/constants';
import type {
  DemonFormDefinition,
  EliteState,
  EliteUpgradeDefinition,
  Enemy,
  GameEffect,
  Minion,
  MinionKind,
  Pickup,
  Projectile,
  UpgradeDefinition,
  VisualRefs,
  World,
} from './game/types';
import { TopStatusBar } from './ui -backup/topStatusBar';
import { MinionLegionBar } from './ui -backup/minionLegionBar';
import { SkillButtonView } from './ui -backup/skillButtonView';
import { SkillWheelView } from './ui -backup/skillWheelView';
import { DemonSlotMachineView } from './ui -backup/demonSlotMachineView';
import { PauseSettingsView } from './ui -backup/pauseSettingsView';
import { EliteUpgradeView } from './ui -backup/eliteUpgradeView';
import { AwakeningView } from './ui -backup/awakeningView';
import { ToastView } from './ui -backup/toastView';
import { ErgonomicZonesOverlay } from './ui -backup/ergonomicZonesOverlay';
import { LegendBarView } from './ui -backup/legendBarView';
import { UI, UI_DEPTH, addIcon, designSize, makePanel, pixelText } from './ui -backup/uiTheme';
import './styles.css';

const emptyVisual = (): VisualRefs => ({});

const previewUpgrades: UpgradeDefinition[] = [
  {
    id: 'preview-bone',
    name: '骨刃增殖',
    description: '召唤骷髅兵并提高近战输出。',
    rarity: 'common',
    apply() {},
  },
  {
    id: 'preview-blood',
    name: '腐血渗流',
    description: '腐血掉落与拾取效率提升。',
    rarity: 'rare',
    apply() {},
  },
  {
    id: 'preview-embryo',
    name: '胚胎抽搐',
    description: '立即获得胚胎值并推动老虎机进度。',
    rarity: 'cursed',
    apply() {},
  },
];

const previewEliteUpgrades: EliteUpgradeDefinition[] = [
  {
    id: 'preview-captain',
    sourceKind: 'skeleton',
    name: '骨骸队长',
    title: '近战精英',
    description: '指定骷髅兵晋升为精英，生命、伤害和攻击范围提高。',
    traits: ['护主', '骨裂', '重甲'],
    apply() {},
  },
  {
    id: 'preview-shrieker',
    sourceKind: 'bat',
    name: '血翼尖啸者',
    title: '弹射精英',
    description: '指定血翼蝠晋升为精英，提高攻速与追击能力。',
    traits: ['吸血', '弹射', '追击'],
    apply() {},
  },
];

const previewDemon: DemonFormDefinition = {
  id: 'boneflame',
  name: '骨焰魔王',
  subtitle: '骸骨 + 王冠 + 地狱火，所有友方小怪获得强化。',
  color: UI.crimsonBright,
  apply() {},
};

class UiBackupPreviewScene extends Phaser.Scene {
  private world!: World;
  private topStatusBar!: TopStatusBar;
  private minionLegion!: MinionLegionBar;
  private skillButton!: SkillButtonView;
  private skillWheel!: SkillWheelView;
  private demonSlot!: DemonSlotMachineView;
  private pauseSettings!: PauseSettingsView;
  private eliteUpgrade!: EliteUpgradeView;
  private awakening!: AwakeningView;
  private toast!: ToastView;
  private zones!: ErgonomicZonesOverlay;
  private legend!: LegendBarView;
  private modeText!: Phaser.GameObjects.Text;
  private slotOpen = false;
  private eliteOpen = false;
  private awakeningOpen = false;
  private pausedOpen = false;
  private wheelOpen = false;
  private lastAction = 'ready';

  constructor() {
    super('UiBackupPreviewScene');
  }

  create(): void {
    this.world = createPreviewWorld();
    this.drawDungeonBackdrop();

    this.zones = new ErgonomicZonesOverlay(this);
    this.topStatusBar = new TopStatusBar(this, () => this.togglePause());
    this.minionLegion = new MinionLegionBar(this, (kind) => this.openWheel(kind));
    this.skillButton = new SkillButtonView(this, () => {
      this.world.player.shockwaveTimer = this.world.player.shockwaveCooldown;
      this.lastAction = 'main-skill';
      this.toast.show('震荡波已释放', 'hero');
    }, { label: '震荡' });
    this.skillWheel = new SkillWheelView(this, (id) => this.toast.show(`选择技能：${id}`, 'system'), () => {
      this.lastAction = 'wheel-close';
      this.wheelOpen = false;
    });
    this.demonSlot = new DemonSlotMachineView(this, {
      onClaim: (reward) => this.toast.show(`领取奖励：${reward.name}`, 'hero'),
      onClose: () => {
        this.lastAction = 'slot-close';
        this.slotOpen = false;
      },
    });
    this.pauseSettings = new PauseSettingsView(this, () => this.togglePause(false));
    this.eliteUpgrade = new EliteUpgradeView(this, (upgrade) => {
      this.toast.show(`晋升：${upgrade.name}`, 'hero');
      this.toggleElite(false);
    });
    this.awakening = new AwakeningView(this);
    this.toast = new ToastView(this);
    this.legend = new LegendBarView(this);

    this.addPreviewControls();
    this.refreshUi();
    this.toast.show('UI Backup Preview：备份 UI 独立预览，不影响正式游戏', 'system');

    this.input.keyboard?.on('keydown-ONE', () => this.toggleSlot());
    this.input.keyboard?.on('keydown-TWO', () => this.toggleElite());
    this.input.keyboard?.on('keydown-THREE', () => this.toggleAwakening());
    this.input.keyboard?.on('keydown-FOUR', () => this.togglePause());
    this.input.keyboard?.on('keydown-Z', () => this.toggleZones());
    this.input.keyboard?.on('keydown-W', () => this.openWheel('skeleton'));
    this.input.keyboard?.on('keydown-S', () => this.world.player.shockwaveTimer = 0);

    Object.assign(window, {
      advanceTime: (ms: number) =>
        new Promise<void>((resolve) => {
          const until = performance.now() + Math.max(0, ms);
          const step = (): void => {
            if (performance.now() >= until) {
              resolve();
            } else {
              requestAnimationFrame(step);
            }
          };
          requestAnimationFrame(step);
        }),
      render_game_to_text: () => JSON.stringify({
        mode: 'ui-backup-preview',
        controls: ['1 slot', '2 elite', '3 awakening', '4 pause', 'W wheel', 'Z zones', 'S reset cooldown'],
        ui: {
          slotOpen: this.slotOpen,
          eliteOpen: this.eliteOpen,
          awakeningOpen: this.awakeningOpen,
          pausedOpen: this.pausedOpen,
          wheelOpen: this.wheelOpen,
          zonesOpen: this.zones.isVisible(),
        },
        lastAction: this.lastAction,
        player: {
          hp: this.world.player.hp,
          embryoValue: this.world.player.embryoValue,
          bloodChips: this.world.economy.bloodChips,
          minions: this.world.minions.length,
          shockwaveTimer: this.world.player.shockwaveTimer,
        },
      }),
    });
  }

  update(_time: number, delta: number): void {
    const dt = delta / 1000;
    this.world.elapsed += dt;
    this.world.time += dt;
    this.world.phaseTime += dt;
    this.world.player.shockwaveTimer = Math.max(0, this.world.player.shockwaveTimer - dt);
    this.world.player.embryoValue = 82 + Math.sin(this.world.elapsed * 1.2) * 9;
    this.world.player.exp = 12 + Math.sin(this.world.elapsed * 1.7) * 4;
    this.world.enemies.forEach((enemy, index) => {
      const a = this.world.elapsed * (0.4 + index * 0.08) + index;
      enemy.x = this.world.player.x + Math.cos(a) * (260 + index * 38);
      enemy.y = this.world.player.y + Math.sin(a * 0.85) * (360 + index * 45);
    });
    this.world.minions.forEach((minion, index) => {
      const a = this.world.elapsed * 0.9 + index * 0.8;
      minion.x = this.world.player.x + Math.cos(a) * minion.orbitRadius * 2.8;
      minion.y = this.world.player.y + Math.sin(a) * minion.orbitRadius * 2.8;
    });
    this.refreshUi();
  }

  private refreshUi(): void {
    this.topStatusBar.update(this.world);
    this.minionLegion.update(this.world);
    this.skillButton.update(this.world);
    this.modeText.setText(
      [
        '预览按键：1 老虎奖励  2 精英晋升  3 觉醒  4 暂停',
        'W 技能轮盘  Z 触控区域  S 重置冷却',
        '正式入口不受影响：本页只加载 src/ui -backup',
      ].join('\n'),
    );
  }

  private drawDungeonBackdrop(): void {
    const { w, h } = designSize(this);
    this.cameras.main.setBackgroundColor('#07050b');
    const frame = makePanel(this, w - 36, h - 46, {
      fill: UI.stoneDeep,
      border: UI.bronze,
      borderWidth: 3,
      radius: 18,
      ornate: true,
    }).setPosition(w / 2, h / 2);
    frame.setDepth(0);

    const floor = this.add.graphics().setDepth(1);
    floor.fillStyle(UI.stone, 1);
    floor.fillRect(42, 134, w - 84, h - 190);
    floor.lineStyle(1, UI.stoneLine, 0.55);
    for (let x = 52; x < w - 46; x += 42) floor.lineBetween(x, 142, x, h - 64);
    for (let y = 144; y < h - 64; y += 34) floor.lineBetween(44, y, w - 44, y);

    const altar = this.add.container(w / 2, 560).setDepth(2);
    const ring = this.add.circle(0, 0, 88, UI.arcaneDim, 0.28).setStrokeStyle(3, UI.arcaneBright, 0.55);
    const corePanel = makePanel(this, 88, 104, { fill: UI.cellDark, border: UI.arcaneBright, borderWidth: 3, radius: 10 });
    addIcon(this, altar, 'core', 0, -4, 66, UI.crimsonBright);
    altar.addAt(ring, 0);
    altar.addAt(corePanel, 1);

    this.drawPreviewActor(245, 302, 'shield', UI.shield, '友方');
    this.drawPreviewActor(458, 270, 'sword', UI.goldBright, '敌人');
    this.drawPreviewActor(312, 656, 'goblin', UI.flame, '护卫');
    this.drawPreviewActor(486, 672, 'bat', UI.arcaneBright, '精英');
    this.drawPreviewActor(234, 870, 'skull', UI.bone, '骷髅');
    this.drawPreviewActor(522, 458, 'skull', UI.bone, '敌人');
  }

  private drawPreviewActor(x: number, y: number, icon: Parameters<typeof addIcon>[2], color: number, label: string): void {
    const c = this.add.container(x, y).setDepth(3);
    c.add(this.add.ellipse(0, 24, 46, 16, UI.void, 0.35));
    const medal = makePanel(this, 50, 58, { fill: UI.cellDark, border: color, borderWidth: 2, radius: 7, ornate: false });
    addIcon(this, c, icon, 0, -2, 34, color);
    c.addAt(medal, 1);
    c.add(pixelText(this, 0, 40, label, { size: 11, color: UI.textDim, align: 'center' }).setOrigin(0.5));
  }

  private addPreviewControls(): void {
    const panel = makePanel(this, 532, 68, {
      fill: UI.ink,
      border: UI.bronze,
      borderWidth: 2,
      radius: 6,
      ornate: false,
    }).setPosition(354, 182);
    panel.setDepth(UI_DEPTH.hud - 1);
    this.modeText = pixelText(this, 354, 182, '', {
      size: 14,
      color: UI.text,
      align: 'center',
      wordWrap: 500,
    }).setOrigin(0.5).setDepth(UI_DEPTH.hud);

    const buttons = [
      { x: 80, y: 252, label: 'Slot', action: () => this.toggleSlot() },
      { x: 160, y: 252, label: 'Elite', action: () => this.toggleElite() },
      { x: 248, y: 252, label: 'Awake', action: () => this.toggleAwakening() },
      { x: 342, y: 252, label: 'Pause', action: () => this.togglePause() },
      { x: 436, y: 252, label: 'Wheel', action: () => this.openWheel('skeleton') },
      { x: 530, y: 252, label: 'Zones', action: () => this.toggleZones() },
    ];
    buttons.forEach((button) => {
      const bg = makePanel(this, 70, 34, { fill: UI.panelSoft, border: UI.bronze, radius: 5, ornate: false }).setPosition(button.x, button.y);
      bg.setDepth(UI_DEPTH.hud);
      bg.setInteractive(new Phaser.Geom.Rectangle(-35, -17, 70, 34), Phaser.Geom.Rectangle.Contains);
      if (bg.input) bg.input.cursor = 'pointer';
      bg.on('pointerdown', button.action);
      pixelText(this, button.x, button.y, button.label, { size: 12, color: UI.textGold, bold: true, align: 'center' })
        .setOrigin(0.5)
        .setDepth(UI_DEPTH.hud + 1);
    });
  }

  private toggleSlot(force?: boolean): void {
    this.slotOpen = force ?? !this.slotOpen;
    if (this.slotOpen) {
      this.closeModalOverlays('slot');
      this.demonSlot.show(previewUpgrades);
      this.demonSlot.setDebugResult(['★', '★', '◆']);
    } else {
      this.demonSlot.hide();
    }
  }

  private toggleElite(force?: boolean): void {
    this.eliteOpen = force ?? !this.eliteOpen;
    if (this.eliteOpen) {
      this.closeModalOverlays('elite');
      this.eliteUpgrade.show(previewEliteUpgrades, 200);
    } else {
      this.eliteUpgrade.hide();
    }
  }

  private toggleAwakening(force?: boolean): void {
    this.awakeningOpen = force ?? !this.awakeningOpen;
    if (this.awakeningOpen) {
      this.closeModalOverlays('awakening');
      this.awakening.showRolling();
      this.time.delayedCall(700, () => {
        if (this.awakeningOpen) this.awakening.showResult(previewDemon);
      });
    } else {
      this.awakening.hide();
    }
  }

  private togglePause(force?: boolean): void {
    this.pausedOpen = force ?? !this.pausedOpen;
    if (this.pausedOpen) {
      this.closeModalOverlays('pause');
      this.pauseSettings.show();
    } else {
      this.pauseSettings.hide();
    }
  }

  private openWheel(_kind: MinionKind): void {
    this.closeModalOverlays('wheel');
    this.wheelOpen = true;
    this.lastAction = 'wheel-open';
    this.skillWheel.showAt(310, 626);
  }

  private toggleZones(): void {
    this.zones.toggle();
    this.lastAction = this.zones.isVisible() ? 'zones-open' : 'zones-close';
  }

  private closeModalOverlays(except?: 'slot' | 'elite' | 'awakening' | 'pause' | 'wheel'): void {
    this.toast.clear();
    if (except !== 'slot') {
      this.slotOpen = false;
      this.demonSlot.hide();
    }
    if (except !== 'elite') {
      this.eliteOpen = false;
      this.eliteUpgrade.hide();
    }
    if (except !== 'awakening') {
      this.awakeningOpen = false;
      this.awakening.hide();
    }
    if (except !== 'pause') {
      this.pausedOpen = false;
      this.pauseSettings.hide();
    }
    if (except !== 'wheel') this.skillWheel.hide();
  }
}

function createPreviewWorld(): World {
  const playerX = 900;
  const playerY = 1300;
  const minions: Minion[] = [
    createPreviewMinion(1, 'skeleton', playerX - 160, playerY - 80, 0, 25, 32),
    createPreviewMinion(2, 'skeleton', playerX + 140, playerY - 40, 1, 18, 30, {
      id: 'elite-skeleton',
      title: '骨骸队长',
      traits: [],
    }),
    createPreviewMinion(3, 'bat', playerX + 80, playerY + 170, 2, 22, 28),
    createPreviewMinion(4, 'bat', playerX - 210, playerY + 120, 3, 20, 28, {
      id: 'elite-bat',
      title: '血翼尖啸者',
      traits: [],
    }),
    createPreviewMinion(5, 'goblin', playerX + 230, playerY + 60, 4, 30, 34),
    createPreviewMinion(6, 'slime', playerX - 110, playerY + 230, 5, 28, 32),
  ];
  const enemies: Enemy[] = [
    createPreviewEnemy(100, playerX - 360, playerY - 430, false, 42, 60),
    createPreviewEnemy(101, playerX + 360, playerY - 360, false, 36, 60),
    createPreviewEnemy(102, playerX + 420, playerY + 210, false, 48, 60),
    createPreviewEnemy(103, playerX - 280, playerY + 340, false, 22, 60),
    createPreviewEnemy(104, playerX + 40, playerY - 560, true, 820, 1200),
  ];
  const pickups: Pickup[] = Array.from({ length: 8 }, (_, i) => ({
    id: 200 + i,
    x: playerX + Math.cos(i * 0.8) * (180 + i * 30),
    y: playerY + Math.sin(i * 0.8) * (220 + i * 22),
    value: 1,
    life: 5,
    maxLife: 5,
    magnetized: false,
    active: true,
    visual: emptyVisual(),
  }));

  return {
    phase: 'playing',
    phaseReason: 'preview',
    phaseTime: 0,
    time: 0,
    elapsed: 0,
    combo: 8,
    comboTimer: 1.2,
    nextId: 300,
    player: {
      x: playerX,
      y: playerY,
      vx: 0,
      vy: 0,
      hp: 928,
      maxHp: 1200,
      speed: 210,
      radius: 22,
      pickupRadius: 92,
      embryoValue: 82,
      embryoMax: 100,
      exp: 12,
      level: 12,
      shockwaveCooldown: 5,
      shockwaveTimer: 0,
      isDemon: false,
      visual: emptyVisual(),
    },
    minions,
    enemies,
    projectiles: [] as Projectile[],
    pickups,
    altars: [],
    floatingTexts: [],
    effects: [] as GameEffect[],
    stats: {
      kills: 126,
      bloodCollected: 356,
      chipsSpent: 200,
      eliteUpgrades: 2,
      maxCombo: 31,
      bossDefeated: false,
      sacrifices: 4,
    },
    economy: {
      bloodChips: 356,
      pendingSlot: true,
      pendingEliteUpgrade: true,
      slotRolls: 3,
      eliteRolls: 1,
    },
    progress: {
      stage: 'mid',
      nextAltarAt: 40,
    },
    modifiers: {
      skeletonDamage: 1.2,
      batAttackSpeed: 1.2,
      pickupRadiusBonus: 28,
      bloodDropBonus: 0.2,
      minionLimit: 12,
    },
    demon: {
      awakened: false,
      rampageTimer: 0,
      bossSpawnTimer: 28,
    },
    boss: {
      phase: 'idle',
      phaseTimer: 0,
      skillCooldown: 8,
      enraged: false,
      chargeDir: { x: 0, y: 1 },
    },
  };
}

function createPreviewMinion(
  id: number,
  kind: MinionKind,
  x: number,
  y: number,
  index: number,
  hp: number,
  maxHp: number,
  elite?: EliteState,
): Minion {
  return {
    id,
    kind,
    x,
    y,
    slotAngle: index,
    orbitRadius: kind === 'bat' ? 92 : 68,
    hp,
    maxHp,
    damage: kind === 'bat' ? 8 : 12,
    attackRange: kind === 'bat' ? 72 : 48,
    attackCooldown: kind === 'bat' ? 0.62 : 0.95,
    attackTimer: 0,
    speed: kind === 'bat' ? 240 : 190,
    kills: 4 + index * 2,
    alive: true,
    elite,
    visual: emptyVisual(),
  };
}

function createPreviewEnemy(id: number, x: number, y: number, isBoss: boolean, hp: number, maxHp: number): Enemy {
  return {
    id,
    kind: isBoss ? 'paladinBoss' : 'militia',
    x,
    y,
    vx: 0,
    vy: 0,
    hp,
    maxHp,
    speed: isBoss ? 90 : 120,
    damage: isBoss ? 18 : 7,
    radius: isBoss ? 36 : 18,
    attackRange: isBoss ? 64 : 32,
    attackCooldown: isBoss ? 1.2 : 0.85,
    attackTimer: 0,
    flashTimer: 0,
    knockbackX: 0,
    knockbackY: 0,
    alive: true,
    isBoss,
    nextSkillTimer: isBoss ? 4 : 0,
    visual: emptyVisual(),
  };
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#07050b',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [UiBackupPreviewScene],
};

const game = new Phaser.Game(config);

Object.defineProperty(window, '__UI_BACKUP_PREVIEW_GAME__', {
  value: game,
  configurable: true,
});
