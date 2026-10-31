import type { ThemeDefinition } from './types';

/**
 * Light theme.
 *
 * Change `background` to the exact page color your site uses in light mode.
 * For a cream background, use something like '#faf6ee'.
 */
export const lightTheme = {
  background: '#ffffff',
  minContrast: {
    // WCAG AA for normal text.
    text: 4.5,
    // WCAG AA for graphical objects such as strokes.
    stroke: 3,
    // Illustrative fills are not contrast-enforced.
    fill: 0,
  },
} satisfies ThemeDefinition;
