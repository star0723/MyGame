import Phaser from 'phaser';
import type { World, Minion, MinionKind } from '../game/types';
import { SAFE, UI, UI_DEPTH, designSize, makePanel, pixelText, selectionOutline } from './uiTheme';

/**
 * Bottom-left "小怪军团" roster (portrait mockup, ART-FREE placeholders).
 *
 * One panel holds a row of minion cells: a glyph placeholder colored per kind, a
 * count badge bottom-right, and a gold selection ring when any of that kind is an
 * elite. Each cell is tappable -> onSelectKind(kind). Real art swaps the glyph for
 * an Image without touching this layout.
 */
interface CellRefs {
  kind: MinionKind;
  cell: Phaser.GameObjects.Rectangle;
  badgeBg: Phaser.GameObjects.Arc;
  badgeText: Phaser.GameObjects.Text;
  eliteRing: Phaser.GameObjects.Graphics;
}

const KIND_GLYPH: Record<MinionKind, { glyph: string; color: number }> = {
  skeleton: { glyph: '骨', color: UI.bone },
  bat: { glyph: '蝠', color: UI.arcane },
  goblin: { glyph: '哥', color: UI.flame },
  slime: { glyph: '史', color: UI.flameDim },
};

const ORDER: MinionKind[] = ['skeleton', 'bat', 'goblin', 'slime'];

export class MinionLegionBar {
  private readonly scene: Phaser.Scene;
  private readonly root: Phaser.GameObjects.Container;
  private readonly cells: CellRefs[] = [];
  private readonly counts: Record<MinionKind, number> = { skeleton: 0, bat: 0, goblin: 0, slime: 0 };
  private readonly elite: Record<MinionKind, boolean> = { skeleton: false, bat: false, goblin: false, slime: false };

  constructor(scene: Phaser.Scene, onSelectKind?: (kind: MinionKind) => void) {
    this.scene = scene;

    const { h } = designSize(scene);
    const panel = makePanel(scene, 300, 96);
    const title = pixelText(scene, 0, 58, '小怪军团', { size: 13, color: UI.textDim }).setOrigin(0.5);

    this.root = scene.add.container(SAFE.side + 150, h - SAFE.bottom - 96, [panel, title]);
    this.root.setScrollFactor(0).setDepth(UI_DEPTH.legion);

    const startX = -110;
    const spacing = 70;
    const cellY = -6;

    ORDER.forEach((kind, i) => {
      this.buildCell(startX + i * spacing, cellY, kind, onSelectKind);
    });
  }

  private buildCell(cx: number, cy: number, kind: MinionKind, onSelectKind?: (kind: MinionKind) => void): void {
    const { scene } = this;
    const { glyph, color } = KIND_GLYPH[kind];

    const cell = scene.add.rectangle(cx, cy, 56, 56, UI.cell, 1).setStrokeStyle(2, UI.crimson, 0.95);

    const disc = scene.add.circle(cx, cy - 2, 17, color, 0.9).setStrokeStyle(2, 0x000000, 0.5);
    const label = pixelText(scene, cx, cy - 2, glyph, { size: 16, color: UI.text, bold: true }).setOrigin(0.5);

    const eliteRing = selectionOutline(scene, 60, 60, UI.goldBright, 10).setPosition(cx, cy).setVisible(false);

    const badgeBg = scene.add.circle(cx + 22, cy + 22, 11, UI.crimsonBright, 1).setStrokeStyle(1, 0x000000, 0.6);
    const badgeText = pixelText(scene, cx + 22, cy + 22, '0', { size: 12, color: UI.text, bold: true }).setOrigin(0.5);

    const hit = scene.add.rectangle(cx, cy, 64, 64, UI.void, 0.001).setInteractive({ useHandCursor: true });
    const press = (): void => {
      scene.tweens.add({ targets: cell, scaleX: 0.9, scaleY: 0.9, duration: 70, yoyo: true });
      onSelectKind?.(kind);
    };
    cell.setInteractive({ useHandCursor: true });
    cell.on('pointerdown', press);
    hit.on('pointerdown', press);

    this.root.add([cell, eliteRing, disc, label, badgeBg, badgeText, hit]);
    this.cells.push({ kind, cell, badgeBg, badgeText, eliteRing });
  }

  update(world: World): void {
    (Object.keys(this.counts) as MinionKind[]).forEach((k) => {
      this.counts[k] = 0;
      this.elite[k] = false;
    });

    for (const m of world.minions as Minion[]) {
      this.counts[m.kind]++;
      if (m.elite) this.elite[m.kind] = true;
    }

    for (const c of this.cells) {
      const n = this.counts[c.kind];
      const empty = n === 0;
      c.badgeText.setText(String(n));
      c.badgeText.setColor(empty ? UI.textDim : UI.text);
      c.badgeBg.setFillStyle(empty ? UI.panelSoft : UI.crimsonBright, empty ? 0.7 : 1);
      c.eliteRing.setVisible(this.elite[c.kind]);
    }
  }

  destroy(): void {
    for (const c of this.cells) {
      c.cell.removeAllListeners();
      this.scene.tweens.killTweensOf(c.cell);
    }
    this.root.destroy(true);
  }
}
