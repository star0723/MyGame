import type { Enemy, Minion, World } from '../game/types';
import { distanceSq, normalize } from '../utils/math';
import { ENEMY_CONFIGS } from '../data/enemies';
import { spawnFloatingText } from './fxSystem';
import { spawnEnemyProjectile } from './projectileSystem';

export function updateEnemySystem(world: World, dt: number): void {
  if (!['playing', 'demon_rampage', 'boss'].includes(world.phase)) return;

  const player = world.player;
  for (const enemy of world.enemies) {
    if (!enemy.alive) {
      if (enemy.deathTimer !== undefined && enemy.deathTimer > 0) enemy.deathTimer -= dt;
      continue;
    }

    if (enemy.flashTimer > 0) enemy.flashTimer -= dt;
    if (enemy.attackTimer > 0) enemy.attackTimer -= dt;
    if (enemy.nextSkillTimer > 0) enemy.nextSkillTimer -= dt;

    if (enemy.isBoss) continue;

    const toPlayer = normalize(player.x - enemy.x, player.y - enemy.y);
    const inRange = distanceSq(enemy.x, enemy.y, player.x, player.y) <= enemy.attackRange * enemy.attackRange;

    if (!inRange) {
      const targetMinion = findNearestMinion(world, enemy);
      const minionInRange =
        targetMinion !== undefined &&
        distanceSq(enemy.x, enemy.y, targetMinion.x, targetMinion.y) <=
          enemy.attackRange * enemy.attackRange;

      if (targetMinion && minionInRange && enemy.attackTimer <= 0) {
        targetMinion.hp -= enemy.damage;
        enemy.attackTimer = enemy.attackCooldown;
        spawnFloatingText(world, targetMinion.x, targetMinion.y - 20, `-${Math.round(enemy.damage)}`);
        world.effects.push({
          id: world.nextId++,
          x: targetMinion.x,
          y: targetMinion.y,
          radius: 18,
          life: 0.16,
          kind: 'hit',
          active: true,
          visual: {},
        });
      } else {
        enemy.vx = toPlayer.x * enemy.speed + enemy.knockbackX;
        enemy.vy = toPlayer.y * enemy.speed + enemy.knockbackY;
        enemy.x += enemy.vx * dt;
        enemy.y += enemy.vy * dt;
      }
    } else if (enemy.attackTimer <= 0) {
      if (ENEMY_CONFIGS[enemy.kind].projectile) {
        spawnEnemyProjectile(world, enemy, player);
      } else {
        player.hp -= enemy.damage;
        spawnFloatingText(world, player.x, player.y - 30, `-${Math.round(enemy.damage)}`);
      }
      enemy.attackTimer = enemy.attackCooldown;
    }

    enemy.knockbackX *= Math.pow(0.02, dt);
    enemy.knockbackY *= Math.pow(0.02, dt);
  }
}

function findNearestMinion(world: World, enemy: Enemy): Minion | undefined {
  let best: Minion | undefined;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const minion of world.minions) {
    if (!minion.alive) continue;
    const dist = distanceSq(enemy.x, enemy.y, minion.x, minion.y);
    if (dist < bestDist) {
      best = minion;
      bestDist = dist;
    }
  }
  return best;
}
