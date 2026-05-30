import Phaser from 'phaser';
import { COLORS, DEPTHS, WORLD_BOUNDS } from '../game/constants';
import { GameEvents } from '../game/events';
import { setRunPhase } from '../game/runState';
import type {
  Enemy as EnemyType,
  EliteUpgradeDefinition,
  FloatingText,
  GameEffect,
  InputSnapshot,
  Minion,
  Pickup,
  Projectile,
  UpgradeDefinition,
  VisualRefs,
  World,
} from '../game/types';
import { createWorld } from '../game/world';
import { MINION_SPRITES, type MinionSpriteConfig } from '../data/minionSprites';
import { ENEMY_SPRITES, type EnemySpriteConfig } from '../data/enemySprites';
import { applyEliteUpgrade, applyUpgrade, getAvailableEliteUpgrades, rollUpgrades } from '../systems/slotSystem';
import { awakenDemon, updateEvolutionSystem } from '../systems/evolutionSystem';
import { InputSystem } from '../systems/inputSystem';
import { TouchControls } from '../systems/touchInput';
import { spawnEnemy, resetWaveSystem, updateWaveSystem } from '../systems/waveSystem';
import { triggerShockwave, updateCombatSystem } from '../systems/combatSystem';
import { updateBossSystem } from '../systems/bossSystem';
import { updateEnemySystem } from '../systems/enemySystem';
import { spawnFloatingText, updateFxSystem } from '../systems/fxSystem';
import { updateMinionSystem } from '../systems/minionSystem';
import { updatePlayerMovement } from '../systems/movementSystem';
import { updatePickupSystem } from '../systems/pickupSystem';
import { spawnAltar, updateAltarSystem } from '../systems/altarSystem';
import { updateProjectileSystem } from '../systems/projectileSystem';

export class GameScene extends Phaser.Scene {
  private world!: World;
  private inputSystem!: InputSystem;
  private touchControls!: TouchControls;
  private ground?: Phaser.GameObjects.Grid;

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.world = createWorld();
    resetWaveSystem();
    this.inputSystem = new InputSystem(this);
    this.touchControls = new TouchControls(this);
    this.cameras.main.setBounds(0, 0, WORLD_BOUNDS.width, WORLD_BOUNDS.height);
    this.cameras.main.setZoom(1);
    this.cameras.main.setBackgroundColor(COLORS.void);
    this.createGround();
    this.createPlayerVisual();
    this.world.minions.forEach((minion) => this.createMinionVisual(minion));
    for (let i = 0; i < 5; i += 1) {
      spawnEnemy(this.world, i % 4 === 0 ? 'archer' : 'militia');
    }

    this.events.on(GameEvents.upgradePicked, (upgrade: UpgradeDefinition) => {
      applyUpgrade(this.world, upgrade);
      this.events.emit(GameEvents.closeSlot);
    });
    this.events.on(GameEvents.eliteUpgradePicked, (upgrade: EliteUpgradeDefinition) => {
      applyEliteUpgrade(this.world, upgrade);
      this.events.emit(GameEvents.closeEliteUpgrade);
    });
    this.events.on(GameEvents.shockwaveTriggered, () => {
      triggerShockwave(this.world);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.touchControls.destroy();
      this.events.off(GameEvents.upgradePicked);
      this.events.off(GameEvents.eliteUpgradePicked);
      this.events.off(GameEvents.shockwaveTriggered);
    });
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    const world = this.world;
    world.time += dt;
    world.phaseTime += dt;

    if (['playing', 'demon_rampage', 'boss'].includes(world.phase)) {
      world.elapsed += dt;
    }

