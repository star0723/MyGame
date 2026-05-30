import Phaser from 'phaser';
import { DEPTHS } from '../game/constants';
import { clamp } from '../utils/math';
import type { InputSnapshot } from '../game/types';

/**
 * Mobile touch controls: a floating virtual joystick on the left half of the
 * screen. Drawn in screen space (scrollFactor 0) so it stays put while the
 * camera follows the player.
 *
 * The shockwave button is handled by SkillButtonView (UIScene); this class
 * only manages the joystick for player movement.
 *
 * getSnapshot() works regardless of whether touch is enabled (returns zeros on
 * desktop), so it can be merged into the keyboard snapshot unconditionally.
 */
export class TouchControls {
  private readonly scene: Phaser.Scene;
  private readonly enabled: boolean;

  private base?: Phaser.GameObjects.Arc;
  private thumb?: Phaser.GameObjects.Arc;

  private moveX = 0;
  private moveY = 0;
  private joystickId: number | null = null;
  private origin = { x: 0, y: 0 };
  private readonly maxRadius = 70;
  private readonly deadzone = 8;

  private readonly onPointerDown: (pointer: Phaser.Input.Pointer) => void;
  private readonly onPointerMove: (pointer: Phaser.Input.Pointer) => void;
  private readonly onPointerUp: (pointer: Phaser.Input.Pointer) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.enabled =
      scene.sys.game.device.input.touch ||
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0;

    // Bind handlers once so destroy() can remove the exact references.
    this.onPointerDown = (pointer) => this.handleDown(pointer);
    this.onPointerMove = (pointer) => this.handleMove(pointer);
    this.onPointerUp = (pointer) => this.handleUp(pointer);

    if (!this.enabled) {
      return;
    }

    // Default input has only mouse + pointer1; we need a second touch slot so
    // the joystick finger and the button finger register as distinct pointers.
    scene.input.addPointer(2);

    this.base = scene.add
      .circle(0, 0, this.maxRadius, 0xffffff, 0.1)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.thumb = scene.add
      .circle(0, 0, 32, 0xffffff, 0.22)
      .setScrollFactor(0)
      .setDepth(DEPTHS.ui)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);

    // Shockwave button removed — SkillButtonView (UIScene) handles it.

    scene.input.on('pointerdown', this.onPointerDown);
    scene.input.on('pointermove', this.onPointerMove);
    scene.input.on('pointerup', this.onPointerUp);
    scene.input.on('pointerupoutside', this.onPointerUp);
  }

  private handleDown(pointer: Phaser.Input.Pointer): void {
    if (pointer.x < this.scene.scale.width * 0.5 && this.joystickId === null) {
      this.joystickId = pointer.id;
      this.origin = { x: pointer.x, y: pointer.y };
      this.base?.setPosition(this.origin.x, this.origin.y).setVisible(true);
      // Center the thumb on the origin so it doesn't jump from a stale position.
      this.thumb?.setPosition(this.origin.x, this.origin.y).setVisible(true);
    }
  }

  private handleMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id !== this.joystickId) {
      return;
    }
    const dx = pointer.x - this.origin.x;
    const dy = pointer.y - this.origin.y;
    const len = Math.hypot(dx, dy);
    const cl = clamp(len, 0, this.maxRadius);
    const nx = len > 0 ? dx / len : 0;
    const ny = len > 0 ? dy / len : 0;
    this.thumb?.setPosition(this.origin.x + nx * cl, this.origin.y + ny * cl);
    if (len < this.deadzone) {
      this.moveX = 0;
      this.moveY = 0;
    } else {
      this.moveX = nx * (cl / this.maxRadius);
      this.moveY = ny * (cl / this.maxRadius);
    }
  }

  private handleUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.joystickId) {
      this.joystickId = null;
      this.moveX = 0;
      this.moveY = 0;
      this.base?.setVisible(false);
      this.thumb?.setVisible(false);
    }
  }

  getSnapshot(): InputSnapshot {
    return {
      moveX: this.moveX,
      moveY: this.moveY,
      shockwavePressed: false,
      pausePressed: false,
    };
  }

  destroy(): void {
    if (this.enabled) {
      this.scene.input.off('pointerdown', this.onPointerDown);
      this.scene.input.off('pointermove', this.onPointerMove);
      this.scene.input.off('pointerup', this.onPointerUp);
      this.scene.input.off('pointerupoutside', this.onPointerUp);
    }
    this.base?.destroy();
    this.thumb?.destroy();
  }
}
