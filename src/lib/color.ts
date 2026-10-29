import {
  CVD_MATRICES,
  type ColorRole,
  type CvdType,
  type ThemeDefinition,
} from './theme';

export type Rgb = readonly [number, number, number];

interface Oklch {
  l: number;
  c: number;
  h: number;
}

export interface ColorTransformOptions {
  theme: ThemeDefinition;
  role: ColorRole;
  dark: boolean;
  cvd?: CvdType;
  backgroundLuminance: number;
}

/**
 * Remaps one sRGB hex color through OKLCH.
 *
 * The pipeline optionally applies a CVD matrix in linear RGB, converts to
 * OKLCH, flips lightness for the dark theme, enforces contrast against the
 * theme background, and gamut-maps the result back to sRGB.
 */
export function transformColor(
  hex: string,
  options: ColorTransformOptions,
): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  // A white fill should become the exact page background, not a near-black
  // approximation of it.
  if (options.role === 'fill' && isWhite(rgb)) {
    return options.theme.background;
  }

  let linear = srgbToLinear(rgb);

  if (options.cvd) {
    linear = applyMatrix(CVD_MATRICES[options.cvd], linear);
  }

  const { l, c, h } = linearRgbToOklch(linear);
  const flipped = options.dark ? 1 - l : l;
  const lightness = enforceContrast(
    flipped,
    c,
    h,
    options.theme.minContrast[options.role],
    options.backgroundLuminance,
  );

  return rgbToHex(oklchToSrgb(lightness, c, h));
}

export function luminanceOf(hex: string): number {
  const rgb = hexToRgb(hex);
  return rgb ? relativeLuminance(srgbToLinear(rgb)) : 0;
}

function enforceContrast(
  lightness: number,
  chroma: number,
  hue: number,
  minimum: number,
  backgroundLuminance: number,
): number {
  if (minimum <= 1) return lightness;

  // Small safety margin so 8-bit sRGB rounding cannot drop below the target.
  const target = minimum + 0.05;

  const current = contrastRatio(
    relativeLuminance(srgbToLinear(oklchToSrgb(lightness, chroma, hue))),
    backgroundLuminance,
  );

  if (current >= target) return lightness;

  const goLighter = backgroundLuminance < 0.5;
  let low = goLighter ? lightness : 0;
  let high = goLighter ? 1 : lightness;

  for (let i = 0; i < 20; i += 1) {
    const mid = (low + high) / 2;
    const candidate = oklchToSrgb(mid, chroma, hue);
    const ratio = contrastRatio(
      relativeLuminance(srgbToLinear(candidate)),
      backgroundLuminance,
    );

    if (ratio >= target) {
      if (goLighter) high = mid;
      else low = mid;
    } else if (goLighter) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return goLighter ? high : low;
}

function hexToRgb(hex: string): Rgb | undefined {
  const value = hex.replace(/^#/, '');

  if (!/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    return undefined;
  }

  const expanded =
    value.length === 3
      ? value
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : value;

  return [
    Number.parseInt(expanded.slice(0, 2), 16) / 255,
    Number.parseInt(expanded.slice(2, 4), 16) / 255,
    Number.parseInt(expanded.slice(4, 6), 16) / 255,
  ];
}

function rgbToHex([r, g, b]: Rgb): string {
  return (
    '#' +
    [r, g, b]
      .map((channel) =>
        Math.round(clamp01(channel) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  );
}

function srgbToLinear([r, g, b]: Rgb): Rgb {
  return [toLinear(r), toLinear(g), toLinear(b)];
}

function toLinear(channel: number): number {
  return channel <= 0.04045
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function linearToSrgb([r, g, b]: Rgb): Rgb {
  return [toSrgb(r), toSrgb(g), toSrgb(b)];
}

function toSrgb(channel: number): number {
  const value =
    channel <= 0.0031308
      ? 12.92 * channel
      : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;

  return clamp01(value);
}

function linearRgbToOklch([r, g, b]: Rgb): Oklch {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const lRoot = Math.cbrt(l);
  const mRoot = Math.cbrt(m);
  const sRoot = Math.cbrt(s);

  const lightness =
    0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot;
  const a =
    1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot;
  const bAxis =
    0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot;

  const chroma = Math.sqrt(a * a + bAxis * bAxis);
  const hue = (Math.atan2(bAxis, a) * 180) / Math.PI;

  return { l: lightness, c: chroma, h: hue < 0 ? hue + 360 : hue };
}

function oklchToLinearRgb(lightness: number, chroma: number, hue: number): Rgb {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);

  const lRoot = lightness + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = lightness - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = lightness - 0.0894841775 * a - 1.291485548 * b;

  const l = lRoot * lRoot * lRoot;
  const m = mRoot * mRoot * mRoot;
  const s = sRoot * sRoot * sRoot;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/**
 * Converts OKLCH back to sRGB, reducing chroma until the color fits the sRGB
 * gamut. Lightness and hue are preserved.
 */
function oklchToSrgb(lightness: number, chroma: number, hue: number): Rgb {
  const l = clamp01(lightness);
  const c = Math.max(0, chroma);
  let linear = oklchToLinearRgb(l, c, hue);

  if (!inGamut(linear)) {
    let low = 0;
    let high = c;

    for (let i = 0; i < 20; i += 1) {
      const mid = (low + high) / 2;

      if (inGamut(oklchToLinearRgb(l, mid, hue))) {
        low = mid;
      } else {
        high = mid;
      }
    }

    linear = oklchToLinearRgb(l, low, hue);
  }

  return linearToSrgb(linear);
}

function inGamut([r, g, b]: Rgb): boolean {
  const epsilon = 1e-6;
  return [r, g, b].every(
    (channel) => channel >= -epsilon && channel <= 1 + epsilon,
  );
}

function applyMatrix(
  matrix: readonly (readonly number[])[],
  [r, g, b]: Rgb,
): Rgb {
  return [
    clamp01(matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b),
    clamp01(matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b),
    clamp01(matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b),
  ];
}

function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a: number, b: number): number {
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function isWhite([r, g, b]: Rgb): boolean {
  return r === 1 && g === 1 && b === 1;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
