import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconRegistryService } from './icon-registry.service';

const MENU_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"><path d="M3 8V7h17v1z" /></svg>';

describe('IconRegistryService', () => {
  let registry: IconRegistryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClientTesting()],
    });

    registry = TestBed.inject(IconRegistryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function settle(): Promise<unknown> {
    return TestBed.inject(ApplicationRef).whenStable();
  }

  it('should request the icon from the public icon directory', () => {
    registry.get('mdi-light--menu');

    TestBed.tick();

    const request = httpMock.expectOne('img/icons/mdi-light--menu.svg');

    expect(request.request.method).toBe('GET');

    request.flush(MENU_SVG);
  });

  it('should expose the parsed svg element once loaded', async () => {
    const icon = registry.get('mdi-light--menu');

    TestBed.tick();

    httpMock.expectOne('img/icons/mdi-light--menu.svg').flush(MENU_SVG);

    await settle();

    expect(icon()).toBeInstanceOf(SVGSVGElement);
    expect(icon()?.getAttribute('width')).toBe('100%');
    expect(icon()?.getAttribute('height')).toBe('100%');
    expect(icon()?.getAttribute('focusable')).toBe('false');
    expect(icon()?.querySelector('path')).not.toBeNull();
  });

  it('should reuse a single request for repeated reads of the same icon', () => {
    const first = registry.get('mdi--close');

    const second = registry.get('mdi--close');

    TestBed.tick();

    expect(second).toBe(first);

    httpMock.expectOne('img/icons/mdi--close.svg').flush(MENU_SVG);
  });

  it('should expose null while the icon is still loading', () => {
    const icon = registry.get('mdi--close');

    TestBed.tick();

    expect(icon()).toBeNull();

    httpMock.expectOne('img/icons/mdi--close.svg').flush(MENU_SVG);
  });

  it('should expose null when the response is not an svg document', async () => {
    const icon = registry.get('mdi--close');

    TestBed.tick();

    httpMock.expectOne('img/icons/mdi--close.svg').flush('<div></div>');

    await settle();

    expect(icon()).toBeNull();
  });

  it('should expose null when the icon fails to load', async () => {
    const icon = registry.get('mdi-light--arrow-left');

    TestBed.tick();

    httpMock
      .expectOne('img/icons/mdi-light--arrow-left.svg')
      .flush('Not Found', { status: 404, statusText: 'Not Found' });

    await settle();

    expect(icon()).toBeNull();
  });
});
