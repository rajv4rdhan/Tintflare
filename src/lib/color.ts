import {
  CVD_MATRICES,
  type ColorReplacement,
  type ColorRole,
  type CvdType,
  type ThemeDefinition,
} from '../themes';
import { NAMED_COLORS } from './named-colors';

export type Rgb = readonly [number, number, number];

interface ParsedColor {
  rgb: Rgb;
  /** 0 to 1. */
  alpha: number;
}

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
 * Remaps one CSS color (hex, `rgb()`, `hsl()`, or a named color) through
 * OKLCH. Returns `undefined` for values that are not a fixed color, such as
 * `none`, `currentColor`, or `url(#gradient)`, so the caller leaves them.
 *
 * A theme can replace the color exactly through `overrides` or `colors`.
 * Otherwise the pipeline applies the CVD matrix (when requested), converts
 * to OKLCH, flips lightness for the dark theme, enforces contrast against the
 * theme background, and gamut-maps the result back to sRGB. Source alpha is
 * kept in every case.
 */
export function transformColor(
  value: string,
  options: ColorTransformOptions,
): string | undefined {
  const color = parseColor(value);
  if (!color) return undefined;

  const { rgb, alpha } = color;
  const replacement = resolveColorReplacement(
    rgbToHex(rgb),
    options.role,
    options.theme,
  );

  // `null` means keep the original color; a string is used as written, with
  // the source alpha applied when the string is a color this file can read.
  if (replacement !== undefined) {
    return replacement === null ? undefined : withAlpha(replacement, alpha);
  }

  // A white fill should become the exact page background, not a near-black
  // approximation of it.
  if (options.role === 'fill' && isWhite(rgb)) {
    return withAlpha(options.theme.background, alpha);
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

  return formatColor(oklchToSrgb(lightness, c, h), alpha);
}

export function luminanceOf(value: string): number {
  const color = parseColor(value);
  return color ? relativeLuminance(srgbToLinear(color.rgb)) : 0;
}

/**
 * Resolves an explicit theme replacement.
 *
 * Precedence:
 * 1. `overrides[sourceHex]` for the color's role
 * 2. `overrides[sourceHex]` as an all-role string
 * 3. `colors[role]`
 * 4. `undefined`, which lets automatic recoloring run
 */
function resolveColorReplacement(
  hex: string,
  role: ColorRole,
  theme: ThemeDefinition,
): ColorReplacement | undefined {
  if (theme.overrides) {
    for (const [source, replacement] of Object.entries(theme.overrides)) {
      const sourceColor = parseColor(source);
      if (!sourceColor || rgbToHex(sourceColor.rgb) !== hex) continue;

      if (replacement === null || typeof replacement === 'string') {
        return replacement;
      }

      if (Object.hasOwn(replacement, role)) {
        return replacement[role];
      }

      break;
    }
  }

  if (theme.colors && Object.hasOwn(theme.colors, role)) {
    return theme.colors[role];
  }

  return undefined;
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

/**
 * Parses hex (3, 4, 6, or 8 digits), `rgb()`/`rgba()`, `hsl()`/`hsla()` in
 * comma or space syntax, and CSS named colors. `light-dark(a, b)` reads as
 * `a`, the color as drawn: the theme decides what dark mode looks like.
 */
function parseColor(value: string): ParsedColor | undefined {
  const color = value.trim().toLowerCase();

  const lightDark = /^light-dark\((.*)\)$/.exec(color);
  if (lightDark) {
    const first = splitTopLevel(lightDark[1])[0];
    return first ? parseColor(first) : undefined;
  }

  if (color.startsWith('#')) return parseHex(color.slice(1));

  const named = NAMED_COLORS[color];
  if (named) return parseHex(named);

  const fn = /^(rgba?|hsla?)\(([^()]*)\)$/.exec(color);
  if (!fn) return undefined;

  // Accepts `r, g, b, a` and `r g b / a`.
  const args = fn[2].split(/\s*[,/]\s*|\s+/).filter(Boolean);
  if (args.length !== 3 && args.length !== 4) return undefined;

  const alpha = args.length === 4 ? parseAlpha(args[3]) : 1;
  if (alpha === undefined) return undefined;

  if (fn[1].startsWith('rgb')) {
    const rgb = args.slice(0, 3).map(parseRgbChannel);
    return rgb.every((channel) => channel !== undefined)
      ? { rgb: rgb as unknown as Rgb, alpha }
      : undefined;
  }

  const hue = parseHue(args[0]);
  const saturation = parsePercentage(args[1]);
  const lightness = parsePercentage(args[2]);

  if (hue === undefined || saturation === undefined || lightness === undefined) {
    return undefined;
  }

  return { rgb: hslToRgb(hue, saturation, lightness), alpha };
}

/** Splits on commas that aren't inside parentheses: `rgb(1, 2, 3), #fff`. */
function splitTopLevel(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < list.length; i += 1) {
    if (list[i] === '(') depth += 1;
    else if (list[i] === ')') depth -= 1;
    else if (list[i] === ',' && depth === 0) {
      parts.push(list.slice(start, i).trim());
      start = i + 1;
    }
  }

  parts.push(list.slice(start).trim());
  return parts;
}

function parseHex(digits: string): ParsedColor | undefined {
  if (!/^(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(digits)) {
    return undefined;
  }

  const expanded =
    digits.length <= 4
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits;
  const channel = (index: number) =>
    Number.parseInt(expanded.slice(index, index + 2), 16) / 255;

  return {
    rgb: [channel(0), channel(2), channel(4)],
    alpha: expanded.length === 8 ? channel(6) : 1,
  };
}

function parseNumber(token: string): number | undefined {
  return /^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/.test(token)
    ? Number(token)
    : undefined;
}

/** `50%` or a bare number (CSS Color 4), as 0 to 1. */
function parsePercentage(token: string): number | undefined {
  const number = parseNumber(token.replace(/%$/, ''));
  return number === undefined ? undefined : clamp01(number / 100);
}

/** `0` to `255`, or a percentage, as 0 to 1. */
function parseRgbChannel(token: string): number | undefined {
  if (token.endsWith('%')) return parsePercentage(token);

  const number = parseNumber(token);
  return number === undefined ? undefined : clamp01(number / 255);
}

/** `0.5` or `50%`, as 0 to 1. */
function parseAlpha(token: string): number | undefined {
  if (token.endsWith('%')) return parsePercentage(token);

  const number = parseNumber(token);
  return number === undefined ? undefined : clamp01(number);
}

/** Degrees by default; `deg`, `grad`, `rad`, and `turn` units are accepted. */
function parseHue(token: string): number | undefined {
  const match = /^(.*?)(deg|grad|rad|turn)?$/.exec(token);
  const number = match ? parseNumber(match[1]) : undefined;
  if (number === undefined) return undefined;

  switch (match?.[2]) {
    case 'grad':
      return number * 0.9;
    case 'rad':
      return (number * 180) / Math.PI;
    case 'turn':
      return number * 360;
    default:
      return number;
  }
}

function hslToRgb(hue: number, saturation: number, lightness: number): Rgb {
  const h = (((hue % 360) + 360) % 360) / 30;
  const a = saturation * Math.min(lightness, 1 - lightness);
  const channel = (n: number) => {
    const k = (n + h) % 12;
    return lightness - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };

  return [channel(0), channel(8), channel(4)];
}

/** `#rrggbb`, or `#rrggbbaa` when the color is translucent. */
function formatColor(rgb: Rgb, alpha: number): string {
  if (alpha >= 1) return rgbToHex(rgb);

  return (
    rgbToHex(rgb) +
    Math.round(clamp01(alpha) * 255)
      .toString(16)
      .padStart(2, '0')
  );
}

/** Applies source alpha to a replacement color; unreadable strings pass through. */
function withAlpha(replacement: string, alpha: number): string {
  if (alpha >= 1) return replacement;

  const color = parseColor(replacement);
  return color ? formatColor(color.rgb, color.alpha * alpha) : replacement;
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
