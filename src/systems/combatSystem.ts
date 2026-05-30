import { ENEMY_CONFIGS } from '../data/enemies';
import { RUN_RULES } from '../game/constants';
import type { World } from '../game/types';
import { distanceSq, normalize } from '../utils/math';
import { spawnFloatingText } from './fxSystem';

export function updateCombatSystem(world: World, dt: number): void {
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    if (enemy.hp > 0) continue;

    enemy.alive = false;
    enemy.deathTimer = 0.6;
    world.stats.kills += 1;
    world.combo += 1;
    world.comboTimer = 2.5;
    world.stats.maxCombo = Math.max(world.stats.maxCombo, world.combo);
    if (enemy.isBoss) {
      world.stats.bossDefeated = true;
      world.phase = 'result';
      world.boss = undefined;
    }

    const dropBase = ENEMY_CONFIGS[enemy.kind].bloodDrop;
    const value = Math.ceil(dropBase * (1 + world.modifiers.bloodDropBonus));
    world.pickups.push({
      id: world.nextId++,
      x: enemy.x,
      y: enemy.y,
      value,
      life: 4,
      maxLife: 4,
      magnetized: false,
      active: true,
      visual: {},
    });

    world.effects.push({
      id: world.nextId++,
      x: enemy.x,
      y: enemy.y,
      radius: enemy.isBoss ? 120 : 38,
      life: enemy.isBoss ? 0.8 : 0.28,
      kind: 'kill',
      active: true,
      visual: {},
    });
  }

  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }
}

export function triggerShockwave(world: World): boolean {
  const player = world.player;
  if (player.shockwaveTimer > 0 || !['playing', 'demon_rampage', 'boss'].includes(world.phase)) {
    return false;
  }

  const radius = player.isDemon ? 210 : 125;
  const damage = player.isDemon ? 85 : 34;
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    const range = radius + enemy.radius;
    if (distanceSq(player.x, player.y, enemy.x, enemy.y) <= range * range) {
      enemy.hp -= damage;
      enemy.flashTimer = 0.16;
      const dir = normalize(enemy.x - player.x, enemy.y - player.y);
      enemy.knockbackX += dir.x * 340;
      enemy.knockbackY += dir.y * 340;
    }
  }

  world.effects.push({
    id: world.nextId++,
    x: player.x,
    y: player.y,
    radius,
    life: 0.38,
    kind: 'shockwave',
    active: true,
    visual: {},
  });
  player.shockwaveTimer = Math.max(1.6, RUN_RULES.expToLevel / 4);
  spawnFloatingText(world, player.x, player.y - 40, '震荡');
  return true;
}
