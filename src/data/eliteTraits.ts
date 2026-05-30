import type { Minion, World } from '../game/types';

export interface EliteTraitDefinition {
  id: string;
  symbol: string;
  name: string;
  color: number;
  apply(minion: Minion, world: World, multiplier: number): void;
}

export const ELITE_TRAITS: EliteTraitDefinition[] = [
  {
    id: 'clone',
    symbol: '克隆',
    name: '克隆',
    color: 0x62e6ff,
    apply(minion, _world, multiplier) {
      minion.maxHp += 2 * multiplier;
      minion.hp = Math.min(minion.maxHp, minion.hp + 2 * multiplier);
    },
  },
  {
    id: 'power',
    symbol: '力量',
    name: '力量',
    color: 0xffc857,
    apply(minion, _world, multiplier) {
      minion.damage *= 1 + 0.08 * multiplier;
    },
  },
  {
    id: 'regen',
    symbol: '恢复',
    name: '恢复',
    color: 0x7ad13a,
    apply(minion, _world, multiplier) {
      minion.hp = Math.min(minion.maxHp, minion.hp + 5 * multiplier);
    },
  },
  {
    id: 'shield',
    symbol: '护盾',
    name: '护盾',
    color: 0x9fd4ff,
    apply(minion, _world, multiplier) {
      minion.maxHp += 5 * multiplier;
      minion.hp = minion.maxHp;
    },
  },
  {
    id: 'zeal',
    symbol: '狂热',
    name: '狂热',
    color: 0x8a4bd6,
    apply(minion, _world, multiplier) {
      minion.attackCooldown *= Math.max(0.35, 1 - 0.03 * multiplier);
      minion.speed += 4 * multiplier;
    },
  },
  {
    id: 'greed',
    symbol: '贪婪',
    name: '贪婪',
    color: 0xffd76a,
    apply(minion, _world, multiplier) {
      minion.attackRange += 2 * multiplier;
    },
  },
];

export function getEliteTraitBySymbol(symbol: string): EliteTraitDefinition | undefined {
  return ELITE_TRAITS.find((trait) => trait.symbol === symbol || trait.id === symbol);
}
