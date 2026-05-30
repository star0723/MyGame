import Phaser from 'phaser';
import { RUN_RULES } from '../game/constants';
import { GameEvents } from '../game/events';
import type { DemonFormDefinition, EliteUpgradeDefinition, UpgradeDefinition, World } from '../game/types';
import { AwakeningView } from '../ui/awakeningView';
import { EliteUpgradeView } from '../ui/eliteUpgradeView';
import { ToastView } from '../ui/toastView';
import { TopStatusBar } from '../ui/topStatusBar';
import { MinionLegionBar } from '../ui/minionLegionBar';
import { SkillButtonView } from '../ui/skillButtonView';
import { SkillWheelView } from '../ui/skillWheelView';
import { DemonSlotMachineView } from '../ui/demonSlotMachineView';
import { ErgonomicZonesOverlay } from '../ui/ergonomicZonesOverlay';
import { PauseSettingsView } from '../ui/pauseSettingsView';
import { RadarMapView } from '../ui/radarMapView';
import { LegendBarView } from '../ui/legendBarView';
import { chooseOne } from '../utils/math';
import { HERO_LINES, SYSTEM_LINES } from '../data/dialogue';

export class UIScene extends Phaser.Scene {
  private eliteView?: EliteUpgradeView;
  private awakeningView?: AwakeningView;
  private toastView?: ToastView;
  private topStatusBar?: TopStatusBar;
  private minionLegion?: MinionLegionBar;
  private skillButton?: SkillButtonView;
  private skillWheel?: SkillWheelView;
  private demonSlot?: DemonSlotMachineView;
  private pauseSettingsView?: PauseSettingsView;
  private zones?: ErgonomicZonesOverlay;
  private radarMap?: RadarMapView;
  private legendBar?: LegendBarView;
  private lastPhase = 'playing';

  constructor() {
    super('UIScene');
  }

  create(): void {
    this.eliteView = new EliteUpgradeView(this, (upgrade) => this.pickEliteUpgrade(upgrade));
    this.awakeningView = new AwakeningView(this);
    this.toastView = new ToastView(this);

    // Portrait Phase-2 UI components
    this.zones = new ErgonomicZonesOverlay(this);
    this.topStatusBar = new TopStatusBar(this, () => this.openPauseSettings());
    this.minionLegion = new MinionLegionBar(this, (kind) => {
      console.log('[UIScene] minionLegion onSelectKind', kind);
      const ptr = this.input.activePointer;
      this.skillWheel?.showAt(ptr.x, ptr.y);
    });
    this.skillButton = new SkillButtonView(
      this,
      () => {
        console.log('[UIScene] skillButton onPress');
        gameScene.events.emit(GameEvents.shockwaveTriggered);
      },
      { label: '震荡' },
    );
    this.skillWheel = new SkillWheelView(this, (id) => {
      console.log('[UIScene] skillWheel onSelect', id);
    });
    this.demonSlot = new DemonSlotMachineView(this, {
      onClaim: (upgrade) => this.pickUpgrade(upgrade),
    });
    this.pauseSettingsView = new PauseSettingsView(this, () => this.closePauseSettings());
    this.radarMap = new RadarMapView(this);
    this.legendBar = new LegendBarView(this);

    const gameScene = this.scene.get('GameScene');
    gameScene.events.on(GameEvents.hudChanged, (world: World) => {
      this.topStatusBar?.update(world);
      this.minionLegion?.update(world);
      this.skillButton?.update(world);
      this.radarMap?.update(world);
      this.lastPhase = world.phase;
    });
    gameScene.events.on(GameEvents.showToast, (p: { text: string; tone?: 'hero' | 'system' }) =>
      this.toastView?.show(p.text, p.tone ?? 'system'),
    );
    gameScene.events.on(GameEvents.openSlot, (options: UpgradeDefinition[]) => {
      this.demonSlot?.show(options);
      this.toastView?.show(chooseOne(SYSTEM_LINES), 'system');
    });
    gameScene.events.on(GameEvents.closeSlot, () => this.demonSlot?.hide());
    gameScene.events.on(GameEvents.openEliteUpgrade, (options: EliteUpgradeDefinition[]) =>
      this.eliteView?.show(options, RUN_RULES.eliteUpgradeCost),
    );
    gameScene.events.on(GameEvents.closeEliteUpgrade, () => this.eliteView?.hide());
    gameScene.events.on(GameEvents.awakeningStarted, () => {
      this.awakeningView?.showRolling();
      this.toastView?.show('胚胎正在成形……', 'system');
    });
    gameScene.events.on(GameEvents.demonBorn, (form: DemonFormDefinition) => {
      this.awakeningView?.showResult(form);
      this.toastView?.show('开奖完成：魔王降临！', 'hero');
      this.time.delayedCall(1000, () => this.awakeningView?.hide());
    });
    gameScene.events.on(GameEvents.bossSpawned, () => this.toastView?.show('圣骑士降临，讨伐邪魔！', 'hero'));

    this.time.delayedCall(700, () => this.toastView?.show(chooseOne(HERO_LINES), 'hero'));
    this.time.addEvent({
      delay: 9000,
      loop: true,
      callback: () => {
        if (['playing', 'demon_rampage', 'boss'].includes(this.lastPhase)) {
          this.toastView?.show(chooseOne(HERO_LINES), 'hero');
        }
      },
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      gameScene.events.removeAllListeners(GameEvents.hudChanged);
      gameScene.events.removeAllListeners(GameEvents.openSlot);
      gameScene.events.removeAllListeners(GameEvents.closeSlot);
      gameScene.events.removeAllListeners(GameEvents.openEliteUpgrade);
      gameScene.events.removeAllListeners(GameEvents.closeEliteUpgrade);
      gameScene.events.removeAllListeners(GameEvents.awakeningStarted);
      gameScene.events.removeAllListeners(GameEvents.demonBorn);
      gameScene.events.removeAllListeners(GameEvents.showToast);
      gameScene.events.removeAllListeners(GameEvents.bossSpawned);

      this.topStatusBar?.destroy();
      this.minionLegion?.destroy();
      this.skillButton?.destroy();
      this.skillWheel?.destroy();
      this.demonSlot?.destroy();
      this.pauseSettingsView?.destroy();
      this.zones?.destroy();
      this.radarMap?.destroy();
      this.legendBar?.destroy();
    });
  }

  private pickUpgrade(upgrade: UpgradeDefinition): void {
    this.demonSlot?.hide();
    this.scene.get('GameScene').events.emit(GameEvents.upgradePicked, upgrade);
  }

  private pickEliteUpgrade(upgrade: EliteUpgradeDefinition): void {
    this.eliteView?.hide();
    this.scene.get('GameScene').events.emit(GameEvents.eliteUpgradePicked, upgrade);
  }

  private openPauseSettings(): void {
    this.scene.pause('GameScene');
    this.pauseSettingsView?.show();
  }

  private closePauseSettings(): void {
    this.pauseSettingsView?.hide();
    this.scene.resume('GameScene');
  }
}
