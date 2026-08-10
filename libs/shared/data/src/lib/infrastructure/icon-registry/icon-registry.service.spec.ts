import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconRegistryService } from './icon-registry.service';

const SPRITE_URL = 'img/icons/sprite.svg';

const SPRITE = `<svg xmlns="http://www.w3.org/2000/svg">
  <symbol id="mdi-light--menu" fill="currentColor" viewBox="0 0 24 24"><path d="M3 8V7h17v1z" /></symbol>
  <symbol id="mdi--close" viewBox="0 0 24 24"><path fill="currentColor" d="M19 6.41L17.59 5z" /></symbol>
</svg>`;

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

  it('should request the sprite from the public icon directory', () => {
    registry.get('mdi-light--menu');

    TestBed.tick();

    const request = httpMock.expectOne(SPRITE_URL);

    expect(request.request.method).toBe('GET');

    request.flush(SPRITE);
  });

  it('should serve every icon from a single sprite request', async () => {
    const menu = registry.get('mdi-light--menu');
    const close = registry.get('mdi--close');

    TestBed.tick();

    httpMock.expectOne(SPRITE_URL).flush(SPRITE);

    await settle();

    expect(menu()).toBeInstanceOf(SVGSVGElement);
    expect(close()).toBeInstanceOf(SVGSVGElement);
  });

  it('should expose the parsed svg element once loaded', async () => {
    const icon = registry.get('mdi-light--menu');

    TestBed.tick();

    httpMock.expectOne(SPRITE_URL).flush(SPRITE);

    await settle();

    expect(icon()?.getAttribute('width')).toBe('100%');
    expect(icon()?.getAttribute('height')).toBe('100%');
    expect(icon()?.getAttribute('focusable')).toBe('false');
    expect(icon()?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(icon()?.getAttribute('fill')).toBe('currentColor');
    expect(icon()?.getAttribute('id')).toBeNull();
    expect(icon()?.querySelector('path')).not.toBeNull();
  });

  it('should reuse a single signal for repeated reads of the same icon', () => {
    const first = registry.get('mdi--close');

    const second = registry.get('mdi--close');

    TestBed.tick();

    expect(second).toBe(first);

    httpMock.expectOne(SPRITE_URL).flush(SPRITE);
  });

  it('should expose null while the sprite is still loading', () => {
    const icon = registry.get('mdi--close');

    TestBed.tick();

    expect(icon()).toBeNull();

    httpMock.expectOne(SPRITE_URL).flush(SPRITE);
  });

  it('should expose null for an icon the sprite does not contain', async () => {
    const icon = registry.get('simple-icons--nx');

    TestBed.tick();

    httpMock.expectOne(SPRITE_URL).flush(SPRITE);

    await settle();

    expect(icon()).toBeNull();
  });

  it('should expose null when the response is not an svg document', async () => {
    const icon = registry.get('mdi--close');

    TestBed.tick();

    httpMock.expectOne(SPRITE_URL).flush('<div></div>');

    await settle();

    expect(icon()).toBeNull();
  });

  it('should expose null when the sprite fails to load', async () => {
    const icon = registry.get('mdi-light--arrow-left');

    TestBed.tick();

    httpMock
      .expectOne(SPRITE_URL)
      .flush('Not Found', { status: 404, statusText: 'Not Found' });

    await settle();

    expect(icon()).toBeNull();
  });
});
