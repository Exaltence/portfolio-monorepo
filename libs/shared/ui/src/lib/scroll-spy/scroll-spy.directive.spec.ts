import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ScrollSpyDirective } from './scroll-spy.directive';

@Component({
  imports: [ScrollSpyDirective],
  template: `
    <div appScrollSpy (scrolled)="onScrolled($event)"></div>
  `,
})
class HostComponent {
  scrolledValue: boolean | undefined;

  onScrolled(value: boolean): void {
    this.scrolledValue = value;
  }
}

describe('ScrollSpyDirective', () => {
  let capturedCallback: IntersectionObserverCallback;
  let observeSpy: ReturnType<typeof vi.fn>;
  let disconnectSpy: ReturnType<typeof vi.fn>;
  const originalObserver = window.IntersectionObserver;

  beforeEach(() => {
    observeSpy = vi.fn();
    disconnectSpy = vi.fn();

    class MockIntersectionObserver {
      readonly observe = observeSpy;
      readonly disconnect = disconnectSpy;
      readonly unobserve = vi.fn();
      readonly takeRecords = vi.fn();
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds: readonly number[] = [];

      constructor(callback: IntersectionObserverCallback) {
        capturedCallback = callback;
      }
    }

    window.IntersectionObserver =
      MockIntersectionObserver as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = originalObserver;
  });

  function trigger(isIntersecting: boolean): void {
    capturedCallback(
      [{ isIntersecting }] as unknown as IntersectionObserverEntry[],
      {} as IntersectionObserver,
    );
  }

  it('should observe the host element on creation', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    expect(observeSpy).toHaveBeenCalledTimes(1);
  });

  it('should emit true when the sentinel leaves the viewport', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    trigger(false);

    expect(fixture.componentInstance.scrolledValue).toBe(true);
  });

  it('should emit false when the sentinel is visible', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    trigger(true);

    expect(fixture.componentInstance.scrolledValue).toBe(false);
  });

  it('should disconnect the observer when destroyed', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    fixture.destroy();

    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
