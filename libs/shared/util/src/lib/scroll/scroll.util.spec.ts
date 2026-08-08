import { scrollToElement, scrollToTop } from './scroll.util';

const stubReducedMotion = (matches: boolean): void => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches }) as unknown as typeof matchMedia,
  );
};

describe('scroll utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('scrollToTop', () => {
    it('should smoothly scroll the window to the top', () => {
      const scrollToSpy = vi
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => undefined);

      scrollToTop();

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    });

    it('should jump the window to the top when reduced motion is preferred', () => {
      stubReducedMotion(true);
      const scrollToSpy = vi
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => undefined);

      scrollToTop();

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'auto' });
    });
  });

  describe('scrollToElement', () => {
    it('should smoothly scroll a given element into view', () => {
      const element = document.createElement('div');
      const scrollIntoViewSpy = vi.fn();
      element.scrollIntoView = scrollIntoViewSpy;

      scrollToElement(element);

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    it('should jump a given element into view when reduced motion is preferred', () => {
      stubReducedMotion(true);
      const element = document.createElement('div');
      const scrollIntoViewSpy = vi.fn();
      element.scrollIntoView = scrollIntoViewSpy;

      scrollToElement(element);

      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        behavior: 'auto',
        block: 'start',
      });
    });
  });
});
