import { ENEMY_CONFIGS } from '../data/enemies';
import { WORLD_BOUNDS } from '../game/constants';
import type { Enemy, World } from '../game/types';
import { distanceSq, normalize } from '../utils/math';
import { spawnFloatingText } from './fxSystem';

export function spawnEnemyProjectile(world: World, enemy: Enemy, target: { x: number; y: number }): void {
  const cfg = ENEMY_CONFIGS[enemy.kind].projectile;
  if (!cfg) return;
  const dir = normalize(target.x - enemy.x, target.y - enemy.y);
  world.projectiles.push({
    id: world.nextId++,
    x: enemy.x,
    y: enemy.y,
    vx: dir.x * cfg.speed,
    vy: dir.y * cfg.speed,
    damage: enemy.damage,
    radius: cfg.radius,
    life: cfg.life,
    owner: 'enemy',
    active: true,
    visual: {},
  });
}

export function updateProjectileSystem(world: World, dt: number): void {
  const player = world.player;
  for (const p of world.projectiles) {
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.x < -200 || p.y < -200 || p.x > WORLD_BOUNDS.width + 200 || p.y > WORLD_BOUNDS.height + 200) {
      p.active = false;
      continue;
    }
    if (p.owner === 'enemy') {
      const rr = p.radius + player.radius;
      if (distanceSq(p.x, p.y, player.x, player.y) <= rr * rr) {
        player.hp -= p.damage;
        p.active = false;
        spawnFloatingText(world, player.x, player.y - 30, `-${Math.round(p.damage)}`);
        world.effects.push({ id: world.nextId++, x: p.x, y: p.y, radius: 18, life: 0.16, kind: 'hit', active: true, visual: {} });
      }
    }
  }
}
