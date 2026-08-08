import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { About } from '../models/about.model';
import { AboutStore } from './about.store';

describe('AboutStore', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should expose the about content after the JSON loads', async () => {
    const store = TestBed.inject(AboutStore);
    TestBed.tick();

    const about: About = {
      subtitle: 'Introduction',
      title: 'About Me',
      intro: 'Hello there.',
      skills: [
        { name: 'Angular', icon: 'mdi--angular' },
        { name: 'TypeScript', icon: 'mdi--language-typescript' },
      ],
      experience: [
        {
          organization: 'Renson',
          period: '2019 — Today',
          title: 'Angular Web Developer',
          description: 'MES application.',
        },
      ],
      education: [
        {
          organization: 'Vives',
          period: '2014 — 2018',
          title: "Associate's degree",
          description: 'Computer science programming',
        },
      ],
      certificates: [
        {
          organization: 'Oracle',
          period: 'January 2019',
          title: 'OCA',
          description: 'Java 8 features.',
        },
      ],
    };
    httpMock.expectOne('content/about.json').flush(about);

    await expect.poll(() => store.about.value()?.intro).toBe('Hello there.');
    expect(store.about.value()?.skills).toHaveLength(2);
    expect(store.about.value()?.experience).toHaveLength(1);
    expect(store.about.value()?.education).toHaveLength(1);
    expect(store.about.value()?.certificates).toHaveLength(1);
  });

  it('should surface an error state on failure', async () => {
    const store = TestBed.inject(AboutStore);
    TestBed.tick();

    httpMock
      .expectOne('content/about.json')
      .flush('nope', { status: 500, statusText: 'Server Error' });

    await expect.poll(() => store.hasError()).toBe(true);
  });
});
