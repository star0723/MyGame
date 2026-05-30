import Phaser from 'phaser';
import type { World } from '../game/types';
import { ResultView } from '../ui/resultView';

export class ResultScene extends Phaser.Scene {
  constructor() {
    super('ResultScene');
  }

  create(data: { world?: World }): void {
    if (!data.world) {
      this.scene.start('TitleScene');
      return;
    }

    new ResultView(this, data.world).create();
  }
}
