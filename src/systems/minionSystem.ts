import type { Enemy, Minion, World } from '../game/types';
import { distanceSq, normalize } from '../utils/math';
import { spawnFloatingText } from './fxSystem';

export function updateMinionSystem(world: World, dt: number): void {
  if (!['playing', 'demon_rampage', 'boss'].includes(world.phase)) return;

  for (let index = 0; index < world.minions.length; index += 1) {
    const minion = world.minions[index];
    if (minion.alive && minion.hp <= 0) {
      minion.alive = false;
      minion.deathTimer = 0.5;
      world.stats.sacrifices += 1;
      world.effects.push({ id: world.nextId++, x: minion.x, y: minion.y, radius: 30, life: 0.3, kind: 'kill', active: true, visual: {} });
      spawnFloatingText(world, minion.x, minion.y - 20, '献祭');
    }
    if (!minion.alive) {
      if (minion.deathTimer !== undefined && minion.deathTimer > 0) minion.deathTimer -= dt;
      continue;
    }

    minion.slotAngle += dt * (minion.kind === 'bat' ? 1.55 : 0.92);
    const target = findNearestEnemy(world, minion);

    if (target && distanceSq(minion.x, minion.y, target.x, target.y) <= 230 * 230) {
      moveToward(minion, target.x, target.y, dt);
      attackIfReady(world, minion, target, dt);
    } else {
      const count = Math.max(world.minions.length, 1);
      const desiredAngle = minion.slotAngle + (Math.PI * 2 * index) / count;
      const ox = world.player.x + Math.cos(desiredAngle) * minion.orbitRadius;
      const oy = world.player.y + Math.sin(desiredAngle) * minion.orbitRadius * 0.72;
      moveToward(minion, ox, oy, dt);
    }

    if (minion.attackTimer > 0) {
      minion.attackTimer -= dt;
    }
  }
}

function findNearestEnemy(world: World, minion: Minion): Enemy | undefined {
  let best: Enemy | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const enemy of world.enemies) {
    if (!enemy.alive) continue;
    const dist = distanceSq(minion.x, minion.y, enemy.x, enemy.y);
    if (dist < bestDist) {
      best = enemy;
      bestDist = dist;
    }
  }
  return best;
}

function moveToward(minion: Minion, x: number, y: number, dt: number): void {
  const dir = normalize(x - minion.x, y - minion.y);
  minion.x += dir.x * minion.speed * dt;
  minion.y += dir.y * minion.speed * dt;
}

function attackIfReady(world: World, minion: Minion, enemy: Enemy, dt: number): void {
  if (minion.attackTimer > 0) {
    minion.attackTimer -= dt;
    return;
  }

  const range = minion.attackRange + enemy.radius;
  if (distanceSq(minion.x, minion.y, enemy.x, enemy.y) > range * range) return;

  const damageMod = minion.kind === 'skeleton' ? world.modifiers.skeletonDamage : 1;
  const damage = minion.damage * damageMod * (world.player.isDemon ? 1.28 : 1);
  enemy.hp -= damage;
  enemy.flashTimer = 0.12;
  spawnFloatingText(world, enemy.x, enemy.y - 20, `-${Math.round(damage)}`);
  const dir = normalize(enemy.x - minion.x, enemy.y - minion.y);
  enemy.knockbackX += dir.x * 130;
  enemy.knockbackY += dir.y * 130;

  world.effects.push({
    id: world.nextId++,
    x: enemy.x,
    y: enemy.y,
    radius: minion.elite ? 32 : 20,
    life: 0.16,
    kind: 'hit',
    active: true,
    visual: {},
  });

  minion.attackTimer =
    minion.attackCooldown / (minion.kind === 'bat' ? world.modifiers.batAttackSpeed : 1);
}
