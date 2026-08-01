import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabsComponent } from './tabs.component';

@Component({
  imports: [TabsComponent],
  template: `
    <app-tabs
      [tabs]="['Skills', 'Experience']"
      (activeChange)="onChange($event)"
    >
      <ng-template>Skills panel</ng-template>
      <ng-template>Experience panel</ng-template>
    </app-tabs>
  `,
})
class HostComponent {
  changed: number | undefined;

  onChange(index: number): void {
    this.changed = index;
  }
}

describe('TabsComponent', () => {
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
});
