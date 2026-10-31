import { luminanceOf, transformColor } from './color';
import {
  THEMES,
  isThemeName,
  type ColorRole,
  type CvdType,
  type ThemeMode,
  type ThemeName,
} from '../themes';

export interface SvgThemeOptions {
  theme: ThemeName;
  mode: ThemeMode;
  cvd?: CvdType;
}

export type SvgThemeSelection =
  | { status: 'none' }
  | { status: 'themed'; options: SvgThemeOptions }
  | { status: 'invalid'; message: string };

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
): SvgThemeSelection {
  if (!key.toLowerCase().endsWith('.svg')) return { status: 'none' };

  const requestedTheme = url.searchParams.get('theme')?.trim().toLowerCase();
  const requestedMode = url.searchParams.get('tm')?.trim().toLowerCase();
  const cvd =
    url.searchParams.get('cvd')?.trim().toLowerCase() === 'deutan'
      ? 'deutan'
      : undefined;

  if (!requestedTheme && !requestedMode && !cvd) {
    return { status: 'none' };
  }

  let theme: ThemeName = 'default';

  if (requestedTheme) {
    if (!isThemeName(requestedTheme)) {
      return {
        status: 'invalid',
        message: `Unknown theme: "${requestedTheme}".`,
      };
    }

    theme = requestedTheme;
  }

  let mode: ThemeMode = 'light';

  if (requestedMode) {
    if (requestedMode !== 'light' && requestedMode !== 'dark') {
      return {
        status: 'invalid',
        message: `Unknown theme mode: "${requestedMode}". Use light or dark.`,
      };
    }

    mode = requestedMode;
  }

  return { status: 'themed', options: { theme, mode, cvd } };
}

export function applySvgTheme(
  svg: string,
  options: SvgThemeOptions,
): SvgThemeResult {
  const theme = THEMES[options.theme][options.mode];
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
          dark: options.mode === 'dark',
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
