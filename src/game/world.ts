import { PLAYER_BASE, RUN_RULES, WORLD_BOUNDS } from './constants';
import type { Minion, MinionKind, World } from './types';

const STARTING_MINIONS: MinionKind[] = ['skeleton', 'skeleton', 'skeleton', 'bat', 'bat', 'bat'];

export function createWorld(): World {
  const world: World = {
    phase: 'playing',
    phaseReason: 'new-run',
    phaseTime: 0,
    time: 0,
    elapsed: 0,
    combo: 0,
    comboTimer: 0,
    nextId: 1,
    player: {
      x: WORLD_BOUNDS.width / 2,
      y: WORLD_BOUNDS.height / 2,
      vx: 0,
      vy: 0,
      hp: PLAYER_BASE.hp,
      maxHp: PLAYER_BASE.hp,
      speed: PLAYER_BASE.speed,
      radius: PLAYER_BASE.radius,
      pickupRadius: PLAYER_BASE.pickupRadius,
      embryoValue: 0,
      embryoMax: RUN_RULES.embryoMax,
      exp: 0,
      level: 1,
      shockwaveCooldown: PLAYER_BASE.shockwaveCooldown,
      shockwaveTimer: 0,
      isDemon: false,
      visual: {},
    },
    minions: [],
    enemies: [],
    projectiles: [],
    pickups: [],
    altars: [],
    floatingTexts: [],
    effects: [],
    stats: {
      kills: 0,
      bloodCollected: 0,
      chipsSpent: 0,
      eliteUpgrades: 0,
      maxCombo: 0,
      bossDefeated: false,
      sacrifices: 0,
    },
    economy: {
      bloodChips: 0,
      pendingSlot: false,
      pendingEliteUpgrade: false,
      slotRolls: 0,
      eliteRolls: 0,
    },
    progress: {
      stage: 'early',
      nextAltarAt: 40,
    },
    modifiers: {
      skeletonDamage: 1,
      batAttackSpeed: 1,
      pickupRadiusBonus: 0,
      bloodDropBonus: 0,
      minionLimit: 12,
    },
    demon: {
      awakened: false,
      rampageTimer: 0,
      bossSpawnTimer: RUN_RULES.bossSpawnDelayAfterDemon,
    },
  };

  STARTING_MINIONS.forEach((kind, index) => {
    world.minions.push(createMinion(world, kind, index, STARTING_MINIONS.length));
  });

  return world;
}

export function nextId(world: World): number {
  const id = world.nextId;
  world.nextId += 1;
  return id;
}

export function createMinion(world: World, kind: MinionKind, index: number, total: number): Minion {
  const angle = (Math.PI * 2 * index) / Math.max(total, 1);
  const orbitRadius = kind === 'bat' ? 92 : kind === 'goblin' ? 76 : kind === 'slime' ? 64 : 68;
  const baseDamage = kind === 'skeleton' ? 12 : kind === 'goblin' ? 9 : kind === 'slime' ? 6 : 7;
  const cooldown = kind === 'bat' ? 0.62 : kind === 'goblin' ? 0.72 : kind === 'slime' ? 1.15 : 0.95;
  const maxHp = kind === 'slime' ? 45 : kind === 'goblin' ? 22 : 25;
  const speed = kind === 'bat' ? 240 : kind === 'goblin' ? 230 : kind === 'slime' ? 145 : 190;
  const range = kind === 'bat' ? 72 : kind === 'goblin' ? 58 : kind === 'slime' ? 42 : 48;

  return {
    id: nextId(world),
    kind,
    x: world.player.x + Math.cos(angle) * orbitRadius,
    y: world.player.y + Math.sin(angle) * orbitRadius,
    slotAngle: angle,
    orbitRadius,
    hp: maxHp,
    maxHp,
    damage: baseDamage,
    attackRange: range,
    attackCooldown: cooldown,
    attackTimer: Math.random() * cooldown,
    speed,
    kills: 0,
    alive: true,
    visual: {},
  };
}
