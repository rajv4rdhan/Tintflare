import type { ThemeDefinition } from './types';

/**
 * Dark theme.
 *
 * Change `background` to the exact page color your site uses in dark mode.
 * For a dark blue background, use something like '#0b1220'.
 */
export const darkTheme = {
  background: '#0f172a',
  minContrast: {
    // WCAG AA for normal text.
    text: 4.5,
    // WCAG AA for graphical objects such as strokes.
    stroke: 3,
    // Illustrative fills are not contrast-enforced.
    fill: 0,
  },
} satisfies ThemeDefinition;
