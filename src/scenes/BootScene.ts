import Phaser from 'phaser';
import { MINION_SPRITE_LIST } from '../data/minionSprites';
import { ENEMY_SPRITE_LIST } from '../data/enemySprites';

interface SpriteSheetConfig {
  key: string;
  url: string;
  frameWidth: number;
  frameHeight: number;
  anims: Record<string, { frames: [number, number]; frameRate: number; repeat: number }>;
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this.load.setPath('/assets');
    for (const cfg of MINION_SPRITE_LIST) {
      this.load.spritesheet(cfg.key, cfg.url, {
        frameWidth: cfg.frameWidth,
        frameHeight: cfg.frameHeight,
      });
    }
    for (const cfg of ENEMY_SPRITE_LIST) {
      this.load.spritesheet(cfg.key, cfg.url, {
        frameWidth: cfg.frameWidth,
        frameHeight: cfg.frameHeight,
      });
    }
  }

  create(): void {
    this.registerMinionAnims();
    this.scene.start('TitleScene');
  }

  private registerMinionAnims(): void {
    this.registerAnims(MINION_SPRITE_LIST);
    this.registerAnims(ENEMY_SPRITE_LIST);
  }

  private registerAnims(list: readonly SpriteSheetConfig[]): void {
    for (const cfg of list) {
      for (const [name, anim] of Object.entries(cfg.anims)) {
        const key = `${cfg.key}-${name}`;
        if (this.anims.exists(key)) continue;
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(cfg.key, {
            start: anim.frames[0],
            end: anim.frames[1],
          }),
          frameRate: anim.frameRate,
          repeat: anim.repeat,
        });
      }
    }
  }
}
