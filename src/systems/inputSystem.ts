import Phaser from 'phaser';
import type { InputSnapshot } from '../game/types';

export class InputSystem {
  private hasKeyboard: boolean;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys?: Record<'w' | 'a' | 's' | 'd' | 'q' | 'esc', Phaser.Input.Keyboard.Key>;

  constructor(scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard;
    this.hasKeyboard = !!keyboard;

    if (!keyboard) {
      return;
    }

    this.cursors = keyboard.createCursorKeys();
    this.keys = {
      w: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      q: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      esc: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC),
    };
  }

  getSnapshot(): InputSnapshot {
    if (!this.hasKeyboard || !this.cursors || !this.keys) {
      return { moveX: 0, moveY: 0, shockwavePressed: false, pausePressed: false };
    }

    const left = this.cursors.left.isDown || this.keys.a.isDown;
    const right = this.cursors.right.isDown || this.keys.d.isDown;
    const up = this.cursors.up.isDown || this.keys.w.isDown;
    const down = this.cursors.down.isDown || this.keys.s.isDown;

    return {
      moveX: Number(right) - Number(left),
      moveY: Number(down) - Number(up),
      shockwavePressed: Phaser.Input.Keyboard.JustDown(this.keys.q),
      pausePressed: Phaser.Input.Keyboard.JustDown(this.keys.esc),
    };
  }
}
