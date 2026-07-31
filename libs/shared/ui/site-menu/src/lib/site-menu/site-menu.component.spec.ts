import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavItem } from '@portfolio-monorepo/shared/util';
import { SiteMenuComponent } from './site-menu.component';

const ITEMS: readonly NavItem[] = [
  { label: 'Home', fragment: 'home' },
  { label: 'Portfolio', fragment: 'portfolio' },
];

describe('SiteMenuComponent', () => {
  let fixture: ComponentFixture<SiteMenuComponent>;

  beforeEach(() => {
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

  it('should render items with a staggered transition delay when open', async () => {
    fixture.componentRef.setInput('open', true);
    await fixture.whenStable();

    const rendered = links();
    expect(rendered).toHaveLength(2);
    expect(rendered[0].style.transitionDelay).toBe('0ms');
    expect(rendered[1].style.transitionDelay).toBe('200ms');
  });

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
});
