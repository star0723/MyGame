import Phaser from 'phaser';
import { UI, UI_DEPTH, addIcon, makePanel, pixelText } from './uiTheme';

interface LegendItem {
  label: string;
  detail: string;
  color: number;
  icon: Parameters<typeof addIcon>[2];
}

const ITEMS: LegendItem[] = [
  { label: '主核心', detail: '你的位置', color: UI.arcaneBright, icon: 'core' },
  { label: '友方小怪', detail: '护卫 / 输出', color: UI.flame, icon: 'goblin' },
  { label: '敌方英雄', detail: '来袭目标', color: UI.blood, icon: 'sword' },
  { label: '腐血拾取', detail: '资源掉落', color: UI.crimsonBright, icon: 'drop' },
  { label: '精英小怪', detail: '高战力单位', color: UI.arcane, icon: 'embryo' },
];

export class LegendBarView {
  private readonly root: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    const width = 660;
    const height = 56;
    this.root = scene.add.container(360, 1240).setScrollFactor(0).setDepth(UI_DEPTH.hud + 2);
    this.root.add(
      makePanel(scene, width, height, {
        fill: UI.ink,
        border: UI.gold,
        borderWidth: 1,
        radius: 7,
        ornate: false,
      }),
    );

    const startX = -width / 2 + 66;
    const gap = 128;
    ITEMS.forEach((item, index) => {
      const x = startX + index * gap;
      const iconBg = scene.add.circle(x - 24, -4, 12, UI.cellDark, 0.95).setStrokeStyle(1, item.color, 0.9);
      this.root.add(iconBg);
      addIcon(scene, this.root, item.icon, x - 24, -4, 18, item.color);
      this.root.add(pixelText(scene, x - 6, -10, item.label, { size: 10, color: UI.textGold, bold: true }).setOrigin(0, 0.5));
      this.root.add(pixelText(scene, x - 6, 8, item.detail, { size: 8, color: UI.textDim }).setOrigin(0, 0.5));
    });
  }

  setVisible(visible: boolean): void {
    this.root.setVisible(visible);
  }

  destroy(): void {
    this.root.destroy(true);
  }
}

