import { darkTheme } from './dark';
import { lightTheme } from './light';
import { rvfolioTheme } from './rvfolio';
import type { ThemeCollection } from './types';

export { CVD_MATRICES } from './cvd';
export type {
  ColorOverrides,
  ColorReplacement,
  ColorRole,
  CvdType,
  ThemeCollection,
  ThemeDefinition,
  ThemeMode,
} from './types';

/**
 * Theme registry.
 *
 * To add a theme, create a file next to this one exporting a
 * `ThemeCollection`, then register it here. Its name becomes available as
 * the `?theme=` query value.
 */
export const THEMES = {
  default: {
    light: lightTheme,
    dark: darkTheme,
  },
  rvfolio: rvfolioTheme,
} satisfies Record<string, ThemeCollection>;

export type ThemeName = keyof typeof THEMES;

export function isThemeName(value: string): value is ThemeName {
  return Object.hasOwn(THEMES, value);
}
