import { DEMON_FORMS } from '../data/demonForms';
import { GameEvents } from '../game/events';
import { setRunPhase } from '../game/runState';
import type { DemonFormDefinition, World } from '../game/types';
import { chooseOne } from '../utils/math';

export function updateEvolutionSystem(scene: Phaser.Scene, world: World): void {
  if (!world.demon.awakened && world.player.embryoValue >= world.player.embryoMax && world.phase === 'playing') {
    setRunPhase(world, 'awakening', 'embryo-full');
    scene.events.emit(GameEvents.awakeningStarted);
  }
}

export function awakenDemon(world: World, forcedForm?: DemonFormDefinition): DemonFormDefinition {
  const form = forcedForm ?? chooseOne(DEMON_FORMS);
  form.apply(world);
  world.demon.awakened = true;
  world.demon.form = form.id;
  world.demon.name = form.name;
  world.player.isDemon = true;
  setRunPhase(world, 'demon_rampage', `demon:${form.id}`);
  return form;
}
