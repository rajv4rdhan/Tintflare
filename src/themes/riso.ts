import type { ThemeCollection } from './types';

/**
 * Riso theme: a showcase palette for Excalidraw diagrams.
 *
 *   ?theme=riso&tm=light   Risograph zine: federal blue and fluorescent pink on cream stock.
 *   ?theme=riso&tm=dark    Riso on black paper: fluorescent inks that pop off the page.
 *
 * Every override was checked against its background: text at 4.5:1 or more,
 * lines at 3:1 or more. Ratios are noted inline.
 */
export const risoTheme = {
  light: {
    // Risograph zine: federal blue and fluorescent pink on cream stock.
    background: '#f7f2e8', // cream stock

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#1b3a8c',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#1b3a8c', // 9.3:1
        stroke: '#1b3a8c', // 9.3:1
      },

      // Excalidraw stroke colors.
      '#e03131': {
        stroke: '#f0337f', // red lines, 3.4:1
        text: '#c4005e', // red text, 5.4:1
      },
      '#2f9e44': {
        stroke: '#00838a', // green lines, 4.1:1
        text: '#006a70', // green text, 5.7:1
      },
      '#1971c2': '#3255d1', // blue, 5.6:1
      '#f08c00': {
        stroke: '#e85a1c', // orange lines, 3.2:1
        text: '#b8410a', // orange text, 5.0:1
      },

      // Excalidraw fill colors. Ink text on each is at least 6.9:1.
      '#ffc9c9': '#ffc2dc', // rose
      '#b2f2bb': '#bfe8e3', // mint
      '#a5d8ff': '#c8d4ff', // sky
      '#ffec99': '#ffe066', // butter
    },
  },

  dark: {
    // Riso on black paper: fluorescent inks that pop off the page.
    background: '#151515', // black paper

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#fff4dc',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#fff4dc', // 16.7:1
        stroke: '#ffe9c2', // 15.4:1
      },

      // Excalidraw stroke colors.
      '#e03131': '#ff5fa2', // red, 6.4:1
      '#2f9e44': '#3fe0c5', // green, 11.0:1
      '#1971c2': '#8aa6ff', // blue, 7.8:1
      '#f08c00': '#ffb238', // orange, 10.2:1

      // Excalidraw fill colors. Ink text on each is at least 9.7:1.
      '#ffc9c9': '#4a1f33', // rose
      '#b2f2bb': '#103c37', // mint
      '#a5d8ff': '#1f2a55', // sky
      '#ffec99': '#4d3d0f', // butter
    },
  },
} satisfies ThemeCollection;
