import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackToTopComponent } from './back-to-top.component';

describe('BackToTopComponent', () => {
  let fixture: ComponentFixture<BackToTopComponent>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BackToTopComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function button(): HTMLButtonElement {
    return (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="back-to-top"]',
    ) as HTMLButtonElement;
  }

  it('should scroll to the top when clicked', async () => {
    const scrollToSpy = vi
      .spyOn(window, 'scrollTo')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    button().click();

    expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('should expose the is-visible class based on the visible input', async () => {
    fixture.componentRef.setInput('visible', true);
    await fixture.whenStable();
    expect(button().classList.contains('is-visible')).toBe(true);

    fixture.componentRef.setInput('visible', false);
    await fixture.whenStable();
    expect(button().classList.contains('is-visible')).toBe(false);
  });
});
