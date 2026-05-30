import { GameEvents } from '../game/events';
import type { World } from '../game/types';
import { setRunPhase } from '../game/runState';
import { distanceSq, normalize } from '../utils/math';
import { spawnFloatingText } from './fxSystem';
import { spawnEnemy } from './waveSystem';

export function updateBossSystem(scene: Phaser.Scene, world: World, dt: number): void {
  if (world.progress.stage === 'boss' && !world.enemies.some((enemy) => enemy.isBoss)) {
    spawnBoss(scene, world);
  }

  const defeatedBoss = world.enemies.some((enemy) => enemy.isBoss && !enemy.alive);
  if (defeatedBoss && !world.stats.bossDefeated) {
    world.stats.bossDefeated = true;
    setRunPhase(world, 'result', 'boss-defeated');
    return;
  }

  // --- Spawn: once the rampage countdown elapses, summon the Paladin boss. ---
  if (world.phase === 'demon_rampage') {
    world.demon.bossSpawnTimer -= dt;
    if (world.demon.bossSpawnTimer > 0) return;

    spawnBoss(scene, world);
    return;
  }

  if (world.phase !== 'boss') return;

  const boss = world.enemies.find((enemy) => enemy.isBoss && enemy.alive);
  const rt = world.boss;
  if (!boss || !rt) return;

  const player = world.player;

  // --- One-time enrage at <=35% HP: AOE burst + reinforcements + faster skills. ---
  if (!rt.enraged && boss.hp <= boss.maxHp * 0.35) {
    rt.enraged = true;
    rt.phase = 'idle';
    rt.phaseTimer = 0;
    rt.skillCooldown = 0.5;
    bossPulse(world, boss.x, boss.y, 260, 40);
    summonMilitia(world, boss.x, boss.y, 5);
    scene.cameras.main.shake(420, 0.016);
    scene.events.emit(GameEvents.showToast, { text: '圣光爆发！', tone: 'hero' });
    spawnFloatingText(world, boss.x, boss.y - 50, '狂暴');
  }

  rt.phaseTimer -= dt;
  rt.skillCooldown -= dt;

  // --- Charge: high-speed dash along a snapshotted direction, one-shot contact hit. ---
  if (rt.phase === 'charge') {
    boss.x += rt.chargeDir.x * 760 * dt;
    boss.y += rt.chargeDir.y * 760 * dt;
    world.effects.push({ id: world.nextId++, x: boss.x, y: boss.y, radius: 42, life: 0.18, kind: 'shockwave', active: true, visual: {} });
    const rr = boss.radius + player.radius;
    if (boss.attackTimer <= 0 && distanceSq(boss.x, boss.y, player.x, player.y) <= rr * rr) {
      player.hp -= boss.damage * 2;
      boss.attackTimer = 1.0;
      spawnFloatingText(world, player.x, player.y - 30, `-${Math.round(boss.damage * 2)}`);
    }
    if (rt.phaseTimer <= 0) {
      rt.phase = 'idle';
      rt.skillCooldown = rt.enraged ? 2.0 : 3.5;
    }
    return;
  }

  // --- Idle: chase + melee. ---
  const toPlayer = normalize(player.x - boss.x, player.y - boss.y);
  const inMelee = distanceSq(boss.x, boss.y, player.x, player.y) <= boss.attackRange * boss.attackRange;
  if (!inMelee) {
    boss.x += toPlayer.x * boss.speed * dt;
    boss.y += toPlayer.y * boss.speed * dt;
  } else if (boss.attackTimer <= 0) {
    player.hp -= boss.damage;
    boss.attackTimer = boss.attackCooldown;
    spawnFloatingText(world, player.x, player.y - 30, `-${Math.round(boss.damage)}`);
  }

  // --- Skill rotation when off cooldown. ---
  if (rt.skillCooldown <= 0) {
    const roll = Math.random();
    if (roll < 0.4) {
      rt.phase = 'charge';
      rt.phaseTimer = 0.7;
      rt.chargeDir = { x: toPlayer.x, y: toPlayer.y };
      boss.attackTimer = 0;
      scene.cameras.main.shake(220, 0.01);
      scene.events.emit(GameEvents.showToast, { text: '圣光冲锋！', tone: 'hero' });
      // cooldown reset deferred until the charge ends
    } else if (roll < 0.75) {
      summonMilitia(world, boss.x, boss.y, rt.enraged ? 5 : 3);
      world.effects.push({ id: world.nextId++, x: boss.x, y: boss.y, radius: 70, life: 0.3, kind: 'kill', active: true, visual: {} });
      scene.events.emit(GameEvents.showToast, { text: '集结义勇兵！', tone: 'hero' });
      rt.skillCooldown = rt.enraged ? 2.0 : 3.5;
    } else {
      bossPulse(world, boss.x, boss.y, 180, 18);
      rt.skillCooldown = rt.enraged ? 2.0 : 3.5;
    }
  }
}

function spawnBoss(scene: Phaser.Scene, world: World): void {
  const boss = spawnEnemy(world, 'paladinBoss', {
    x: world.player.x + 420,
    y: world.player.y - 260,
  });
  boss.hp += world.stats.eliteUpgrades * 80;
  boss.maxHp = boss.hp;
  world.boss = { phase: 'idle', phaseTimer: 0, skillCooldown: 3.5, enraged: false, chargeDir: { x: 0, y: 0 } };
  setRunPhase(world, 'boss', 'paladin-arrival');
  scene.events.emit(GameEvents.bossSpawned);
}

function summonMilitia(world: World, x: number, y: number, count: number): void {
  for (let i = 0; i < count; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 40;
    spawnEnemy(world, 'militia', { x: x + Math.cos(angle) * dist, y: y + Math.sin(angle) * dist });
  }
}

function bossPulse(world: World, x: number, y: number, radius: number, damage: number): void {
  const player = world.player;
  if (distanceSq(x, y, player.x, player.y) <= radius * radius) {
    player.hp -= damage;
    spawnFloatingText(world, player.x, player.y - 30, `-${damage}`);
  }
  world.effects.push({ id: world.nextId++, x, y, radius, life: 0.45, kind: 'shockwave', active: true, visual: {} });
}
