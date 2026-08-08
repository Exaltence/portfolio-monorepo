import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconName, IconRegistryService } from '@portfolio-monorepo/shared/data';
import { type Mocked } from 'vitest';
import { IconComponent } from './icon.component';

function createSvg(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.appendChild(
    document.createElementNS('http://www.w3.org/2000/svg', 'path'),
  );

  return svg;
}

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;
  let component: IconComponent;
  let registryStub: Mocked<Pick<IconRegistryService, 'get'>>;

  beforeEach(async () => {
    registryStub = { get: vi.fn() };
    registryStub.get.mockReturnValue(signal(null));

    await TestBed.configureTestingModule({
      imports: [IconComponent],
      providers: [{ provide: IconRegistryService, useValue: registryStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(IconComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the svg the registry resolves for the requested icon', async () => {
    registryStub.get.mockReturnValue(signal(createSvg()));
    fixture.componentRef.setInput('name', 'mdi--close');

    await fixture.whenStable();

    expect(registryStub.get).toHaveBeenCalledWith('mdi--close');

    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('svg')).toBeInstanceOf(SVGSVGElement);
    expect(el.querySelectorAll('path')).toHaveLength(1);
  });

  it('should render nothing while the registry has no svg for the icon', async () => {
    fixture.componentRef.setInput('name', 'mdi--close');

    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('svg')).toBeNull();
  });

  it('should swap the rendered svg when the icon name changes', async () => {
    const icons: Record<string, SVGSVGElement> = {
      'mdi--close': createSvg(),
      'mdi-light--menu': createSvg(),
    };

    registryStub.get.mockImplementation((name: IconName) =>
      signal(icons[name] ?? null),
    );

    fixture.componentRef.setInput('name', 'mdi--close');
    await fixture.whenStable();

    fixture.componentRef.setInput('name', 'mdi-light--menu');
    await fixture.whenStable();

    expect(registryStub.get).toHaveBeenLastCalledWith('mdi-light--menu');

    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')?.isEqualNode(icons['mdi-light--menu'])).toBe(
      true,
    );
  });

  it('should hide the icon from assistive technology by default', async () => {
    fixture.componentRef.setInput('name', 'mdi--close');

    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;

    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBeNull();
    expect(el.getAttribute('aria-label')).toBeNull();
  });

  it('should expose a labelled icon as an image to assistive technology', async () => {
    fixture.componentRef.setInput('name', 'mdi--close');
    fixture.componentRef.setInput('label', 'Close');

    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;

    expect(el.getAttribute('role')).toBe('img');
    expect(el.getAttribute('aria-label')).toBe('Close');
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });
});
