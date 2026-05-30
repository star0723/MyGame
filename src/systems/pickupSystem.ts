import { RUN_RULES } from '../game/constants';
import type { World } from '../game/types';
import { distanceSq, normalize } from '../utils/math';
import { spawnFloatingText } from './fxSystem';
import { getEliteUpgradeCost } from './slotSystem';

export function updatePickupSystem(world: World, dt: number): void {
  const player = world.player;
  const pickupRadius = player.pickupRadius;
  const pickupRadiusSq = pickupRadius * pickupRadius;

  for (const pickup of world.pickups) {
    if (!pickup.active) continue;

    pickup.life -= dt;
    if (pickup.life <= 0) {
      pickup.active = false;
      continue;
    }

    const distSq = distanceSq(pickup.x, pickup.y, player.x, player.y);
    if (distSq <= pickupRadiusSq) {
      pickup.magnetized = true;
    }

    if (pickup.magnetized) {
      const dir = normalize(player.x - pickup.x, player.y - pickup.y);
      const speed = 260 + (1 - pickup.life / pickup.maxLife) * 320;
      pickup.x += dir.x * speed * dt;
      pickup.y += dir.y * speed * dt;
    }

    if (distSq <= (player.radius + 16) * (player.radius + 16)) {
      collectPickup(world, pickup.value);
      pickup.active = false;
    }
  }
}

function collectPickup(world: World, value: number): void {
  world.stats.bloodCollected += value;
  spawnFloatingText(world, world.player.x, world.player.y - 30, `+${value}`);
  world.economy.bloodChips += value;
  world.player.exp += value;
  world.player.embryoValue = Math.min(world.player.embryoMax, world.player.embryoValue + value * 0.62);

  if (world.player.exp >= RUN_RULES.expToLevel + world.player.level * 6 && world.phase === 'playing') {
    world.player.exp = 0;
    world.player.level += 1;
    world.economy.pendingSlot = true;
  }

  if (
    world.economy.bloodChips >= getEliteUpgradeCost(world) &&
    world.phase === 'playing'
  ) {
    world.economy.pendingEliteUpgrade = true;
  }
}
