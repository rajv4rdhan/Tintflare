/**
 * Excalidraw light -> dark equivalents, computed with Excalidraw's own
 * `applyDarkModeFilter` (invert 93% + hue-rotate 180deg).
 */
const DARK_COLORS: Record<string, string> = {
  '#1e1e1e': '#d3d3d3',
  '#000000': '#ededed',
  '#ffffff': '#121212',
  '#e03131': '#ff8383',
  '#ffc9c9': '#5a2c2c',
  '#2f9e44': '#39994b',
  '#b2f2bb': '#043b0c',
  '#1971c2': '#56a2e8',
  '#a5d8ff': '#154162',
  '#f08c00': '#b86200',
  '#ffec99': '#362600',
};

export function isDarkSvgRequest(url: URL, key: string): boolean {
  return url.searchParams.get('tm') === 'dark' && key.toLowerCase().endsWith('.svg');
}

export function applyDarkTheme(svg: string): string {
  return svg.replace(/#(?:[0-9a-f]{6}|[0-9a-f]{3})\b/gi, (color) => {
    const normalized = normalizeHex(color);
    return DARK_COLORS[normalized] ?? color;
  });
}

function normalizeHex(color: string): string {
  const hex = color.toLowerCase();
  const digits = hex.slice(1);

  if (digits.length === 3) {
    return `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`;
  }

  return hex;
}
