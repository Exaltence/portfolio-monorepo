import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnimationCallbackEvent, signal } from '@angular/core';
import { Subject } from 'rxjs';

import { Project, ProjectModalData } from '@portfolio-monorepo/portfolio/data';
import { IconRegistryService } from '@portfolio-monorepo/shared/data';
import { ProjectModalComponent } from './project-modal.component';

const iconRegistryStub: Pick<IconRegistryService, 'get'> = {
  get: () => signal(null),
};

const PROJECTS: readonly Project[] = [
  {
    id: 'a',
    title: 'Project A',
    category: 'Web, Angular',
    thumbnailUrl: 'img/a.png',
    images: ['img/a-1.png', 'img/a-2.png'],
    descriptions: ['A first paragraph.', 'A second paragraph.'],
  },
  {
    id: 'b',
    title: 'Project B',
    category: 'Mobile, Angular',
    thumbnailUrl: 'img/b.png',
    images: ['img/b-1.png'],
    descriptions: ['B first paragraph.', 'B second paragraph.'],
  },
];

describe('ProjectModalComponent', () => {
  let fixture: ComponentFixture<ProjectModalComponent>;
  let dialogRef: {
    close: ReturnType<typeof vi.fn>;
    disableClose: boolean;
    backdropClick: Subject<MouseEvent>;
    keydownEvents: Subject<KeyboardEvent>;
  };

  beforeEach(() => {
    dialogRef = {
      close: vi.fn(),
      disableClose: false,
      backdropClick: new Subject<MouseEvent>(),
      keydownEvents: new Subject<KeyboardEvent>(),
    };
    const data: ProjectModalData = { projects: PROJECTS, index: 0 };
    TestBed.configureTestingModule({
      providers: [
        { provide: DIALOG_DATA, useValue: data },
        { provide: DialogRef, useValue: dialogRef },
        { provide: IconRegistryService, useValue: iconRegistryStub },
      ],
    });
    fixture = TestBed.createComponent(ProjectModalComponent);
  });

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  function byTestId(id: string): HTMLElement {
    return el().querySelector(`[data-testid="${id}"]`) as HTMLElement;
  }

  it('should render the starting project title, category and descriptions', async () => {
    await fixture.whenStable();

    expect(byTestId('modal-title').textContent).toContain('Project A');
    expect(
      el().querySelector('.project-modal__category')?.textContent,
    ).toContain('Web, Angular');
    expect(el().querySelector('.project-modal__desc')?.textContent).toContain(
      'A first paragraph.',
    );
  });

  it('should move to the next project', async () => {
    await fixture.whenStable();

    byTestId('modal-next').click();
    await fixture.whenStable();

    expect(byTestId('modal-title').textContent).toContain('Project B');
  });

  it('should switch the active image', async () => {
    await fixture.whenStable();

    byTestId('modal-image-1').click();
    await fixture.whenStable();

    expect(byTestId('modal-main-image').getAttribute('src')).toBe(
      'img/a-2.png',
    );
  });

  it('should expose the selected thumbnail as pressed rather than by colour alone', async () => {
    await fixture.whenStable();

    expect(byTestId('modal-image-0').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('modal-image-1').getAttribute('aria-pressed')).toBe(
      'false',
    );

    byTestId('modal-image-1').click();
    await fixture.whenStable();

    expect(byTestId('modal-image-0').getAttribute('aria-pressed')).toBe(
      'false',
    );
    expect(byTestId('modal-image-1').getAttribute('aria-pressed')).toBe('true');
  });

  it('should hide the modal when close is clicked', async () => {
    await fixture.whenStable();

    byTestId('modal-close').click();
    await fixture.whenStable();

    expect(el().querySelector('.project-modal')).toBeFalsy();
  });

  it('should close the dialog only once the leave animation reports completion', () => {
    vi.useFakeTimers();
    const target = document.createElement('div');
    const animationComplete = vi.fn();

    fixture.componentInstance['onLeave']({
      target,
      animationComplete,
    } as AnimationCallbackEvent);

    expect(dialogRef.close).not.toHaveBeenCalled();

    target.dispatchEvent(new Event('animationend'));

    expect(animationComplete).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(300);
    expect(dialogRef.close).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should still close the dialog when the leave animation never reports completion', () => {
    vi.useFakeTimers();
    const target = document.createElement('div');
    const animationComplete = vi.fn();

    fixture.componentInstance['onLeave']({
      target,
      animationComplete,
    } as AnimationCallbackEvent);

    expect(dialogRef.close).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5000);

    expect(animationComplete).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should ignore an animation end that arrives after the fallback closed it', () => {
    vi.useFakeTimers();
    const target = document.createElement('div');
    const animationComplete = vi.fn();

    fixture.componentInstance['onLeave']({
      target,
      animationComplete,
    } as AnimationCallbackEvent);

    vi.advanceTimersByTime(5000);
    target.dispatchEvent(new Event('animationend'));
    vi.advanceTimersByTime(5000);

    expect(animationComplete).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it('should not let the fallback cut a leave animation short', () => {
    vi.useFakeTimers();
    const target = document.createElement('div');
    const animationComplete = vi.fn();

    fixture.componentInstance['onLeave']({
      target,
      animationComplete,
    } as AnimationCallbackEvent);

    // 300ms is the default scene duration
    vi.advanceTimersByTime(300);
    expect(animationComplete).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
