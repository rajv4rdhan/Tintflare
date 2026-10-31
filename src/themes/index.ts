import { darkTheme } from './dark';
import { lightTheme } from './light';
import type { ThemeDefinition, ThemeName } from './types';

export { CVD_MATRICES } from './cvd';
export type { ColorRole, CvdType, ThemeDefinition, ThemeName } from './types';

/**
 * Theme registry.
 *
 * To add a theme, create a file next to this one, add its name to
 * `ThemeName`, and register it here.
 */
export const THEMES = {
  light: lightTheme,
  dark: darkTheme,
} satisfies Record<ThemeName, ThemeDefinition>;
