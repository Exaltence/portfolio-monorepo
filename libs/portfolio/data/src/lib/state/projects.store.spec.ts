import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { Project } from '../models/project.model';
import { ProjectsStore } from './projects.store';

describe('ProjectsStore', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClientTesting()] });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should expose the projects after the JSON loads', async () => {
    const store = TestBed.inject(ProjectsStore);
    TestBed.tick();

    const projects: readonly Project[] = [
      {
        id: 'mes-mii-outdoor',
        title: 'MES-MII Outdoor',
        category: 'Web, Angular',
        thumbnailUrl: 'img/portfolio/coming_soon.png',
        images: ['img/portfolio/coming_soon.png'],
        descriptions: ['First paragraph.', 'Second paragraph.'],
      },
      {
        id: 'warmste-hackathon',
        title: 'Warmste Hackathon',
        category: 'Web, Angular',
        thumbnailUrl: 'img/portfolio/warmstehackathon-team.jpg',
        images: [
          'img/portfolio/warmstehackathon-team.jpg',
          'img/portfolio/warmstehackathon-admin-users.jpg',
        ],
        descriptions: ['First paragraph.', 'Second paragraph.'],
      },
      {
        id: 'matchman',
        title: 'MatchMan',
        category: 'Web, Angular',
        thumbnailUrl: 'img/portfolio/mm-dashboard.png',
        images: [
          'img/portfolio/mm-dashboard.png',
          'img/portfolio/mm-opportunities.png',
        ],
        descriptions: ['First paragraph.', 'Second paragraph.'],
      },
      {
        id: 'erp-demo',
        title: 'ERP Demo',
        category: 'Mobile, Angular',
        thumbnailUrl: 'img/portfolio/erp-demo-dashboard.jpg',
        images: [
          'img/portfolio/erp-demo-dashboard.jpg',
          'img/portfolio/erp-demo-order.jpg',
        ],
        descriptions: ['First paragraph.', 'Second paragraph.'],
      },
    ];
    httpMock.expectOne('content/projects.json').flush(projects);

    await expect.poll(() => store.projects.value()?.length).toBe(4);
    const warmste = store.projects.value()?.[1];
    expect(warmste?.images).toHaveLength(2);
    expect(warmste?.descriptions).toHaveLength(2);
  });

  it('should surface an error state on failure', async () => {
    const store = TestBed.inject(ProjectsStore);
    TestBed.tick();

    httpMock
      .expectOne('content/projects.json')
      .flush('nope', { status: 500, statusText: 'Server Error' });

    await expect.poll(() => store.projects.error() !== undefined).toBe(true);
  });
});
