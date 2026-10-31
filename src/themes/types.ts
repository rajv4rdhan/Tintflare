export type ColorRole = 'text' | 'stroke' | 'fill';
export type CvdType = 'deutan';
export type ThemeMode = 'light' | 'dark';

/**
 * A replacement color, or `null` to keep the original source color.
 * Strings are written to the SVG verbatim, so any valid CSS color works.
 */
export type ColorReplacement = string | null;

/** Exact source-color replacements, keyed by hex color. */
export type ColorOverrides = Record<
  string,
  ColorReplacement | Partial<Record<ColorRole, ColorReplacement>>
>;

export interface ThemeDefinition {
  /** Exact page background color for this theme. */
  background: string;
  /** WCAG minimum contrast ratios against `background`. */
  minContrast: Record<ColorRole, number>;
  /**
   * Optional role-wide replacements. Every source color in that role is
   * replaced unless an exact `overrides` entry matches first.
   */
  colors?: Partial<Record<ColorRole, ColorReplacement>>;
  /**
   * Optional exact source-color replacements, keyed by hex color. A string
   * applies to every role. An object applies per role; roles not listed fall
   * through to `colors` and then automatic recoloring.
   */
  overrides?: ColorOverrides;
}

/** One theme family with independently customizable light and dark variants. */
export interface ThemeCollection {
  light: ThemeDefinition;
  dark: ThemeDefinition;
}
