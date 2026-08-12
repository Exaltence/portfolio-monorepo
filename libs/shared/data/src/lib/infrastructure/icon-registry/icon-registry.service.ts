import { httpResource } from '@angular/common/http';
import { Service, Signal, computed } from '@angular/core';
import { IconName } from '../../models/icon/icon-name.model';

const SPRITE_URL = 'img/icons/sprite.svg';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

@Service()
export class IconRegistryService {
  private readonly sprite = httpResource.text(() => SPRITE_URL, {
    parse: parseSprite,
    defaultValue: null,
  });
  private readonly icons = new Map<IconName, Signal<SVGSVGElement | null>>();

  // Cached so repeated calls return the same signal instead of one that re-renders every cycle
  get(name: IconName): Signal<SVGSVGElement | null> {
    const cached = this.icons.get(name);

    if (cached) {
      return cached;
    }

    const icon = computed(() =>
      this.sprite.hasValue() ? (this.sprite.value()?.get(name) ?? null) : null,
    );
    this.icons.set(name, icon);

    return icon;
  }
}

function parseSprite(
  markup: string,
): ReadonlyMap<string, SVGSVGElement> | null {
  const root = new DOMParser().parseFromString(
    markup,
    'image/svg+xml',
  ).documentElement;

  if (!(root instanceof SVGSVGElement)) {
    return null;
  }

  const icons = new Map<string, SVGSVGElement>();

  for (const template of Array.from(root.querySelectorAll('symbol'))) {
    if (template.id) {
      icons.set(template.id, toStandaloneIcon(template));
    }
  }

  return icons;
}

function toStandaloneIcon(template: Element): SVGSVGElement {
  const svg = document.createElementNS(SVG_NAMESPACE, 'svg');

  for (const { name, value } of Array.from(template.attributes)) {
    if (name !== 'id') {
      svg.setAttribute(name, value);
    }
  }

  svg.replaceChildren(
    ...Array.from(template.childNodes, (node) => node.cloneNode(true)),
  );
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('focusable', 'false');

  return svg;
}
