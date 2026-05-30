import type { MinionKind } from '../game/types';

export interface MinionAnim {
  /** inclusive [start, end] frame indices within the repacked grid */
  frames: [number, number];
  frameRate: number;
  /** -1 = loop forever, 0 = play once */
  repeat: number;
}

export interface MinionSpriteConfig {
  key: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  /** normalized origin so the baked shadow baseline sits at the minion's (x, y) */
  origin: { x: number; y: number };
  /** on-screen height of one cell in px (drives uniform scale) */
  displayHeight: number;
  /** direction the source art faces; used to decide flipX from movement */
  facesRight: boolean;
  anims: Record<'idle' | 'walk' | 'attack' | 'hurt' | 'death', MinionAnim>;
}

const ACTION_ANIMS: MinionSpriteConfig['anims'] = {
  idle: { frames: [0, 5], frameRate: 6, repeat: -1 },
  walk: { frames: [6, 11], frameRate: 12, repeat: -1 },
  attack: { frames: [12, 17], frameRate: 16, repeat: 0 },
  hurt: { frames: [18, 23], frameRate: 10, repeat: 0 },
  death: { frames: [24, 29], frameRate: 10, repeat: 0 },
};

// Action-adapted sheets in public/assets/new use fixed 6-frame rows:
// idle, walk, attack, hurt, death.
export const MINION_SPRITES: Partial<Record<MinionKind, MinionSpriteConfig>> = {
  skeleton: {
    key: 'skeleton',
    url: 'new/skeleton.png',
    frameWidth: 116,
    frameHeight: 90,
    origin: { x: 0.4493, y: 0.972 },
    displayHeight: 82,
    facesRight: false,
    anims: ACTION_ANIMS,
  },
  bat: {
    key: 'bat',
    url: 'new/bat.png',
    frameWidth: 96,
    frameHeight: 85,
    origin: { x: 0.5132, y: 0.9703 },
    displayHeight: 76,
    facesRight: false,
    anims: ACTION_ANIMS,
  },
  goblin: {
    key: 'goblin',
    url: 'new/goblin.png',
    frameWidth: 87,
    frameHeight: 83,
    origin: { x: 0.4541, y: 0.9695 },
    displayHeight: 84,
    facesRight: true,
    anims: ACTION_ANIMS,
  },
};

export const MINION_SPRITE_LIST = Object.values(MINION_SPRITES) as MinionSpriteConfig[];
