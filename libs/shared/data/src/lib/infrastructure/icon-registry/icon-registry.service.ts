import { httpResource } from '@angular/common/http';
import {
  Injector,
  Service,
  Signal,
  computed,
  inject,
  untracked,
} from '@angular/core';
import { IconName } from '../../models/icon/icon-name.model';

const ICON_DIRECTORY = 'img/icons';

@Service()
export class IconRegistryService {
  private readonly injector = inject(Injector);
  private readonly icons = new Map<IconName, Signal<SVGSVGElement | null>>();

  get(name: IconName): Signal<SVGSVGElement | null> {
    const cached = this.icons.get(name);

    if (cached) {
      return cached;
    }

    const icon = untracked(() => this.load(name));
    this.icons.set(name, icon);

    return icon;
  }

  private load(name: IconName): Signal<SVGSVGElement | null> {
    const svg = httpResource.text(() => `${ICON_DIRECTORY}/${name}.svg`, {
      injector: this.injector,
      parse: parseIcon,
      defaultValue: null,
    });

    return computed(() => (svg.hasValue() ? svg.value() : null));
  }
}

function parseIcon(markup: string): SVGSVGElement | null {
  const root = new DOMParser().parseFromString(
    markup,
    'image/svg+xml',
  ).documentElement;

  if (!(root instanceof SVGSVGElement)) {
    return null;
  }

  root.setAttribute('width', '100%');
  root.setAttribute('height', '100%');
  root.setAttribute('focusable', 'false');

  return root;
}
