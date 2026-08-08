import { scrollToElement, scrollToTop } from './scroll.util';

describe('scroll utilities', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('scrollToTop', () => {
    it('should smoothly scroll the window to the top', () => {
      const scrollToSpy = vi
        .spyOn(window, 'scrollTo')
        .mockImplementation(() => undefined);

      scrollToTop();

      expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
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
  });
});
