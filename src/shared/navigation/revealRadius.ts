export type RevealOrigin = { x: number; y: number };

/** Dairenin merkezinden ekranin en uzak kosesine olan mesafe; daire bu yaricapa kadar buyur. */
export function revealRadius(origin: RevealOrigin, width: number, height: number): number {
  const dx = Math.max(origin.x, width - origin.x);
  const dy = Math.max(origin.y, height - origin.y);
  return Math.hypot(dx, dy);
}
