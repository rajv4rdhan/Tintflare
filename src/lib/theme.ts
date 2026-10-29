export type ColorRole = 'text' | 'stroke' | 'fill';
export type CvdType = 'deutan';

export interface ThemeDefinition {
  /** Exact page background color for this theme. */
  background: string;
  /** WCAG minimum contrast ratios against `background`. */
  minContrast: Record<ColorRole, number>;
}

/**
 * Theme storage: change these values to match the blog.
 *
 * `minContrast` follows WCAG: 4.5:1 for normal text, 3:1 for graphical
 * objects. Fills are not contrast-enforced.
 */
export const THEMES: Record<'light' | 'dark', ThemeDefinition> = {
  light: {
    background: '#ffffff',
    minContrast: { text: 4.5, stroke: 3, fill: 0 },
  },
  dark: {
    // Set this to the blog's exact dark background color.
    background: '#0f172a',
    minContrast: { text: 4.5, stroke: 3, fill: 0 },
  },
};

/**
 * CVD simulation matrices in linear sRGB (Viénot/Brettel).
 * Add protan/tritan variants here if needed.
 */
export const CVD_MATRICES: Record<CvdType, readonly (readonly number[])[]> = {
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
};
