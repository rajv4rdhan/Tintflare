import type { CvdType } from './types';

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
