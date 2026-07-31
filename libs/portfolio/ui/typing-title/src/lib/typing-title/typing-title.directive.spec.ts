import { Component, input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TypingTitleDirective } from './typing-title.directive';

@Component({
  imports: [TypingTitleDirective],
  template: `
    <span [appTypingTitle]="phrases()" data-testid="title"></span>
  `,
})
class HostComponent {
  readonly phrases = input<readonly string[]>([]);
}

describe('TypingTitleDirective', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function setReducedMotion(matches: boolean): void {
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches } as unknown as MediaQueryList);
  }

  function title(fixture: ComponentFixture<HostComponent>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="title"]',
    ) as HTMLElement;
  }

  async function advance(
    fixture: ComponentFixture<HostComponent>,
    ms: number,
  ): Promise<void> {
    await vi.advanceTimersByTimeAsync(ms);
    fixture.detectChanges();
  }

  it('should type, hold, erase and loop the phrase', async () => {
    setReducedMotion(false);
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentRef.setInput('phrases', ['AB']);
    fixture.detectChanges();
    expect(title(fixture).textContent).toBe('');

    await advance(fixture, 100);
    expect(title(fixture).textContent).toBe('A');

    await advance(fixture, 100);
    expect(title(fixture).textContent).toBe('AB');

    await advance(fixture, 1200);
    expect(title(fixture).textContent).toBe('A');

    await advance(fixture, 50);
    expect(title(fixture).textContent).toBe('');

    await advance(fixture, 100);
    expect(title(fixture).textContent).toBe('A');
  });

  it('should render the first phrase statically when reduced motion is preferred', async () => {
    setReducedMotion(true);
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentRef.setInput('phrases', ['AB', 'CD']);
    fixture.detectChanges();

    expect(title(fixture).textContent).toBe('AB');
    expect(vi.getTimerCount()).toBe(0);

    await advance(fixture, 5000);
    expect(title(fixture).textContent).toBe('AB');
  });
});
