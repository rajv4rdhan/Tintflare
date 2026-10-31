import type { ThemeCollection } from './types';

/**
 * Chalkboard theme: a showcase palette for Excalidraw diagrams.
 *
 *   ?theme=chalkboard&tm=light   Whiteboard: dry-erase markers and highlighter fills on a clean board.
 *   ?theme=chalkboard&tm=dark    Slate chalkboard: dusty chalk and pastel chalk sticks.
 *
 * Every override was checked against its background: text at 4.5:1 or more,
 * lines at 3:1 or more. Ratios are noted inline.
 */
export const chalkboardTheme = {
  light: {
    // Whiteboard: dry-erase markers and highlighter fills on a clean board.
    background: '#fbfbf8', // whiteboard

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#1c1c1c',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#1c1c1c', // 16.4:1
        stroke: '#2b2b2b', // 13.7:1
      },

      // Excalidraw stroke colors.
      '#e03131': '#d32f2f', // red, 4.8:1
      '#2f9e44': '#2e7d32', // green, 4.9:1
      '#1971c2': '#1565c0', // blue, 5.5:1
      '#f08c00': {
        stroke: '#e65100', // orange lines, 3.7:1
        text: '#b23c00', // orange text, 5.7:1
      },

      // Excalidraw fill colors. Ink text on each is at least 12.9:1.
      '#ffc9c9': '#ffd6e0', // rose
      '#b2f2bb': '#d2f5d8', // mint
      '#a5d8ff': '#d4ebff', // sky
      '#ffec99': '#fff3a6', // butter
    },
  },

  dark: {
    // Slate chalkboard: dusty chalk and pastel chalk sticks.
    background: '#263a33', // slate green

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#f3f0e6',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#f3f0e6', // 10.6:1
        stroke: '#e6e1d3', // 9.3:1
      },

      // Excalidraw stroke colors.
      '#e03131': '#ffa3a3', // red, 6.3:1
      '#2f9e44': '#c1f2b0', // green, 9.6:1
      '#1971c2': '#ade0ff', // blue, 8.6:1
      '#f08c00': '#ffcf87', // orange, 8.4:1

      // Excalidraw fill colors. Ink text on each is at least 6.6:1.
      '#ffc9c9': '#4b3c44', // rose
      '#b2f2bb': '#355440', // mint
      '#a5d8ff': '#2f4b59', // sky
      '#ffec99': '#58553a', // butter
    },
  },
} satisfies ThemeCollection;