    const kb = this.inputSystem.getSnapshot();
    const tc = this.touchControls.getSnapshot();
    const touchActive = Math.abs(tc.moveX) + Math.abs(tc.moveY) > 0;
    const input: InputSnapshot = {
      moveX: touchActive ? tc.moveX : kb.moveX,
      moveY: touchActive ? tc.moveY : kb.moveY,
      shockwavePressed: kb.shockwavePressed || tc.shockwavePressed,
      pausePressed: kb.pausePressed || tc.pausePressed,
    };
    if (input.pausePressed) {
      this.scene.pause('GameScene');
      return;
    }
    if (input.shockwavePressed) {
      triggerShockwave(world);
    }

    if (['playing', 'demon_rampage', 'boss'].includes(world.phase)) {
      updatePlayerMovement(world, input, dt);
      updateWaveSystem(world, dt);
      updateMinionSystem(world, dt);
      updateEnemySystem(world, dt);
      updateProjectileSystem(world, dt);
      updateCombatSystem(world, dt);
      updatePickupSystem(world, dt);
      updateAltarSystem(world, dt);
      updateEvolutionSystem(this, world);
      updateBossSystem(this, world, dt);
    }
    updateFxSystem(world, dt);

    this.handlePhaseTriggers();
    this.syncVisuals();
    this.events.emit(GameEvents.hudChanged, world);

    if (world.player.hp <= 0 && world.phase !== 'result') {
      world.phase = 'result';
    }

