import type { ThemeCollection } from './types';

/**
 * rvfolio theme.
 *
 * Used with:
 *   ?theme=rvfolio&tm=light
 *   ?theme=rvfolio&tm=dark
 *
 * Color resolution order for every source color:
 *   1. `overrides[sourceHex]` for the color's role
 *   2. `overrides[sourceHex]` as an all-role string
 *   3. `colors[role]`
 *   4. automatic OKLCH recoloring
 *
 * Use `null` in `overrides` to keep the original source color.
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

    colors: {
      // Every text color not covered by an exact override becomes this.
      text: '#1f2937',
    },

    overrides: {
      // Excalidraw's default black, split by role.
      '#1e1e1e': {
        text: '#1f2937',
        stroke: '#334155',
      },

      // Standard Excalidraw accent colors.
      '#e03131': '#b91c1c', // red
      '#2f9e44': '#15803d', // green
      '#1971c2': '#0f766e', // blue -> teal
      '#f08c00': '#b45309', // orange -> amber

      // Standard Excalidraw fill colors.
      '#ffc9c9': '#fee2e2', // red fill
      '#b2f2bb': '#dcfce7', // green fill
      '#a5d8ff': '#ccfbf1', // blue fill
      '#ffec99': '#fef3c7', // yellow fill

      // Example opt-out: keep this source color unchanged.
      // '#000000': null,
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

    colors: {
      // Every text color not covered by an exact override becomes this.
      text: '#e5e7eb',
    },

    overrides: {
      // Excalidraw's default black, split by role.
      '#1e1e1e': {
        text: '#e5e7eb',
        stroke: '#cbd5e1',
      },

      // Standard Excalidraw accent colors.
      '#e03131': '#f87171', // red
      '#2f9e44': '#4ade80', // green
      '#1971c2': '#5eead4', // blue -> teal
      '#f08c00': '#fbbf24', // orange -> amber

      // Standard Excalidraw fill colors.
      '#ffc9c9': '#7f1d1d', // red fill
      '#b2f2bb': '#14532d', // green fill
      '#a5d8ff': '#134e4a', // blue fill
      '#ffec99': '#78350f', // yellow fill

      // Example opt-out: keep this source color unchanged.
      // '#000000': null,
    },
  },
} satisfies ThemeCollection;
