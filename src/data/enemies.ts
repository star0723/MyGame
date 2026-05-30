import type { EnemyKind } from '../game/types';

export const ENEMY_CONFIGS: Record<
  EnemyKind,
  {
    hp: number;
    speed: number;
    damage: number;
    radius: number;
    attackRange: number;
    attackCooldown: number;
    bloodDrop: number;
    projectile?: { speed: number; radius: number; life: number };
  }
> = {
  militia: {
    hp: 20,
    speed: 78,
    damage: 5,
    radius: 15,
    attackRange: 28,
    attackCooldown: 0.9,
    bloodDrop: 2,
  },
  archer: {
    hp: 15,
    speed: 58,
    damage: 4,
    radius: 14,
    attackRange: 170,
    attackCooldown: 1.6,
    bloodDrop: 3,
    projectile: { speed: 320, radius: 7, life: 2.2 },
  },
  paladinBoss: {
    hp: 720,
    speed: 62,
    damage: 13,
    radius: 36,
    attackRange: 58,
    attackCooldown: 0.8,
    bloodDrop: 35,
  },
};
