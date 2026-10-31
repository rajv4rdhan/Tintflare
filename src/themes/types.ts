export type ColorRole = 'text' | 'stroke' | 'fill';
export type CvdType = 'deutan';
export type ThemeName = 'light' | 'dark';

export interface ThemeDefinition {
  /** Exact page background color for this theme. */
  background: string;
  /** WCAG minimum contrast ratios against `background`. */
  minContrast: Record<ColorRole, number>;
}
