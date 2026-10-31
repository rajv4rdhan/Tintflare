import type { ThemeCollection } from './types';

/**
 * Phosphor theme: a showcase palette for Excalidraw diagrams.
 *
 *   ?theme=phosphor&tm=light   Green-bar printout: dark green ink on continuous-feed paper.
 *   ?theme=phosphor&tm=dark    CRT terminal: glowing P1 phosphor green with amber warnings.
 *
 * Every override was checked against its background: text at 4.5:1 or more,
 * lines at 3:1 or more. Ratios are noted inline.
 */
export const phosphorTheme = {
  light: {
    // Green-bar printout: dark green ink on continuous-feed paper.
    background: '#f3f8ee', // green-bar paper

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#16351f',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#16351f', // 12.5:1
        stroke: '#2b5a36', // 7.4:1
      },

      // Excalidraw stroke colors.
      '#e03131': '#9a3412', // red, 6.8:1
      '#2f9e44': '#1e6b34', // green, 6.1:1
      '#1971c2': '#0f5e57', // blue, 7.1:1
      '#f08c00': '#8a5a00', // orange, 5.5:1

      // Excalidraw fill colors. Ink text on each is at least 10.6:1.
      '#ffc9c9': '#f6e1cf', // rose
      '#b2f2bb': '#d7ecd2', // mint
      '#a5d8ff': '#d4ebe5', // sky
      '#ffec99': '#efe9c4', // butter
    },
  },

  dark: {
    // CRT terminal: glowing P1 phosphor green with amber warnings.
    background: '#06100a', // CRT black

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#8dffa8',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#8dffa8', // 15.7:1
        stroke: '#3fd16b', // 9.7:1
      },

      // Excalidraw stroke colors.
      '#e03131': '#ffb000', // red, 10.6:1
      '#2f9e44': '#39ff6a', // green, 14.4:1
      '#1971c2': '#5ef0c4', // blue, 13.6:1
      '#f08c00': '#ffd166', // orange, 13.4:1

      // Excalidraw fill colors. Ink text on each is at least 12.4:1.
      '#ffc9c9': '#2a1d08', // rose
      '#b2f2bb': '#0d2b16', // mint
      '#a5d8ff': '#0b2723', // sky
      '#ffec99': '#2a2508', // butter
    },
  },
} satisfies ThemeCollection;
