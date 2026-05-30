import type { EliteUpgradeDefinition } from '../game/types';

export const ELITE_MINION_UPGRADES: EliteUpgradeDefinition[] = [
  {
    id: 'bone-captain',
    sourceKind: 'skeleton',
    name: '骸骨队长',
    title: '劈砍精英',
    description: '指定骷髅升格为骸骨队长，伤害、范围和生命提高。',
    traits: ['骨裂', '护主'],
    apply(minion, world) {
      minion.elite = {
        id: 'bone-captain',
        title: '骸骨队长',
        traits: [],
      };
      minion.damage *= 1.9;
      minion.attackRange += 22;
      minion.maxHp += 35;
      minion.hp = minion.maxHp;
      world.stats.eliteUpgrades += 1;
    },
  },
  {
    id: 'bloodwing-shrieker',
    sourceKind: 'bat',
    name: '血翼尖啸者',
    title: '弹射精英',
    description: '指定蝙蝠升格为血翼尖啸者，攻速和追击能力提高。',
    traits: ['嗜血', '弹射'],
    apply(minion, world) {
      minion.elite = {
        id: 'bloodwing-shrieker',
        title: '血翼尖啸者',
        traits: [],
      };
      minion.damage *= 1.45;
      minion.attackCooldown *= 0.55;
      minion.speed += 80;
      minion.maxHp += 18;
      minion.hp = minion.maxHp;
      world.stats.eliteUpgrades += 1;
    },
  },
];
