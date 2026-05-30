import type { DemonFormDefinition } from '../game/types';

export const DEMON_FORMS: DemonFormDefinition[] = [
  {
    id: 'boneflame',
    name: '骸焰魔王',
    subtitle: '骷髅 + 王冠 + 火焰',
    color: 0xff7040,
    apply(world) {
      world.player.maxHp += 80;
      world.player.hp = world.player.maxHp;
      world.player.speed += 35;
      world.minions.forEach((minion) => {
        minion.damage *= 1.55;
        minion.attackRange += 16;
      });
    },
  },
  {
    id: 'bloodwing',
    name: '血翼魔王',
    subtitle: '蝙蝠 + 巨翼 + 吸血',
    color: 0xd83d7c,
    apply(world) {
      world.player.maxHp += 55;
      world.player.hp = world.player.maxHp;
      world.player.speed += 70;
      world.minions.forEach((minion) => {
        minion.attackCooldown *= 0.72;
        minion.speed += 55;
      });
    },
  },
  {
    id: 'corrosion',
    name: '腐蚀魔王',
    subtitle: '史莱姆 + 巨口 + 毒液',
    color: 0x8ce35d,
    apply(world) {
      world.player.maxHp += 120;
      world.player.hp = world.player.maxHp;
      world.player.pickupRadius += 60;
      world.modifiers.bloodDropBonus += 0.35;
    },
  },
];
