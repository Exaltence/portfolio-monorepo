import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotFoundComponent } from './not-found.component';

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(NotFoundComponent);
  });

  it('should render the not found message', async () => {
    await fixture.whenStable();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '[data-testid="not-found-text"]',
      )?.textContent,
    ).toContain('could not be found');
  });

  it('should suppress native dragging on the router link', async () => {
    await fixture.whenStable();

    const link = (fixture.nativeElement as HTMLElement).querySelector(
      '.not-found__link',
    ) as HTMLAnchorElement;

    expect(link.getAttribute('draggable')).toBe('false');

    const dragstart = new Event('dragstart', {
      bubbles: true,
      cancelable: true,
    });
    link.dispatchEvent(dragstart);
    expect(dragstart.defaultPrevented).toBe(true);
  });
});
