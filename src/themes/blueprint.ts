import type { ThemeCollection } from './types';

/**
 * Blueprint theme: a showcase palette for Excalidraw diagrams.
 *
 *   ?theme=blueprint&tm=light   Whiteprint: navy linework on pale drafting paper, with red-pencil corrections.
 *   ?theme=blueprint&tm=dark    Classic cyanotype: chalk-white lines on architect blue.
 *
 * Every override was checked against its background: text at 4.5:1 or more,
 * lines at 3:1 or more. Ratios are noted inline.
 */
export const blueprintTheme = {
  light: {
    // Whiteprint: navy linework on pale drafting paper, with red-pencil corrections.
    background: '#eef4fb', // whiteprint paper

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#0b2a55',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#0b2a55', // 12.8:1
        stroke: '#1f4f8f', // 7.4:1
      },

      // Excalidraw stroke colors.
      '#e03131': '#c2362f', // red, 4.9:1
      '#2f9e44': '#1f7a5c', // green, 4.7:1
      '#1971c2': '#1d5fbf', // blue, 5.5:1
      '#f08c00': {
        stroke: '#c06a12', // orange lines, 3.6:1
        text: '#9c4f00', // orange text, 5.4:1
      },

      // Excalidraw fill colors. Ink text on each is at least 11.0:1.
      '#ffc9c9': '#f7dfe0', // rose
      '#b2f2bb': '#d9efe8', // mint
      '#a5d8ff': '#d6e6fb', // sky
      '#ffec99': '#f2e2ad', // butter
    },
  },

  dark: {
    // Classic cyanotype: chalk-white lines on architect blue.
    background: '#123f78', // blueprint blue

    minContrast: { text: 4.5, stroke: 3, fill: 0 },

    colors: {
      // Text colors with no exact override become ink.
      text: '#f4f8ff',
    },

    overrides: {
      // Excalidraw's default ink, split by role.
      '#1e1e1e': {
        text: '#f4f8ff', // 9.8:1
        stroke: '#d6e6ff', // 8.3:1
      },

      // Excalidraw stroke colors.
      '#e03131': '#ffab9c', // red, 5.8:1
      '#2f9e44': '#9be8c9', // green, 7.4:1
      '#1971c2': '#a6dbff', // blue, 7.1:1
      '#f08c00': '#ffd38a', // orange, 7.4:1

      // Excalidraw fill colors. Ink text on each is at least 7.0:1.
      '#ffc9c9': '#3b3f7e', // rose
      '#b2f2bb': '#1d5a6e', // mint
      '#a5d8ff': '#1d5596', // sky
      '#ffec99': '#4c5476', // butter
    },
  },
} satisfies ThemeCollection;
