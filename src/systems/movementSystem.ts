import { WORLD_BOUNDS } from '../game/constants';
import type { InputSnapshot, World } from '../game/types';
import { clamp, normalize } from '../utils/math';

export function updatePlayerMovement(world: World, input: InputSnapshot, dt: number): void {
  if (!['playing', 'demon_rampage', 'boss'].includes(world.phase)) return;

  const dir = normalize(input.moveX, input.moveY);
  const player = world.player;
  player.vx = dir.x * player.speed;
  player.vy = dir.y * player.speed;
  player.x = clamp(player.x + player.vx * dt, 80, WORLD_BOUNDS.width - 80);
  player.y = clamp(player.y + player.vy * dt, 80, WORLD_BOUNDS.height - 80);

  if (player.shockwaveTimer > 0) {
    player.shockwaveTimer -= dt;
  }
}
