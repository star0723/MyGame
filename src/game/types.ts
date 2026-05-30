import type Phaser from 'phaser';

export type RunPhase =
  | 'playing'
  | 'slot_roll'
  | 'elite_upgrade'
  | 'awakening'
  | 'demon_rampage'
  | 'boss'
  | 'result';

export type EnemyKind = 'militia' | 'archer' | 'paladinBoss';
export type MinionKind = 'skeleton' | 'bat' | 'slime' | 'goblin';
export type UpgradeRarity = 'common' | 'rare' | 'cursed';
export type DemonFormId = 'boneflame' | 'bloodwing' | 'corrosion';

export interface VisualRefs {
  body?: Phaser.GameObjects.GameObject & { setPosition(x: number, y: number): unknown };
  shadow?: Phaser.GameObjects.Ellipse;
  label?: Phaser.GameObjects.Text;
}

export interface PlayerCore {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  radius: number;
  pickupRadius: number;
  embryoValue: number;
  embryoMax: number;
  exp: number;
  level: number;
  shockwaveCooldown: number;
  shockwaveTimer: number;
  isDemon: boolean;
  visual: VisualRefs;
}

export interface AppliedTrait {
  id: string;
  name: string;
  color: number;
  multiplier: number;
  stacks: number;
}

export interface EliteState {
  id: string;
  title: string;
  traits: AppliedTrait[];
  reviveTimer?: number;
}

export interface Minion {
  id: number;
  kind: MinionKind;
  x: number;
  y: number;
  slotAngle: number;
  orbitRadius: number;
  hp: number;
  maxHp: number;
  damage: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  speed: number;
  targetId?: number;
  kills: number;
  alive: boolean;
  deathTimer?: number;
  elite?: EliteState;
  visual: VisualRefs;
}

export interface EnemyEliteState {
  kind: 'clone' | 'strength' | 'recovery' | 'shield';
  skillTimer: number;
}

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  attackRange: number;
  attackCooldown: number;
  attackTimer: number;
  flashTimer: number;
  knockbackX: number;
  knockbackY: number;
  alive: boolean;
  isBoss: boolean;
  elite?: EnemyEliteState;
  deathTimer?: number;
  nextSkillTimer: number;
  visual: VisualRefs;
}

export type BossPhase = 'idle' | 'charge' | 'summon' | 'pulse' | 'enraged';

export interface BossRuntime {
  phase: BossPhase;
  phaseTimer: number;
  skillCooldown: number;
  enraged: boolean;
  chargeDir: { x: number; y: number };
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  life: number;
  owner: 'player' | 'enemy';
  active: boolean;
  visual: VisualRefs;
}

export interface Pickup {
  id: number;
  x: number;
  y: number;
  value: number;
  life: number;
  maxLife: number;
  magnetized: boolean;
  active: boolean;
  visual: VisualRefs;
}

export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  life: number;
  active: boolean;
  visual: VisualRefs;
}

export interface GameEffect {
  id: number;
  x: number;
  y: number;
  radius: number;
  life: number;
  kind: 'hit' | 'kill' | 'shockwave' | 'awakening';
  active: boolean;
  visual: VisualRefs;
}

export type AltarKind = 'blood' | 'slot';

export interface Altar {
  id: number;
  x: number;
  y: number;
  radius: number;
  captureProgress: number;
  captureTime: number;
  active: boolean;
  kind: AltarKind;
  visual: VisualRefs;
}

export interface RunStats {
  kills: number;
  bloodCollected: number;
  chipsSpent: number;
  eliteUpgrades: number;
  maxCombo: number;
  bossDefeated: boolean;
  sacrifices: number;
}

export interface RunEconomy {
  bloodChips: number;
  pendingSlot: boolean;
  pendingEliteUpgrade: boolean;
  slotRolls: number;
  eliteRolls: number;
}

export type RunStage = 'early' | 'mid' | 'final' | 'boss';

export interface RunProgress {
  stage: RunStage;
  nextAltarAt: number;
}

export interface RunModifiers {
  skeletonDamage: number;
  batAttackSpeed: number;
  pickupRadiusBonus: number;
  bloodDropBonus: number;
  minionLimit: number;
}

export interface DemonState {
  form?: DemonFormId;
  name?: string;
  awakened: boolean;
  rampageTimer: number;
  bossSpawnTimer: number;
}

export interface World {
  phase: RunPhase;
  phaseReason: string;
  phaseTime: number;
  time: number;
  elapsed: number;
  combo: number;
  comboTimer: number;
  nextId: number;
  player: PlayerCore;
  minions: Minion[];
  enemies: Enemy[];
  projectiles: Projectile[];
  pickups: Pickup[];
  altars: Altar[];
  floatingTexts: FloatingText[];
  effects: GameEffect[];
  stats: RunStats;
  economy: RunEconomy;
  progress: RunProgress;
  modifiers: RunModifiers;
  demon: DemonState;
  boss?: BossRuntime;
}

export interface InputSnapshot {
  moveX: number;
  moveY: number;
  shockwavePressed: boolean;
  pausePressed: boolean;
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  rarity: UpgradeRarity;
  apply(world: World): void;
}

export interface EliteUpgradeDefinition {
  id: string;
  sourceKind: MinionKind;
  name: string;
  title: string;
  description: string;
  traits: string[];
  apply(minion: Minion, world: World): void;
}

export interface DemonFormDefinition {
  id: DemonFormId;
  name: string;
  subtitle: string;
  color: number;
  apply(world: World): void;
}
