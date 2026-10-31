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

/** Returns the replacement for a color value, or `undefined` to leave it. */
type Recolor = (value: string, role: ColorRole) => string | undefined;

const TEXT_ELEMENTS = new Set(['text', 'tspan', 'textpath']);

/**
 * `property: value` paint declarations inside a `style` attribute or a CSS
 * rule body. Groups: leading boundary, property, separator, value, trailing
 * whitespace before `;`, `!important`, or the end. `background-color` covers
 * HTML labels inside `<foreignObject>`, as draw.io and Mermaid export them.
 */
const PAINT_DECLARATION =
  /(^|[\s;])(fill|stroke|color|background-color|stop-color|flood-color|lighting-color)(\s*:\s*)([^;!\s][^;!]*?)(\s*)(?=;|!|$)/gi;

/**
 * CSS rules without nested braces. Rules inside `@media` blocks still match,
 * because only the innermost `selector { body }` is captured.
 */
const CSS_RULE = /([^{}]*)\{([^{}]*)\}/g;

const TEXT_SELECTOR = /(?:^|[^\w-])(?:text|tspan|textpath)(?![\w-])/i;

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

/**
 * Streams an SVG through HTMLRewriter, recoloring paint in presentation
 * attributes, `style` attributes, and `<style>` sheets.
 *
 * `<mask>` and `<clipPath>` contents are left alone: mask colors encode
 * opacity by luminance (Excalidraw cuts arrow labels out with white and black
 * mask rects), so recoloring them would hide or invert the masked content.
 */
export function applySvgTheme(
  upstream: Response,
  options: SvgThemeOptions,
): Response {
  const recolor = createRecolor(options);
  let nonPaintDepth = 0;
  let stylesheet = '';

  return new HTMLRewriter()
    .on('mask, clipPath', {
      element(element) {
        try {
          element.onEndTag(() => {
            nonPaintDepth -= 1;
          });
          nonPaintDepth += 1;
        } catch {
          // A self-closing <mask/> has no end tag and no children to skip.
        }
      },
    })
    .on('*', {
      element(element) {
        if (nonPaintDepth === 0) recolorElement(element, recolor);
      },
    })
    .on('style', {
      text(chunk) {
        // Chunks can split a declaration, so recolor the whole sheet at once.
        stylesheet += chunk.text;

        if (!chunk.lastInTextNode) {
          chunk.remove();
          return;
        }

        chunk.replace(recolorStylesheet(stylesheet, recolor), { html: true });
        stylesheet = '';
      },
    })
    .transform(upstream);
}

/** One theme lookup per request; repeated colors are transformed once. */
function createRecolor(options: SvgThemeOptions): Recolor {
  const theme = THEMES[options.theme][options.mode];
  const backgroundLuminance = luminanceOf(theme.background);
  const transformed = new Map<string, string | undefined>();

  return (value, role) => {
    const cacheKey = `${role}:${value.toLowerCase()}`;

    if (!transformed.has(cacheKey)) {
      transformed.set(
        cacheKey,
        transformColor(value, {
          theme,
          role,
          dark: options.mode === 'dark',
          cvd: options.cvd,
          backgroundLuminance,
        }),
      );
    }

    return transformed.get(cacheKey);
  };
}

function recolorElement(element: Element, recolor: Recolor): void {
  const isText = TEXT_ELEMENTS.has(element.tagName.toLowerCase());

  // Copy first: setAttribute while iterating would disturb the iterator.
  for (const [name, value] of [...element.attributes]) {
    const attribute = name.toLowerCase();

    if (attribute === 'style') {
      const next = recolorDeclarations(value, isText, recolor);
      if (next !== value) element.setAttribute(name, next);
      continue;
    }

    const role = roleForProperty(attribute, isText);
    if (!role) continue;

    const next = recolor(value.trim(), role);
    if (next !== undefined && next !== value) element.setAttribute(name, next);
  }
}

function recolorStylesheet(css: string, recolor: Recolor): string {
  return css.replace(CSS_RULE, (rule, selector: string, body: string) => {
    const next = recolorDeclarations(body, TEXT_SELECTOR.test(selector), recolor);
    return next === body ? rule : `${selector}{${next}}`;
  });
}

function recolorDeclarations(
  declarations: string,
  isText: boolean,
  recolor: Recolor,
): string {
  return declarations.replace(
    PAINT_DECLARATION,
    (
      match,
      lead: string,
      property: string,
      separator: string,
      value: string,
      trailing: string,
    ) => {
      const role = roleForProperty(property, isText);
      const next = role ? recolor(value, role) : undefined;

      return next === undefined
        ? match
        : `${lead}${property}${separator}${next}${trailing}`;
    },
  );
}

function roleForProperty(
  property: string,
  isText: boolean,
): ColorRole | undefined {
  switch (property.toLowerCase()) {
    case 'stroke':
      return 'stroke';
    case 'color':
      return 'text';
    case 'fill':
      return isText ? 'text' : 'fill';
    case 'background-color':
    case 'stop-color':
    case 'flood-color':
    case 'lighting-color':
      return 'fill';
    default:
      return undefined;
  }
}
