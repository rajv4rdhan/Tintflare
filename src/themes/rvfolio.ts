import type { ThemeCollection } from './types';

/**
 * rvfolio theme.
 *
 * Used with:
 *   ?theme=rvfolio&tm=light
 *   ?theme=rvfolio&tm=dark
 */
export const rvfolioTheme = {
  light: {
    // Set this to the portfolio's exact light-mode page color.
    background: '#faf6ee', // cream

    minContrast: {
      // WCAG AA for normal text.
      text: 4.5,
      // WCAG AA for graphical objects such as strokes.
      stroke: 3,
      // Illustrative fills are not contrast-enforced.
      fill: 0,
    },
  },

  dark: {
    // Set this to the portfolio's exact dark-mode page color.
    background: '#0b1220', // dark blue

    minContrast: {
      // WCAG AA for normal text.
      text: 4.5,
      // WCAG AA for graphical objects such as strokes.
      stroke: 3,
      // Illustrative fills are not contrast-enforced.
      fill: 0,
    },
  },
} satisfies ThemeCollection;
