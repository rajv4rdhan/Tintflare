import { luminanceOf, transformColor } from './color';
import { THEMES, type ColorRole, type CvdType } from './theme';

export interface SvgThemeOptions {
  dark: boolean;
  cvd?: CvdType;
}

const TEXT_ELEMENTS = new Set(['text', 'tspan', 'textpath']);

export function getSvgThemeOptions(
  url: URL,
  key: string,
): SvgThemeOptions | undefined {
  if (!key.toLowerCase().endsWith('.svg')) return undefined;

  const dark = url.searchParams.get('tm') === 'dark';
  const cvd =
    url.searchParams.get('cvd')?.toLowerCase() === 'deutan'
      ? 'deutan'
      : undefined;

  if (!dark && !cvd) return undefined;

  return { dark, cvd };
}

export function applySvgTheme(
  svg: string,
  options: SvgThemeOptions,
): string {
  const theme = options.dark ? THEMES.dark : THEMES.light;
  const backgroundLuminance = luminanceOf(theme.background);
  const transformed = new Map<string, string>();

  const transform = (hex: string, role: ColorRole): string => {
    const cacheKey = `${role}:${hex.toLowerCase()}`;
    const cached = transformed.get(cacheKey);
    if (cached) return cached;

    const color = transformColor(hex, {
      theme,
      role,
      dark: options.dark,
      cvd: options.cvd,
      backgroundLuminance,
    });

    transformed.set(cacheKey, color);
    return color;
  };

  return svg.replace(/<[^>]*>/g, (tag) => transformTag(tag, transform));
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
