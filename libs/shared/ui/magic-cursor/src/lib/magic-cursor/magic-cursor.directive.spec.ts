import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MagicCursorDirective } from './magic-cursor.directive';

@Component({
  imports: [MagicCursorDirective],
  template: `
    <div appMagicCursor data-testid="host"></div>
  `,
})
class HostComponent {}

describe('MagicCursorDirective', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function setPointerFine(matches: boolean): void {
    window.matchMedia = vi
      .fn()
      .mockReturnValue({ matches } as unknown as MediaQueryList);
  }

  function createHost(): ComponentFixture<HostComponent> {
    return TestBed.createComponent(HostComponent);
  }

  function host(fixture: ComponentFixture<HostComponent>): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="host"]',
    ) as HTMLElement;
  }

  function movePointer(x: number, y: number): void {
    window.dispatchEvent(
      new PointerEvent('pointermove', { clientX: x, clientY: y }),
    );
  }

  it('should track the pointer when a fine pointer is available', async () => {
    setPointerFine(true);
    const fixture = createHost();
    await fixture.whenStable();

    movePointer(10, 20);
    await fixture.whenStable();

    expect(host(fixture).style.getPropertyValue('--cursor-x')).toBe('10px');
    expect(host(fixture).style.getPropertyValue('--cursor-y')).toBe('20px');
  });

  it('should not track the pointer on a coarse pointer device', async () => {
    setPointerFine(false);
    const fixture = createHost();
    await fixture.whenStable();

    movePointer(10, 20);
    await fixture.whenStable();

    expect(host(fixture).style.getPropertyValue('--cursor-x')).toBe('0px');
    expect(host(fixture).style.getPropertyValue('--cursor-y')).toBe('0px');
  });
});
