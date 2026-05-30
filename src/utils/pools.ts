export function removeInactive<T extends { active?: boolean; alive?: boolean }>(items: T[]): void {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    const item = items[i];
    if (item.active === false || item.alive === false) {
      items.splice(i, 1);
    }
  }
}
