import {
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';

const TYPE_SPEED_MS = 100;
const ERASE_SPEED_MS = 50;
const HOLD_MS = 1200;

@Directive({
  selector: '[appTypingTitle]',
  host: {
    '[textContent]': 'text()',
  },
})
export class TypingTitleDirective {
  readonly phrases = input.required<readonly string[]>({
    alias: 'appTypingTitle',
  });

  protected readonly text = signal('');

  private timer: ReturnType<typeof setTimeout> | undefined;
  private started = false;

  constructor() {
    const reducedMotion = matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    effect(() => {
      const phrases = this.phrases();
      if (this.started || phrases.length === 0) {
        return;
      }
      this.started = true;

      if (reducedMotion) {
        this.text.set(phrases[0]);
        return;
      }
      this.start(phrases);
    });

    inject(DestroyRef).onDestroy(() => {
      if (this.timer !== undefined) {
        clearTimeout(this.timer);
      }
    });
  }

  private start(phrases: readonly string[]): void {
    let phraseIndex = 0;
    let charIndex = 0;
    let erasing = false;

    const tick = (): void => {
      const phrase = phrases[phraseIndex];

      if (!erasing) {
        charIndex += 1;
        this.text.set(phrase.slice(0, charIndex));
        if (charIndex === phrase.length) {
          erasing = true;
          this.timer = setTimeout(tick, HOLD_MS);
          return;
        }
        this.timer = setTimeout(tick, TYPE_SPEED_MS);
        return;
      }

      charIndex -= 1;
      this.text.set(phrase.slice(0, charIndex));
      if (charIndex === 0) {
        erasing = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
      this.timer = setTimeout(tick, ERASE_SPEED_MS);
    };

    this.timer = setTimeout(tick, TYPE_SPEED_MS);
  }
}
