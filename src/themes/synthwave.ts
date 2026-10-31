import type { ThemeCollection } from './types';

/**
 * Synthwave theme: a showcase palette for Excalidraw diagrams.
 *
 *   ?theme=synthwave&tm=light   Vaporwave pastel: grape ink on cotton-candy pink.
 *   ?theme=synthwave&tm=dark    Neon night drive: hot pink and laser cyan on deep purple.
 *
 * Every override was checked against its background: text at 4.5:1 or more,
 * lines at 3:1 or more. Ratios are noted inline.
 */
export const synthwaveTheme = {
  light: {
    // Vaporwave pastel: grape ink on cotton-candy pink.
    background: '#fff1f8', // cotton candy

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#3a1460',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#3a1460', // 13.2:1
        stroke: '#5b2a86', // 9.1:1
      },

      // Excalidraw stroke colors.
      '#e03131': '#c2187a', // red, 5.2:1
      '#2f9e44': '#0f7a64', // green, 4.8:1
      '#1971c2': '#1f5fd1', // blue, 5.3:1
      '#f08c00': {
        stroke: '#c26100', // orange lines, 3.8:1
        text: '#9e4f00', // orange text, 5.4:1
      },

      // Excalidraw fill colors. Ink text on each is at least 10.7:1.
      '#ffc9c9': '#ffd1ea', // rose
      '#b2f2bb': '#c9f5e8', // mint
      '#a5d8ff': '#d6e2ff', // sky
      '#ffec99': '#ffe9b8', // butter
    },
  },

  dark: {
    // Neon night drive: hot pink and laser cyan on deep purple.
    background: '#1b0f33', // midnight purple

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#fdf0ff',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#fdf0ff', // 16.4:1
        stroke: '#f2c6ff', // 12.3:1
      },

      // Excalidraw stroke colors.
      '#e03131': '#ff4fd8', // red, 6.3:1
      '#2f9e44': '#3dffb5', // green, 13.9:1
      '#1971c2': '#38e1ff', // blue, 11.5:1
      '#f08c00': '#ffb347', // orange, 10.1:1

      // Excalidraw fill colors. Ink text on each is at least 11.2:1.
      '#ffc9c9': '#43175a', // rose
      '#b2f2bb': '#0f3a40', // mint
      '#a5d8ff': '#17275e', // sky
      '#ffec99': '#4a2c22', // butter
    },
  },
} satisfies ThemeCollection;
