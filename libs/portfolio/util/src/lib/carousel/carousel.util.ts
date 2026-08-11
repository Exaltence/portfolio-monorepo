export function wrapIndex(value: number, count: number): number {
  return ((value % count) + count) % count;
}

// When both directions are the same length the choice is made explicitly: ties go forward
export function shortestWrappedDelta(diff: number, count: number): number {
  const wrapped = wrapIndex(diff, count);
  return wrapped * 2 > count ? wrapped - count : wrapped;
}
