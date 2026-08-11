import { shortestWrappedDelta } from './carousel.util';

describe('shortestWrappedDelta', () => {
  it('should take the shorter way round', () => {
    expect(shortestWrappedDelta(1, 4)).toBe(1);
    expect(shortestWrappedDelta(-1, 4)).toBe(-1);
    expect(shortestWrappedDelta(3, 4)).toBe(-1);
    expect(shortestWrappedDelta(-3, 4)).toBe(1);
    expect(shortestWrappedDelta(4, 5)).toBe(-1);
  });

  it('should resolve an exact half-wrap forward, whichever way it is spelled', () => {
    expect(shortestWrappedDelta(1, 2)).toBe(1);
    expect(shortestWrappedDelta(-1, 2)).toBe(1);
    expect(shortestWrappedDelta(2, 4)).toBe(2);
    expect(shortestWrappedDelta(-2, 4)).toBe(2);
  });

  it('should stay put when the target is already current', () => {
    expect(shortestWrappedDelta(0, 4)).toBe(0);
    expect(shortestWrappedDelta(4, 4)).toBe(0);
    expect(shortestWrappedDelta(-4, 4)).toBe(0);
  });
});