    if (world.phase === 'result') {
      this.scene.stop('UIScene');
      this.scene.start('ResultScene', { world });
    }
  }

  private handlePhaseTriggers(): void {
    const world = this.world;

    if (world.elapsed >= 300) world.progress.stage = 'boss';
    else if (world.elapsed >= 240) world.progress.stage = 'final';
    else if (world.elapsed >= 120) world.progress.stage = 'mid';
    else world.progress.stage = 'early';

    const activeAltars = world.altars.filter((altar) => altar.active).length;
    const targetAltars = world.elapsed >= 120 ? 2 : world.elapsed >= 40 ? 1 : 0;
    if (world.elapsed >= world.progress.nextAltarAt) {
      for (let i = activeAltars; i < targetAltars; i++) {
        spawnAltar(world);
      }
    }

    if (world.economy.pendingSlot && world.phase === 'playing') {
      setRunPhase(world, 'slot_roll', 'level-up');
      this.events.emit(GameEvents.openSlot, rollUpgrades(world));
      return;
    }

    if (world.economy.pendingEliteUpgrade && world.phase === 'playing') {
      const options = getAvailableEliteUpgrades(world);
      if (options.length > 0) {
        setRunPhase(world, 'elite_upgrade', 'elite-ready');
        this.events.emit(GameEvents.openEliteUpgrade, options);
      } else {
        world.economy.pendingEliteUpgrade = false;
      }
      return;
    }

    if (world.phase === 'awakening' && world.phaseTime > 1.35) {
      const form = awakenDemon(world);
      this.events.emit(GameEvents.demonBorn, form);
      this.cameras.main.shake(380, 0.012);
    }
  }

  private createGround(): void {
    this.add.rectangle(
      WORLD_BOUNDS.width / 2,
      WORLD_BOUNDS.height / 2,
      WORLD_BOUNDS.width,
      WORLD_BOUNDS.height,
      COLORS.floor,
      1,
    );
    this.ground = this.add
      .grid(
        WORLD_BOUNDS.width / 2,
        WORLD_BOUNDS.height / 2,
        WORLD_BOUNDS.width,
        WORLD_BOUNDS.height,
        64,
        64,
        0x000000,
        0,
        COLORS.floorLine,
        0.45,
      )
      .setDepth(DEPTHS.ground);
  }

  private createPlayerVisual(): void {
    const shadow = this.add.ellipse(this.world.player.x, this.world.player.y + 10, 56, 20, 0x050105, 0.45);
    const body = this.add.circle(this.world.player.x, this.world.player.y - 18, 24, COLORS.player, 1);
    body.setStrokeStyle(4, 0x3a0815);
    this.world.player.visual = { body, shadow };
  }

  private createMinionVisual(minion: Minion): void {
    const cfg = MINION_SPRITES[minion.kind];
    if (cfg) {
      const sprite = this.add.sprite(minion.x, minion.y, cfg.key);
      sprite.setOrigin(cfg.origin.x, cfg.origin.y);
      sprite.setScale(cfg.displayHeight / cfg.frameHeight);
      sprite.setData('px', minion.x);
      sprite.setData('py', minion.y);
      sprite.setData('lastAtk', minion.attackTimer);
      sprite.play(`${cfg.key}-walk`);
      minion.visual = { body: sprite };
      return;
    }
    const shadow = this.add.ellipse(minion.x, minion.y + 7, 34, 12, 0x050105, 0.36);
    const color = minion.kind === 'slime' ? 0x6ee36e : 0x9bbf3a;
    const body = this.add.rectangle(minion.x, minion.y - 18, 24, 28, color, 1);
    body.setStrokeStyle(3, 0x150b1f);
    minion.visual = { body, shadow };
  }

  private createEnemyVisual(enemy: EnemyType): void {
    const cfg = ENEMY_SPRITES[enemy.kind];
    if (cfg) {
      const sprite = this.add.sprite(enemy.x, enemy.y, cfg.key);
      sprite.setOrigin(cfg.origin.x, cfg.origin.y);
      sprite.setScale(cfg.displayHeight / cfg.frameHeight);
      sprite.setData('px', enemy.x);
      sprite.setData('py', enemy.y);
      sprite.setData('lastAtk', enemy.attackTimer);
      sprite.play(`${cfg.key}-walk`);
      const label = enemy.elite
        ? this.add.text(enemy.x, enemy.y - enemy.radius * 3, eliteEnemyLabel(enemy), { fontFamily: 'monospace', fontSize: '14px', color: '#ffd76a', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5)
        : undefined;
      enemy.visual = { body: sprite, label };
      return;
    }
    const shadow = this.add.ellipse(enemy.x, enemy.y + 8, enemy.radius * 2.1, 12, 0x050105, 0.35);
    const color = enemy.kind === 'archer' ? COLORS.archer : enemy.isBoss ? 0xfff0c2 : COLORS.enemy;
    const body = this.add.rectangle(enemy.x, enemy.y - enemy.radius, enemy.radius * 1.7, enemy.radius * 2.2, color, 1);
    body.setStrokeStyle(enemy.elite ? 4 : enemy.isBoss ? 5 : 2, enemy.elite ? COLORS.elite : enemy.isBoss ? 0xffc857 : 0x5b4d3b);
    const label = enemy.elite
      ? this.add.text(enemy.x, enemy.y - enemy.radius * 3, eliteEnemyLabel(enemy), { fontFamily: 'monospace', fontSize: '14px', color: '#ffd76a', stroke: '#000000', strokeThickness: 3 }).setOrigin(0.5)
      : undefined;
    enemy.visual = { body, shadow, label };
  }

  private createPickupVisual(pickup: Pickup): void {
    const body = this.add.polygon(pickup.x, pickup.y - 10, [0, -12, 9, 0, 0, 12, -9, 0], COLORS.blood, 1);
    body.setStrokeStyle(2, 0x3f050b);
    pickup.visual = { body };
  }

  private createAltarVisual(altar: NonNullable<World['altars'][number]>): void {
    const body = this.add.circle(altar.x, altar.y, altar.radius, 0x2a1020, 0.24);
    body.setStrokeStyle(4, COLORS.elite, 0.9);
    const core = this.add.circle(altar.x, altar.y, 22, COLORS.blood, 0.9).setStrokeStyle(3, COLORS.elite, 1);
    const label = this.add
      .text(altar.x, altar.y - altar.radius - 24, '血祭坛 0%', { fontFamily: 'monospace', fontSize: '18px', color: '#ffd76a', stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5)
      .setDepth(DEPTHS.effect);
    altar.visual = { body, shadow: core as unknown as Phaser.GameObjects.Ellipse, label };
  }

  private createEffectVisual(effect: GameEffect): void {
    const alpha = effect.kind === 'shockwave' ? 0.5 : 0.75;
    const color = effect.kind === 'kill' ? 0xb51d2a : effect.kind === 'shockwave' ? 0xff6d8f : 0xffd166;
    const body = this.add.circle(effect.x, effect.y, effect.radius, color, alpha);
    body.setBlendMode(Phaser.BlendModes.ADD);
    effect.visual = { body };
  }

  private createProjectileVisual(p: Projectile): void {
    const body = this.add.circle(p.x, p.y, p.radius, COLORS.archer, 1);
    body.setBlendMode(Phaser.BlendModes.ADD);
    body.setDepth(DEPTHS.effect);
    p.visual = { body };
  }

  private createFloatingTextVisual(ft: FloatingText): void {
    const body = this.add
      .text(ft.x, ft.y, ft.text, { fontFamily: 'monospace', fontSize: '18px', color: '#ffe8b8' })
      .setOrigin(0.5)
      .setDepth(DEPTHS.effect);
    ft.visual = { body };
  }

  private syncVisuals(): void {
    const player = this.world.player;
    const playerBody = player.visual.body as Phaser.GameObjects.Arc | undefined;
    const playerShadow = player.visual.shadow;
    playerBody?.setPosition(player.x, player.y - 18);
    playerBody?.setFillStyle(player.isDemon ? COLORS.demon : COLORS.player);
    playerBody?.setDepth(player.y);
    playerShadow?.setPosition(player.x, player.y + 10).setDepth(player.y + DEPTHS.shadowOffset);

    this.world.minions.forEach((minion) => {
      if (!minion.visual.body) this.createMinionVisual(minion);
      const cfg = MINION_SPRITES[minion.kind];
      if (cfg) {
        this.updateMinionSprite(minion.visual.body as Phaser.GameObjects.Sprite, minion, cfg);
        return;
      }
      const body = minion.visual.body as Phaser.GameObjects.Rectangle;
      body.setPosition(minion.x, minion.y - 18);
      body.setDepth(minion.y);
      body.setFillStyle(minion.elite ? COLORS.elite : minion.kind === 'slime' ? 0x6ee36e : 0x9bbf3a);
      minion.visual.shadow?.setPosition(minion.x, minion.y + 7).setDepth(minion.y + DEPTHS.shadowOffset);
    });

    this.world.enemies.forEach((enemy) => {
      if (!enemy.visual.body) this.createEnemyVisual(enemy);
      const cfg = ENEMY_SPRITES[enemy.kind];
      if (cfg) {
        this.updateEnemySprite(enemy.visual.body as Phaser.GameObjects.Sprite, enemy, cfg);
        return;
      }
      const body = enemy.visual.body as Phaser.GameObjects.Rectangle;
      body.setPosition(enemy.x, enemy.y - enemy.radius);
      body.setDepth(enemy.y);
      if (enemy.flashTimer > 0) body.setFillStyle(0xffffff);
      else body.setFillStyle(enemy.kind === 'archer' ? COLORS.archer : enemy.isBoss ? 0xfff0c2 : enemy.elite ? 0xffd166 : COLORS.enemy);
      body.setStrokeStyle(enemy.elite ? 4 : enemy.isBoss ? 5 : 2, enemy.elite ? COLORS.elite : enemy.isBoss ? 0xffc857 : 0x5b4d3b);
      enemy.visual.label?.setPosition(enemy.x, enemy.y - enemy.radius * 3).setText(eliteEnemyLabel(enemy));
      enemy.visual.shadow?.setPosition(enemy.x, enemy.y + 8).setDepth(enemy.y + DEPTHS.shadowOffset);
    });

    this.world.pickups.forEach((pickup) => {
      if (!pickup.visual.body) this.createPickupVisual(pickup);
      pickup.visual.body?.setPosition(pickup.x, pickup.y - 10);
      (pickup.visual.body as Phaser.GameObjects.Shape | undefined)?.setDepth(DEPTHS.pickup);
    });

    this.world.altars.forEach((altar) => {
      if (!altar.active) return;
      if (!altar.visual.body) this.createAltarVisual(altar);
      const ratio = Math.round((altar.captureProgress / altar.captureTime) * 100);
      altar.visual.body?.setPosition(altar.x, altar.y);
      (altar.visual.body as Phaser.GameObjects.Shape | undefined)?.setDepth(DEPTHS.effect - 5);
      altar.visual.shadow?.setPosition(altar.x, altar.y).setDepth(DEPTHS.effect - 4);
      altar.visual.label?.setPosition(altar.x, altar.y - altar.radius - 24).setText(`血祭坛 ${ratio}%`);
    });

    this.world.effects.forEach((effect) => {
      if (!effect.visual.body) this.createEffectVisual(effect);
      const body = effect.visual.body as Phaser.GameObjects.Arc;
      body.setPosition(effect.x, effect.y);
      body.setScale(Math.max(0.2, effect.life * 3));
      body.setDepth(DEPTHS.effect);
    });

    this.world.projectiles.forEach((p) => {
      if (!p.visual.body) this.createProjectileVisual(p);
      p.visual.body?.setPosition(p.x, p.y);
      (p.visual.body as Phaser.GameObjects.Arc | undefined)?.setDepth(DEPTHS.effect);
    });

    this.world.floatingTexts.forEach((ft) => {
      if (!ft.visual.body) this.createFloatingTextVisual(ft);
      const body = ft.visual.body as Phaser.GameObjects.Text;
      body.setPosition(ft.x, ft.y);
      body.setAlpha(Math.max(0, Math.min(1, ft.life * 2)));
      body.setDepth(DEPTHS.effect);
    });

    this.cleanupDestroyedVisuals();
    this.cameras.main.centerOn(player.x, player.y);
  }

  private updateMinionSprite(
    sprite: Phaser.GameObjects.Sprite,
    minion: Minion,
    cfg: MinionSpriteConfig,
  ): void {
    const px = (sprite.getData('px') as number) ?? minion.x;
    const py = (sprite.getData('py') as number) ?? minion.y;
    const dx = minion.x - px;
    const dy = minion.y - py;
    sprite.setData('px', minion.x);
    sprite.setData('py', minion.y);

    sprite.setPosition(minion.x, minion.y);
    sprite.setDepth(minion.y);

    if (Math.abs(dx) > 0.05) {
      const movingRight = dx > 0;
      sprite.setFlipX(cfg.facesRight ? !movingRight : movingRight);
    }

    if (minion.elite) sprite.setTint(0xffd479);
    else sprite.clearTint();

    // death (defensive: minions are currently immortal, but keep correct)
    if (!minion.alive) {
      if (!sprite.getData('dead')) {
        sprite.setData('dead', true);
        sprite.play(`${cfg.key}-death`, true);
      }
      return;
    }

    // attack: rising edge of attackTimer (jumps up when a hit lands)
    const lastAtk = (sprite.getData('lastAtk') as number) ?? 0;
    const attacked = minion.attackTimer > lastAtk + 0.01;
    sprite.setData('lastAtk', minion.attackTimer);
    const attackKey = `${cfg.key}-attack`;
    if (attacked) {
      sprite.play(attackKey, true);
      return;
    }
    if (sprite.anims.currentAnim?.key === attackKey && sprite.anims.isPlaying) {
      return; // let the swing finish before returning to locomotion
    }

    const moved = Math.hypot(dx, dy);
    const wantKey = moved > 0.6 ? `${cfg.key}-walk` : `${cfg.key}-idle`;
    if (sprite.anims.currentAnim?.key !== wantKey) sprite.play(wantKey, true);
  }

  private updateEnemySprite(
    sprite: Phaser.GameObjects.Sprite,
    enemy: EnemyType,
    cfg: EnemySpriteConfig,
  ): void {
    const px = (sprite.getData('px') as number) ?? enemy.x;
    const py = (sprite.getData('py') as number) ?? enemy.y;
    const dx = enemy.x - px;
    const dy = enemy.y - py;
    sprite.setData('px', enemy.x);
    sprite.setData('py', enemy.y);

    sprite.setPosition(enemy.x, enemy.y);
    sprite.setDepth(enemy.y);
    enemy.visual.label?.setPosition(enemy.x, enemy.y - enemy.radius * 3).setDepth(enemy.y + 1).setText(eliteEnemyLabel(enemy));

    if (Math.abs(dx) > 0.05) {
      sprite.setFlipX(cfg.facesRight ? dx < 0 : dx > 0);
    }

    if (enemy.flashTimer > 0) sprite.setTintFill(0xffffff);
    else if (enemy.isBoss && this.world.boss?.enraged) sprite.setTint(0xff6a6a);
    else sprite.clearTint();

    if (!enemy.alive) {
      if (!sprite.getData('dead')) {
        sprite.setData('dead', true);
        sprite.play(`${cfg.key}-death`, true);
      }
      return;
    }

    const lastAtk = (sprite.getData('lastAtk') as number) ?? 0;
    const attacked = enemy.attackTimer > lastAtk + 0.01;
    sprite.setData('lastAtk', enemy.attackTimer);
    const attackKey = `${cfg.key}-attack`;
    if (attacked) {
      sprite.play(attackKey, true);
      return;
    }
    if (sprite.anims.currentAnim?.key === attackKey && sprite.anims.isPlaying) {
      return;
    }

    const moved = Math.hypot(dx, dy);
    const wantKey = moved > 0.4 ? `${cfg.key}-walk` : `${cfg.key}-idle`;
    if (sprite.anims.currentAnim?.key !== wantKey) sprite.play(wantKey, true);
  }

  private cleanupDestroyedVisuals(): void {
    cleanupVisuals(this.world.pickups);
    cleanupVisuals(this.world.altars);
    cleanupVisuals(this.world.effects);
    cleanupVisuals(this.world.projectiles);
    cleanupVisuals(this.world.floatingTexts);
    this.world.pickups = this.world.pickups.filter((pickup) => pickup.active);
    this.world.altars = this.world.altars.filter((altar) => altar.active);
    this.world.effects = this.world.effects.filter((effect) => effect.active);
    this.world.projectiles = this.world.projectiles.filter((p) => p.active);
    this.world.floatingTexts = this.world.floatingTexts.filter((text) => text.active);

    for (const e of this.world.enemies) {
      if (!e.alive && (e.deathTimer === undefined || e.deathTimer <= 0)) {
        e.visual.body?.destroy();
        e.visual.shadow?.destroy();
        e.visual = {};
      }
    }
    this.world.enemies = this.world.enemies.filter(
      (e) => e.alive || (e.deathTimer !== undefined && e.deathTimer > 0),
    );

    for (const m of this.world.minions) {
      if (!m.alive && (m.deathTimer === undefined || m.deathTimer <= 0)) {
        m.visual.body?.destroy();
        m.visual.shadow?.destroy();
        m.visual = {};
      }
    }
    this.world.minions = this.world.minions.filter(
      (m) => m.alive || (m.deathTimer !== undefined && m.deathTimer > 0),
    );
  }
}

function cleanupVisuals(items: Array<{ visual: VisualRefs; alive?: boolean; active?: boolean }>): void {
  for (const item of items) {
    const dead = item.alive === false || item.active === false;
    if (!dead) continue;
    item.visual.body?.destroy();
    item.visual.shadow?.destroy();
    item.visual.label?.destroy();
    item.visual = {};
  }
}

function eliteEnemyLabel(enemy: EnemyType): string {
  if (!enemy.elite) return '';
  const labels = {
    clone: '克隆精英',
    strength: '力量精英',
    recovery: '恢复精英',
    shield: '护盾精英',
  } as const;
  return labels[enemy.elite.kind];
}
