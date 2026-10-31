import { blueprintTheme } from './blueprint';
import { chalkboardTheme } from './chalkboard';
import { darkTheme } from './dark';
import { lightTheme } from './light';
import { phosphorTheme } from './phosphor';
import { risoTheme } from './riso';
import { rvfolioTheme } from './rvfolio';
import { synthwaveTheme } from './synthwave';
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

  // Showcase themes: one Excalidraw export, five very different worlds.
  blueprint: blueprintTheme,
  chalkboard: chalkboardTheme,
  phosphor: phosphorTheme,
  riso: risoTheme,
  synthwave: synthwaveTheme,
} satisfies Record<string, ThemeCollection>;

export type ThemeName = keyof typeof THEMES;

export function isThemeName(value: string): value is ThemeName {
  return Object.hasOwn(THEMES, value);
}
