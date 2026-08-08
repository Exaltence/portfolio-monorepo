import {
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  input,
} from '@angular/core';
import { IconName, IconRegistryService } from '@portfolio-monorepo/shared/data';

@Component({
  selector: 'app-icon',
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  host: {
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label()',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class IconComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly registry = inject(IconRegistryService);

  readonly name = input.required<IconName>();
  readonly label = input<string>();

  private readonly svg = computed(() => this.registry.get(this.name())());

  constructor() {
    effect(() => {
      const svg = this.svg();
      this.host.nativeElement.replaceChildren(
        ...(svg ? [svg.cloneNode(true)] : []),
      );
    });
  }
}
