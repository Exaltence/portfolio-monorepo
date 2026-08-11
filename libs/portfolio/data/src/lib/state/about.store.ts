import { httpResource } from '@angular/common/http';
import { signalStore, withProps } from '@ngrx/signals';
import { resolveYearsOfExperience } from '@portfolio-monorepo/portfolio/util';
import { About } from '../models/about.model';

function parseAbout(raw: unknown): About {
  const about = raw as About;
  return { ...about, intro: resolveYearsOfExperience(about.intro) };
}

export const AboutStore = signalStore(
  { providedIn: 'root' },
  withProps(() => ({
    about: httpResource<About>(() => 'content/about.json', {
      parse: parseAbout,
    }),
  })),
);
