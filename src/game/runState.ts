import type { RunPhase, World } from './types';

export function setRunPhase(world: World, nextPhase: RunPhase, reason: string): void {
  if (world.phase === nextPhase) return;

  world.phase = nextPhase;
  world.phaseReason = reason;
  world.phaseTime = 0;
}
