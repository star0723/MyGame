import { ELITE_MINION_UPGRADES } from '../data/eliteMinions';
import { getEliteTraitBySymbol } from '../data/eliteTraits';
import { UPGRADES } from '../data/upgrades';
import { RUN_RULES } from '../game/constants';
import type { EliteUpgradeDefinition, UpgradeDefinition, World } from '../game/types';
import { setRunPhase } from '../game/runState';
import { takeRandom } from '../utils/random';

const SUMMON_PRIORITY = ['summon-goblin', 'summon-slime'] as const;

export function rollUpgrades(world?: World): UpgradeDefinition[] {
  const picked = takeRandom(UPGRADES, 3);
  if (!world || world.player.level > 3) return picked;
  const byId = new Map(UPGRADES.map((upgrade) => [upgrade.id, upgrade]));
  const result = [...picked];
  for (const id of SUMMON_PRIORITY) {
    if (result.some((upgrade) => upgrade.id === id)) continue;
    const upgrade = byId.get(id);
    if (upgrade) result.unshift(upgrade);
  }
  return result.slice(0, 3);
}

export function isCostCapped(world: World): boolean {
  return world.player.isDemon || world.demon.awakened;
}

export function getSlotCost(world: World): number {
  const cost = RUN_RULES.slotCostBase + world.economy.slotRolls * RUN_RULES.slotCostGrowth;
  return isCostCapped(world) ? Math.min(cost, RUN_RULES.slotCostCap) : cost;
}

export function getEliteUpgradeCost(world: World): number {
  const cost = RUN_RULES.eliteUpgradeCost + world.economy.eliteRolls * RUN_RULES.eliteUpgradeCostGrowth;
  return isCostCapped(world) ? Math.min(cost, RUN_RULES.eliteUpgradeCostCap) : cost;
}

export function spendSlotCost(world: World): boolean {
  if (world.economy.pendingSlot) return true;
  const cost = getSlotCost(world);
  if (world.economy.bloodChips < cost) return false;
  world.economy.bloodChips -= cost;
  world.stats.chipsSpent += cost;
  world.economy.slotRolls += 1;
  return true;
}

export function calculateEliteTraitMultiplier(symbols: string[]): number {
  const counts = new Map<string, number>();
  symbols.slice(0, 3).forEach((symbol) => counts.set(symbol, (counts.get(symbol) ?? 0) + 1));
  const best = Math.max(...counts.values());
  if (best === 3) return 9;
  if (best === 2) return 6;
  return 1;
}

export function applyEliteTraitRoll(world: World, minionId: number, symbols: string[]): boolean {
  const target = world.minions.find((minion) => minion.id === minionId && minion.alive);
  if (!target) return false;

  const multiplier = calculateEliteTraitMultiplier(symbols);
  const chosenSymbol = multiplier === 1
    ? symbols[0]
    : symbols.find((symbol) => symbols.filter((s) => s === symbol).length > 1) ?? symbols[0];
  const trait = getEliteTraitBySymbol(chosenSymbol);
  if (!trait) return false;

  if (!target.elite) {
    target.elite = { id: `${target.kind}-elite`, title: '升格精英', traits: [] };
    world.stats.eliteUpgrades += 1;
  }

  const existing = target.elite.traits.find((applied) => applied.id === trait.id);
  if (existing) {
    existing.multiplier += multiplier;
    existing.stacks += 1;
  } else {
    target.elite.traits.push({
      id: trait.id,
      name: trait.name,
      color: trait.color,
      multiplier,
      stacks: 1,
    });
  }
  trait.apply(target, world, multiplier);
  return true;
}

export function applyUpgrade(world: World, upgrade: UpgradeDefinition): void {
  upgrade.apply(world);
  world.economy.pendingSlot = false;
  setRunPhase(world, 'playing', `upgrade:${upgrade.id}`);
}

export function getAvailableEliteUpgrades(world: World): EliteUpgradeDefinition[] {
  const ownedKinds = new Set(world.minions.filter((minion) => !minion.elite).map((minion) => minion.kind));
  return ELITE_MINION_UPGRADES.filter((upgrade) => ownedKinds.has(upgrade.sourceKind));
}

export function applyEliteUpgrade(world: World, upgrade: EliteUpgradeDefinition): boolean {
  const cost = getEliteUpgradeCost(world);
  if (world.economy.bloodChips < cost) return false;

  const target = world.minions.find((minion) => minion.kind === upgrade.sourceKind && !minion.elite);
  if (!target) return false;

  world.economy.bloodChips -= cost;
  world.stats.chipsSpent += cost;
  world.economy.eliteRolls += 1;
  upgrade.apply(target, world);
  world.economy.pendingEliteUpgrade = false;
  setRunPhase(world, 'playing', `elite:${upgrade.id}`);
  return true;
}
