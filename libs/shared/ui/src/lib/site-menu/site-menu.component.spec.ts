import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconRegistryService, NavItem } from '@portfolio-monorepo/shared/data';
import { SiteMenuComponent } from './site-menu.component';

const ITEMS: readonly NavItem[] = [
  { label: 'Home', fragment: 'home' },
  { label: 'Portfolio', fragment: 'portfolio' },
];

const iconRegistryStub: Pick<IconRegistryService, 'get'> = {
  get: () => signal(null),
};

describe('SiteMenuComponent', () => {
  let fixture: ComponentFixture<SiteMenuComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: IconRegistryService, useValue: iconRegistryStub }],
    });

    fixture = TestBed.createComponent(SiteMenuComponent);
    fixture.componentRef.setInput('items', ITEMS);
  });

  function links(): HTMLAnchorElement[] {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '[data-testid="nav-item"]',
      ),
    );
  }

  function overlay(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="nav-overlay"]',
    ) as HTMLElement;
  }

  function closeButton(): HTMLElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="nav-close"]',
    ) as HTMLElement;
  }

  it('should emit navigate and close when an item is clicked', async () => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();
    const spy = vi.fn();
    fixture.componentInstance.navigate.subscribe(spy);

    links()[0].click();
    await fixture.whenStable();

    expect(spy).toHaveBeenCalledWith(ITEMS[0]);
    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('should close when the overlay is clicked', async () => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    overlay().click();
    await fixture.whenStable();

    expect(fixture.componentInstance.open()).toBe(false);
  });

  it('should close when on close button is clicked', async () => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    closeButton().click();
    await fixture.whenStable();

    expect(fixture.componentInstance.open()).toBe(false);
  });
});
