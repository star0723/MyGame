export const GAME_WIDTH = 720;
export const GAME_HEIGHT = 1280;

export const WORLD_BOUNDS = {
  width: 1800,
  height: 2600,
};

export const PLAYER_BASE = {
  hp: 100,
  speed: 210,
  radius: 22,
  pickupRadius: 92,
  shockwaveCooldown: 5,
};

export const RUN_RULES = {
  expToLevel: 18,
  embryoMax: 100,
  slotCostBase: 10,
  slotCostGrowth: 6,
  slotCostCap: 60,
  eliteUpgradeCost: 24,
  eliteUpgradeCostGrowth: 12,
  eliteUpgradeCostCap: 96,
  bossSpawnDelayAfterDemon: 28,
};

export const DEPTHS = {
  ground: 0,
  pickup: 20,
  shadowOffset: -1,
  effect: 8000,
  ui: 10000,
};

export const COLORS = {
  void: 0x130b18,
  floor: 0x1b1022,
  floorLine: 0x32203d,
  player: 0xb30f45,
  demon: 0xf03d6e,
  minion: 0x9b68ff,
  elite: 0xffc857,
  enemy: 0xf5e6b8,
  archer: 0x9fd4ff,
  blood: 0xb51d2a,
  uiText: '#f8ead8',
};
