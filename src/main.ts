import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from './game/constants';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { ResultScene } from './scenes/ResultScene';
import { TitleScene } from './scenes/TitleScene';
import { UIScene } from './scenes/UIScene';
import './styles.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#130b18',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, GameScene, UIScene, ResultScene],
};

const game = new Phaser.Game(config);

if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  Object.defineProperty(window, '__DEV_PHASER_GAME__', {
    value: game,
    configurable: true,
  });
}

// ── Landscape overlay ──
// The game is designed for portrait 720×1280. In landscape the playable area
// is letterboxed to a tiny strip, so we always prompt rotation — regardless
// of whether the device is mobile or desktop.
const overlay = document.getElementById('rotate-overlay');

function updateOverlay(): void {
  if (!overlay) return;
  overlay.style.display = window.innerWidth > window.innerHeight ? 'flex' : 'none';
}

updateOverlay();
window.addEventListener('resize', updateOverlay);
window.addEventListener('orientationchange', () => {
  setTimeout(updateOverlay, 100);
});
