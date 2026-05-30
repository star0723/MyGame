import type { EnemyKind } from '../game/types';

export interface EnemySpriteAnim {
  frames: [number, number];
  frameRate: number;
  repeat: number;
}

export interface EnemySpriteConfig {
  key: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  origin: { x: number; y: number };
  displayHeight: number;
  facesRight: boolean;
  anims: Record<'idle' | 'walk' | 'attack' | 'hurt' | 'death', EnemySpriteAnim>;
}

const ACTION_ANIMS: EnemySpriteConfig['anims'] = {
  idle: { frames: [0, 5], frameRate: 6, repeat: -1 },
  walk: { frames: [6, 11], frameRate: 12, repeat: -1 },
  attack: { frames: [12, 17], frameRate: 16, repeat: 0 },
  hurt: { frames: [18, 23], frameRate: 10, repeat: 0 },
  death: { frames: [24, 29], frameRate: 10, repeat: 0 },
};

// Action-adapted sheets in public/assets/new use fixed 6-frame rows:
// idle, walk, attack, hurt, death.
export const ENEMY_SPRITES: Partial<Record<EnemyKind, EnemySpriteConfig>> = {
  militia: {
    key: 'militia',
    url: 'new/militia.png',
    frameWidth: 114,
    frameHeight: 78,
    origin: { x: 0.4853, y: 0.9677 },
    displayHeight: 80,
    facesRight: true,
    anims: ACTION_ANIMS,
  },
  archer: {
    key: 'archer',
    url: 'new/archer.png',
    frameWidth: 107,
    frameHeight: 64,
    origin: { x: 0.437, y: 0.9608 },
    displayHeight: 80,
    facesRight: true,
    anims: ACTION_ANIMS,
  },
  paladinBoss: {
    key: 'paladin',
    url: 'new/paladin.png',
    frameWidth: 161,
    frameHeight: 92,
    origin: { x: 0.3958, y: 0.9725 },
    displayHeight: 120,
    facesRight: true,
    anims: ACTION_ANIMS,
  },
};

export const ENEMY_SPRITE_LIST = Object.values(ENEMY_SPRITES) as EnemySpriteConfig[];
