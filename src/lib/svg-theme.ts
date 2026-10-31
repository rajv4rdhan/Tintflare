import { luminanceOf, transformColor } from './color';
import { THEMES, type ColorRole, type CvdType } from '../themes';

export interface SvgThemeOptions {
  dark: boolean;
  cvd?: CvdType;
}

export interface SvgThemeResult {
  svg: string;
  parseMs: number;
  transformMs: number;
}

interface ColorOccurrence {
  hex: string;
  role: ColorRole;
}

const TEXT_ELEMENTS = new Set(['text', 'tspan', 'textpath']);

export function getSvgThemeOptions(
  url: URL,
  key: string,
): SvgThemeOptions | undefined {
  if (!key.toLowerCase().endsWith('.svg')) return undefined;

  const requestedTheme = url.searchParams.get('tm')?.toLowerCase();
  const hasTheme = requestedTheme === 'light' || requestedTheme === 'dark';
  const dark = requestedTheme === 'dark';
  const cvd =
    url.searchParams.get('cvd')?.toLowerCase() === 'deutan'
      ? 'deutan'
      : undefined;

  if (!hasTheme && !cvd) return undefined;

  return { dark, cvd };
}

export function applySvgTheme(
  svg: string,
  options: SvgThemeOptions,
): SvgThemeResult {
  const theme = options.dark ? THEMES.dark : THEMES.light;
  const backgroundLuminance = luminanceOf(theme.background);
  const colors: ColorOccurrence[] = [];

  const parseStart = performance.now();
  const parsed = svg.replace(/<[^>]*>/g, (tag) =>
    transformTag(tag, (hex, role) => {
      const token = `\u0000${colors.length}\u0000`;
      colors.push({ hex, role });
      return token;
    }),
  );
  const parseMs = performance.now() - parseStart;

  const transformStart = performance.now();
  const transformed = new Map<string, string>();

  for (const { hex, role } of colors) {
    const cacheKey = `${role}:${hex.toLowerCase()}`;

    if (!transformed.has(cacheKey)) {
      transformed.set(
        cacheKey,
        transformColor(hex, {
          theme,
          role,
          dark: options.dark,
          cvd: options.cvd,
          backgroundLuminance,
        }),
      );
    }
  }

  const themed = parsed.replace(/\u0000(\d+)\u0000/g, (_, index: string) => {
    const occurrence = colors[Number(index)];
    const cacheKey = `${occurrence.role}:${occurrence.hex.toLowerCase()}`;

    return transformed.get(cacheKey)!;
  });
  const transformMs = performance.now() - transformStart;

  return { svg: themed, parseMs, transformMs };
}

type TransformColor = (hex: string, role: ColorRole) => string;

function transformTag(tag: string, transform: TransformColor): string {
  const name = /^<\s*([a-zA-Z][\w:-]*)/.exec(tag)?.[1];
  const isText = name ? TEXT_ELEMENTS.has(name.toLowerCase()) : false;

  let result = tag.replace(
    /\b(fill|stroke|color|stop-color|flood-color|lighting-color)\s*=\s*(["'])(#[0-9a-f]{3,6})\2/gi,
    (match, attribute: string, quote: string, hex: string) => {
      const role = roleForAttribute(attribute, isText);

      return role
        ? `${attribute}=${quote}${transform(hex, role)}${quote}`
        : match;
    },
  );

  result = result.replace(
    /\bstyle\s*=\s*(["'])([\s\S]*?)\1/gi,
    (match, quote: string, style: string) => {
      const next = style.replace(
        /\b(fill|stroke|color|stop-color|flood-color|lighting-color)\s*:\s*(#[0-9a-f]{3,6})\b/gi,
        (declaration: string, property: string, hex: string) => {
          const role = roleForAttribute(property, isText);
          return role ? `${property}:${transform(hex, role)}` : declaration;
        },
      );

      return next === style ? match : `style=${quote}${next}${quote}`;
    },
  );

  return result;
}

function roleForAttribute(
  attribute: string,
  isText: boolean,
): ColorRole | undefined {
  switch (attribute.toLowerCase()) {
    case 'stroke':
      return 'stroke';
    case 'color':
      return 'text';
    case 'fill':
      return isText ? 'text' : 'fill';
    case 'stop-color':
    case 'flood-color':
    case 'lighting-color':
      return 'fill';
    default:
      return undefined;
  }
}
