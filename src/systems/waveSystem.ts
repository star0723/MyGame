import Phaser from 'phaser';
import { ENEMY_CONFIGS } from '../data/enemies';
import { WORLD_BOUNDS } from '../game/constants';
import type { Enemy, EnemyKind, World } from '../game/types';
import { nextId } from '../game/world';
import { randomRange } from '../utils/math';

let spawnTimer = 0;

export function resetWaveSystem(): void {
  spawnTimer = 2;
}

export function getStageEnemyCap(world: World): number {
  switch (world.progress.stage) {
    case 'early': return 18;
    case 'mid': return 26;
    case 'final': return 34;
    case 'boss': return 28;
  }
}

export function updateWaveSystem(world: World, dt: number): void {
  if (!['playing', 'demon_rampage', 'boss'].includes(world.phase)) return;
  if (world.enemies.some((enemy) => enemy.isBoss)) return;

  spawnTimer -= dt;
  if (spawnTimer > 0) return;

  const liveEnemies = world.enemies.filter((enemy) => enemy.alive && !enemy.isBoss).length;
  const cap = getStageEnemyCap(world);
  const room = Math.max(0, cap - liveEnemies);
  if (room <= 0) {
    spawnTimer = 1;
    return;
  }

  const pressure = Math.min(6, 2 + Math.floor(world.elapsed / 35));
  const spawnCount = Math.min(room, world.phase === 'demon_rampage' ? pressure + 1 : pressure);
  for (let i = 0; i < spawnCount; i += 1) {
    spawnEnemy(world, Math.random() > 0.78 ? 'archer' : 'militia');
  }

  spawnTimer = Math.max(0.8, 2.4 - world.elapsed * 0.01);
}

export function spawnEnemy(
  world: World,
  kind: EnemyKind,
  position?: { x: number; y: number },
  opts: { forceElite?: boolean } = {},
): Enemy {
  const config = ENEMY_CONFIGS[kind];
  const spawnPosition = position ?? randomEdgePosition(world.player.x, world.player.y);
  const enemy: Enemy = {
    id: nextId(world),
    kind,
    x: spawnPosition.x,
    y: spawnPosition.y,
    vx: 0,
    vy: 0,
    hp: config.hp,
    maxHp: config.hp,
    speed: config.speed,
    damage: config.damage,
    radius: config.radius,
    attackRange: config.attackRange,
    attackCooldown: config.attackCooldown,
    attackTimer: randomRange(0, config.attackCooldown),
    flashTimer: 0,
    knockbackX: 0,
    knockbackY: 0,
    alive: true,
    isBoss: kind === 'paladinBoss',
    nextSkillTimer: kind === 'paladinBoss' ? 4 : 0,
    visual: {},
  };

  if (opts.forceElite || shouldSpawnElite(world, enemy)) {
    makeEliteEnemy(enemy);
  }

  world.enemies.push(enemy);
  return enemy;
}

function shouldSpawnElite(world: World, enemy: Enemy): boolean {
  if (enemy.isBoss || world.progress.stage === 'early') return false;
  const chance = world.progress.stage === 'mid' ? 0.12 : 0.2;
  return Math.random() < chance;
}

function makeEliteEnemy(enemy: Enemy): void {
  const kinds: NonNullable<Enemy['elite']>['kind'][] = ['clone', 'strength', 'recovery', 'shield'];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];
  enemy.elite = { kind, skillTimer: 4 };
  enemy.maxHp *= 1.6;
  enemy.hp = enemy.maxHp;
  enemy.damage *= 1.35;
  enemy.speed *= kind === 'shield' ? 0.92 : 1.06;
}

function randomEdgePosition(playerX: number, playerY: number): Phaser.Math.Vector2 {
  const side = Math.floor(Math.random() * 4);
  const margin = 160;
  let x = playerX;
  let y = playerY;

  if (side === 0) {
    x = randomRange(0, WORLD_BOUNDS.width);
    y = -margin;
  } else if (side === 1) {
    x = WORLD_BOUNDS.width + margin;
    y = randomRange(0, WORLD_BOUNDS.height);
  } else if (side === 2) {
    x = randomRange(0, WORLD_BOUNDS.width);
    y = WORLD_BOUNDS.height + margin;
  } else {
    x = -margin;
    y = randomRange(0, WORLD_BOUNDS.height);
  }

  return new Phaser.Math.Vector2(
    Math.max(-margin, Math.min(WORLD_BOUNDS.width + margin, x)),
    Math.max(-margin, Math.min(WORLD_BOUNDS.height + margin, y)),
  );
}
