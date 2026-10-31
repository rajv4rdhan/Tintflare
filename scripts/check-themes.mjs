#!/usr/bin/env node
/**
 * Fails when a theme's hand-picked colors are too faint to read.
 *
 * Overrides and `colors` are written to the SVG as-is and skip the worker's
 * own contrast enforcement, so this is what checks them. Each replacement is
 * measured against its mode's `background`, using that mode's `minContrast`:
 *
 * - a per-role override (`{ text, stroke, fill }`) is checked for each role
 * - a `colors[role]` entry is checked for that role
 * - an all-role string is checked as text, because it may color text, unless
 *   its source is a pale fill color (like Excalidraw's #ffc9c9), which needs
 *   no contrast
 *
 * Usage: npm run check:themes   (compiles src/themes to .cache/ first)
 */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { THEMES } = require('../.cache/themes/index.js');

/** Source colors lighter than this are fills, not ink. */
const PALE_LUMINANCE = 0.5;

function luminance(hex) {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex.trim());
  if (!match) return undefined;
  const digits = match[1].length === 3 ? [...match[1]].map((d) => d + d).join('') : match[1];
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = Number.parseInt(digits.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const failures = [];
const skipped = [];
let checked = 0;

function check(where, source, role, value, background, minimum) {
  if (value === null || minimum <= 1) return;
  if (luminance(value) === undefined) {
    skipped.push(`${where}  ${source} ${role}: '${value}' is not a hex color, not checked`);
    return;
  }
  checked += 1;
  const ratio = contrast(value, background);
  if (ratio < minimum) {
    failures.push(`${where}  ${source} ${role} → ${value}  ${ratio.toFixed(2)}:1, needs ${minimum}:1`);
  }
}

for (const [name, collection] of Object.entries(THEMES)) {
  for (const [mode, theme] of Object.entries(collection)) {
    const where = `${name}/${mode}`.padEnd(18);
    const { background, minContrast } = theme;

    for (const [role, value] of Object.entries(theme.colors ?? {})) {
      check(where, 'colors', role, value, background, minContrast[role]);
    }

    for (const [source, replacement] of Object.entries(theme.overrides ?? {})) {
      if (replacement === null) continue;
      if (typeof replacement === 'string') {
        const pale = (luminance(source) ?? 0) > PALE_LUMINANCE;
        if (!pale) check(where, source, 'text', replacement, background, minContrast.text);
        continue;
      }
      for (const [role, value] of Object.entries(replacement)) {
        check(where, source, role, value, background, minContrast[role]);
      }
    }
  }
}

for (const line of skipped) console.warn(`skip  ${line}`);

if (failures.length) {
  console.error(`\n${failures.length} color(s) too faint to read:\n`);
  for (const line of failures) console.error(`  ✗ ${line}`);
  console.error('\nPick a darker color in light mode or a lighter one in dark mode, or split it per role.');
  process.exit(1);
}

console.log(`✓ ${checked} hand-picked colors across ${Object.keys(THEMES).length} themes meet their contrast targets.`);
