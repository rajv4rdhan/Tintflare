export type ColorRole = 'text' | 'stroke' | 'fill';
export type CvdType = 'deutan';
export type ThemeMode = 'light' | 'dark';

export interface ThemeDefinition {
  /** Exact page background color for this theme. */
  background: string;
  /** WCAG minimum contrast ratios against `background`. */
  minContrast: Record<ColorRole, number>;
}

/** One theme family with independently customizable light and dark variants. */
export interface ThemeCollection {
  light: ThemeDefinition;
  dark: ThemeDefinition;
}
