import type { ThemeCollection } from './types';

/**
 * rvfolio theme.
 *
 * Used with:
 *   ?theme=rvfolio&tm=light
 *   ?theme=rvfolio&tm=dark
 *
 * Matches the blog's paper-and-ink tokens (`src/app/globals.css`): ink for
 * text and lines, the rust accent for red, and the callout colors for the
 * other Excalidraw accents. Fills are the accent mixed into the page color
 * in OKLab (14% light, 20% dark).
 *
 * Color resolution order for every source color:
 *   1. `overrides[sourceHex]` for the color's role
 *   2. `overrides[sourceHex]` as an all-role string
 *   3. `colors[role]`
 *   4. automatic OKLCH recoloring
 *
 * Overrides are written verbatim and skip contrast enforcement, so every
 * value below was checked against the background. Ratios are noted inline.
 *
 * Use `null` in `overrides` to keep the original source color.
 */
export const rvfolioTheme = {
  light: {
    background: '#f7f3ec', // --paper

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
      text: '#1b1815', // --ink
    },

    overrides: {
      // Excalidraw's default black, split by role.
      '#1e1e1e': {
        text: '#1b1815', // --ink, 16.0:1
        stroke: '#3f3934', // --ink-2, 10.3:1
      },

      // Standard Excalidraw accent colors.
      '#e03131': '#b23a16', // red -> --accent, 5.4:1
      '#2f9e44': '#2f7d4f', // green -> callout tip, 4.6:1
      '#1971c2': '#3b5b8c', // blue -> callout note, 6.2:1
      '#f08c00': {
        stroke: '#b7791f', // orange -> callout warning, 3.3:1
        text: '#8a5a12', // darker so text passes AA, 5.4:1
      },

      // Standard Excalidraw fill colors. Ink text on each is above 12:1.
      '#ffc9c9': '#f0dace', // red fill
      '#b2f2bb': '#dbe2d5', // green fill
      '#a5d8ff': '#dbdddf', // blue fill
      '#ffec99': '#efe2d1', // yellow fill

      // Example opt-out: keep this source color unchanged.
      // '#000000': null,
    },
  },

  dark: {
    background: '#181716', // .dark --paper

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
      text: '#f1ece4', // --ink
    },

    overrides: {
      // Excalidraw's default black, split by role.
      '#1e1e1e': {
        text: '#f1ece4', // --ink, 16.0:1
        stroke: '#d3ccc2', // --ink-2, 11.8:1
      },

      // Standard Excalidraw accent colors.
      '#e03131': '#f0642d', // red -> --accent, 5.9:1
      '#2f9e44': '#6fcf97', // green -> callout tip, 9.9:1
      '#1971c2': '#8fb3ff', // blue -> callout note, 9.0:1
      '#f08c00': '#f2c14e', // orange -> callout warning, 11.2:1

      // Standard Excalidraw fill colors. Ink text on each is above 11:1.
      '#ffc9c9': '#392219', // red fill
      '#b2f2bb': '#243127', // green fill
      '#a5d8ff': '#282d38', // blue fill
      '#ffec99': '#372f1e', // yellow fill

      // Example opt-out: keep this source color unchanged.
      // '#000000': null,
    },
  },
} satisfies ThemeCollection;
