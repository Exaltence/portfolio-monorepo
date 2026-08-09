import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabGroupComponent } from './tab-group.component';

@Component({
  imports: [TabGroupComponent],
  template: `
    <app-tab-group
      [tabGroup]="['Skills', 'Experience']"
      (activeChange)="onChange($event)"
    >
      <ng-template>Skills panel</ng-template>
      <ng-template>Experience panel</ng-template>
    </app-tab-group>
  `,
})
class HostComponent {
  changed: number | undefined;

  onChange(index: number): void {
    this.changed = index;
  }
}

@Component({
  imports: [TabGroupComponent],
  template: `
    <app-tab-group [tabGroup]="['Skills']">
      <ng-template>First panel</ng-template>
    </app-tab-group>
    <app-tab-group [tabGroup]="['Skills']">
      <ng-template>Second panel</ng-template>
    </app-tab-group>
  `,
})
class TwoGroupsHostComponent {}

describe('TabGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
  });

  function headers(): HTMLButtonElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid="tab-header"]',
      ),
    );
  }

  function panel(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="tab-panel"]',
    ) as HTMLElement;
  }

  function pressKey(key: string): void {
    const focused =
      headers().find((h) => h.getAttribute('aria-selected') === 'true') ??
      headers()[0];
    focused.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
  }

  it('should expose only the active tab as a tab stop', async () => {
    await fixture.whenStable();

    expect(headers().map((h) => h.getAttribute('tabindex'))).toEqual([
      '0',
      '-1',
    ]);
  });

  it('should move activation and focus with the arrow keys, wrapping around', async () => {
    await fixture.whenStable();

    pressKey('ArrowRight');
    await fixture.whenStable();

    expect(fixture.componentInstance.changed).toBe(1);
    expect(document.activeElement).toBe(headers()[1]);
    expect(headers().map((h) => h.getAttribute('tabindex'))).toEqual([
      '-1',
      '0',
    ]);

    pressKey('ArrowRight');
    await fixture.whenStable();

    expect(fixture.componentInstance.changed).toBe(0);
    expect(document.activeElement).toBe(headers()[0]);
  });

  it('should jump to the last and first tab with End and Home', async () => {
    await fixture.whenStable();

    pressKey('End');
    await fixture.whenStable();
    expect(fixture.componentInstance.changed).toBe(1);

    pressKey('Home');
    await fixture.whenStable();
    expect(fixture.componentInstance.changed).toBe(0);
  });

  it('should ignore keys that are not tablist navigation', async () => {
    await fixture.whenStable();

    pressKey('ArrowDown');
    await fixture.whenStable();

    expect(fixture.componentInstance.changed).toBeUndefined();
  });

  it('should name the panel after the active tab and follow the selection', async () => {
    await fixture.whenStable();

    expect(panel().getAttribute('aria-labelledby')).toBe(headers()[0].id);

    headers()[1].click();
    await fixture.whenStable();

    expect(panel().getAttribute('aria-labelledby')).toBe(headers()[1].id);
  });

  it('should make the panel a tab stop, since its content is not focusable', async () => {
    await fixture.whenStable();

    expect(panel().getAttribute('tabindex')).toBe('0');
    expect(panel().querySelector('a, button, [tabindex]')).toBeNull();
  });

  it('should point every tab at the panel it controls', async () => {
    await fixture.whenStable();

    for (const header of headers()) {
      const controls = header.getAttribute('aria-controls');
      expect(controls).toBe(panel().id);
      expect(
        (fixture.nativeElement as HTMLElement).querySelector(`#${controls}`),
      ).toBe(panel());
    }
  });

  it('should render a header per provided label', async () => {
    await fixture.whenStable();

    expect(headers().map((h) => h.textContent?.trim())).toEqual([
      'Skills',
      'Experience',
    ]);
    expect(panel().textContent).toContain('Skills panel');
  });

  it('should activate and reveal the panel of the clicked header', async () => {
    await fixture.whenStable();

    headers()[1].click();
    await fixture.whenStable();

    expect(headers()[1].getAttribute('aria-selected')).toBe('true');
    expect(headers()[0].getAttribute('aria-selected')).toBe('false');
    expect(fixture.componentInstance.changed).toBe(1);
    expect(panel().textContent).toContain('Experience panel');
    expect(panel().textContent).not.toContain('Skills panel');
  });

  it('should keep ids unique when two groups share a document', async () => {
    const twoGroups = TestBed.createComponent(TwoGroupsHostComponent);
    await twoGroups.whenStable();

    const host = twoGroups.nativeElement as HTMLElement;
    const ids = Array.from(
      host.querySelectorAll('[data-testid="tab-header"], [role="tabpanel"]'),
    ).map((el) => el.id);

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(ids.length);

    // Each panel must resolve to a tab inside its own group, not the first one
    for (const tabPanel of Array.from(
      host.querySelectorAll('[role="tabpanel"]'),
    )) {
      const labelledBy = tabPanel.getAttribute('aria-labelledby') as string;
      const label = host.querySelector(`#${labelledBy}`);
      expect(label?.closest('.tab-group')).toBe(tabPanel.closest('.tab-group'));
    }
  });
});
