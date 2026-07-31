import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { Profile } from '../models/profile.model';
import { ProfileStore } from './profile.store';

describe('ProfileStore', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should expose the profile after the JSON loads', async () => {
    const store = TestBed.inject(ProfileStore);
    TestBed.tick();

    const profile: Profile = {
      greeting: 'Hi There! I am',
      name: 'Shaun Vercauteren',
      roles: ['Shaun Vercauteren', 'Web Developer', 'Front-end Engineer'],
      avatarUrl: 'img/img-profile.jpg',
      available: true,
      availabilityUrl: 'https://example.com',
      cvUrl: 'cv-shaun-vercauteren.pdf',
      social: [],
    };
    httpMock.expectOne('content/profile.json').flush(profile);

    await expect
      .poll(() => store.profile.value()?.name)
      .toBe('Shaun Vercauteren');
  });

  it('should surface an error state on failure', async () => {
    const store = TestBed.inject(ProfileStore);
    TestBed.tick();

    httpMock
      .expectOne('content/profile.json')
      .flush('nope', { status: 500, statusText: 'Server Error' });

    await expect.poll(() => store.hasError()).toBe(true);
  });
});
