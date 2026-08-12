import { expect, type Locator, type Page } from '@playwright/test';

// Two equal reads, because a single one can still catch a frame of an in-flight animation
export const waitForSettledValue = async (
  read: () => Promise<string>,
): Promise<string> => {
  let previous = '';
  await expect(async () => {
    const before = previous;
    const current = await read();
    previous = current;
    expect(current).not.toBe('');
    expect(current).toBe(before);
  }).toPass();
  return previous;
};

export const requireBoundingBox = async (
  locator: Locator,
): Promise<{ x: number; y: number; width: number; height: number }> => {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box as NonNullable<typeof box>;
};

export interface TrackSample {
  readonly x: number;
  readonly animating: boolean;
}

// Sampled in-page per frame: the defect lives in frames Playwright cannot see from outside
export const recordTrackMotion = async (
  page: Page,
  run: () => Promise<void>,
): Promise<readonly TrackSample[]> => {
  await page.evaluate(() => {
    const track = document.querySelector('.carousel__track');
    const store = window as unknown as {
      __trackSamples?: TrackSample[];
      __trackRaf?: number;
    };
    const samples: TrackSample[] = [];
    store.__trackSamples = samples;
    const tick = (): void => {
      const style = getComputedStyle(track as Element);
      const matrix = new DOMMatrixReadOnly(style.transform);
      samples.push({
        x: matrix.m41,
        animating: (parseFloat(style.transitionDuration) || 0) > 0,
      });
      store.__trackRaf = requestAnimationFrame(tick);
    };
    store.__trackRaf = requestAnimationFrame(tick);
  });

  await run();

  return page.evaluate(() => {
    const store = window as unknown as {
      __trackSamples?: TrackSample[];
      __trackRaf?: number;
    };
    cancelAnimationFrame(store.__trackRaf ?? 0);
    return store.__trackSamples ?? [];
  });
};

// Catches the snap back running while the transition is still on, flying a whole slide at once
export const sawTeleportWhileAnimating = (
  samples: readonly TrackSample[],
  step: number,
): boolean => {
  const animatedFrames = samples.filter((sample) => sample.animating).length;
  expect(animatedFrames).toBeGreaterThan(0);

  return samples.some((current, i) => {
    if (i === 0) return false;
    const previous = samples[i - 1];

    return (
      current.animating &&
      previous.animating &&
      Math.abs(current.x - previous.x) >= step
    );
  });
};

// The mirror case: with the transition off, only the teleport jumps, by whole list periods
export const sawInstantSnap = (
  samples: readonly TrackSample[],
  step: number,
  period: number,
): boolean =>
  samples.some((current, i) => {
    if (i === 0) return false;
    const previous = samples[i - 1];

    const delta = Math.abs(current.x - previous.x);
    const periods = Math.round(delta / period);
    const isCleanPeriodJump = Math.abs(delta - periods * period) < step * 0.5;

    return !current.animating && !isCleanPeriodJump;
  });
