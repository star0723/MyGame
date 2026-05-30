import { WORLD_BOUNDS } from '../game/constants';
import type { Altar, AltarKind, World } from '../game/types';
import { distanceSq } from '../utils/math';
import { nextId } from '../game/world';

interface SpawnAltarOpts {
  x?: number;
  y?: number;
  kind?: AltarKind;
}

const CAPTURE_TIME = 10;
const CAPTURE_RADIUS = 96;
const CHIP_REWARD = 24;

export function spawnAltar(world: World, opts: SpawnAltarOpts = {}): Altar {
  const altar: Altar = {
    id: nextId(world),
    x: opts.x ?? WORLD_BOUNDS.width / 2,
    y: opts.y ?? WORLD_BOUNDS.height / 2,
    radius: CAPTURE_RADIUS,
    captureProgress: 0,
    captureTime: CAPTURE_TIME,
    active: true,
    kind: opts.kind ?? 'blood',
    visual: {},
  };
  world.altars.push(altar);
  return altar;
}

export function updateAltarSystem(world: World, dt: number): void {
  for (const altar of world.altars) {
    if (!altar.active) continue;
    const inside = distanceSq(world.player.x, world.player.y, altar.x, altar.y) <= altar.radius * altar.radius;
    if (!inside) continue;
    altar.captureProgress = Math.min(altar.captureTime, altar.captureProgress + dt);
    if (altar.captureProgress >= altar.captureTime) {
      captureAltar(world, altar);
    }
  }
}

function captureAltar(world: World, altar: Altar): void {
  altar.active = false;
  world.progress.nextAltarAt = world.elapsed + 18;
  world.economy.bloodChips += CHIP_REWARD;
  world.economy.pendingSlot = true;
}
