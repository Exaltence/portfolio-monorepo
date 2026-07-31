export interface Project {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly thumbnailUrl: string;
  readonly images: readonly string[];
  readonly descriptions: readonly string[];
}
