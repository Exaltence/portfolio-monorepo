import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ThemeToggleComponent);
  });

  function button(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="theme-toggle"]',
    ) as HTMLButtonElement;
  }

  it('should render the sun icon and light class when the theme is light', async () => {
    fixture.componentRef.setInput('theme', 'light');
    await fixture.whenStable();

    expect(button().classList.contains('light')).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '.theme-toggle__icon--sun',
      ),
    ).not.toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '.theme-toggle__icon--moon',
      ),
    ).toBeNull();
  });

  it('should render the moon icon without the light class when the theme is dark', async () => {
    fixture.componentRef.setInput('theme', 'dark');
    await fixture.whenStable();

    expect(button().classList.contains('light')).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '.theme-toggle__icon--moon',
      ),
    ).not.toBeNull();
  });

  it('should emit toggle once when clicked', async () => {
    fixture.componentRef.setInput('theme', 'dark');
    await fixture.whenStable();
    const spy = vi.fn();
    fixture.componentInstance.toggled.subscribe(spy);

    button().click();

    expect(spy).toHaveBeenCalledTimes(1);
  });
});
