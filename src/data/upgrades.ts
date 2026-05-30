import type { UpgradeDefinition } from '../game/types';
import { createMinion } from '../game/world';

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: 'summon-skeleton',
    name: '骨堆增殖',
    description: '召唤 1 只骷髅护卫。',
    rarity: 'common',
    apply(world) {
      if (world.minions.length < world.modifiers.minionLimit) {
        world.minions.push(createMinion(world, 'skeleton', world.minions.length, world.minions.length + 1));
      }
    },
  },
  {
    id: 'summon-bat',
    name: '血翼孵化',
    description: '召唤 1 只蝙蝠护卫。',
    rarity: 'common',
    apply(world) {
      if (world.minions.length < world.modifiers.minionLimit) {
        world.minions.push(createMinion(world, 'bat', world.minions.length, world.minions.length + 1));
      }
    },
  },
  {
    id: 'summon-goblin',
    name: '哥布林征召',
    description: '召唤 1 只哥布林护卫。',
    rarity: 'common',
    apply(world) {
      if (world.minions.length < world.modifiers.minionLimit) {
        world.minions.push(createMinion(world, 'goblin', world.minions.length, world.minions.length + 1));
      }
    },
  },
  {
    id: 'summon-slime',
    name: '黏液护巢',
    description: '召唤 1 只高生命史莱姆。',
    rarity: 'common',
    apply(world) {
      if (world.minions.length < world.modifiers.minionLimit) {
        world.minions.push(createMinion(world, 'slime', world.minions.length, world.minions.length + 1));
      }
    },
  },
  {
    id: 'skeleton-damage',
    name: '骨刃磨尖',
    description: '骷髅伤害 +25%。',
    rarity: 'common',
    apply(world) {
      world.modifiers.skeletonDamage += 0.25;
    },
  },
  {
    id: 'bat-speed',
    name: '尖啸加速',
    description: '蝙蝠攻速 +25%。',
    rarity: 'common',
    apply(world) {
      world.modifiers.batAttackSpeed += 0.25;
    },
  },
  {
    id: 'pickup-radius',
    name: '贪婪血环',
    description: '腐血拾取范围 +28。',
    rarity: 'common',
    apply(world) {
      world.modifiers.pickupRadiusBonus += 28;
      world.player.pickupRadius += 28;
    },
  },
  {
    id: 'blood-drop',
    name: '尸堆渗血',
    description: '腐血掉落量 +20%。',
    rarity: 'rare',
    apply(world) {
      world.modifiers.bloodDropBonus += 0.2;
    },
  },
  {
    id: 'embryo-surge',
    name: '胚胎抽搐',
    description: '立刻获得 16 点胚胎值。',
    rarity: 'rare',
    apply(world) {
      world.player.embryoValue = Math.min(world.player.embryoMax, world.player.embryoValue + 16);
    },
  },
  {
    id: 'minion-limit',
    name: '巢穴扩张',
    description: '小怪上限 +3。',
    rarity: 'cursed',
    apply(world) {
      world.modifiers.minionLimit += 3;
    },
  },
];
