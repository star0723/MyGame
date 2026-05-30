import type { World } from '../game/types';

export function updateFxSystem(world: World, dt: number): void {
  for (const effect of world.effects) {
    if (!effect.active) continue;
    effect.life -= dt;
    if (effect.life <= 0) effect.active = false;
  }

  for (const text of world.floatingTexts) {
    if (!text.active) continue;
    text.life -= dt;
    text.y -= dt * 34;
    if (text.life <= 0) text.active = false;
  }
}

export function spawnFloatingText(world: World, x: number, y: number, text: string, life = 0.8): void {
  world.floatingTexts.push({ id: world.nextId++, x, y, text, life, active: true, visual: {} });
}
