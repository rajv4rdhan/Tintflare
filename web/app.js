/**
 * Tintflare showcase.
 *
 * Everything this script does is choose URLs. The recoloring happens on the
 * worker; this file never touches a color inside an SVG.
 */
(() => {
  'use strict';

  /** Bump after changing a theme on the worker, so browsers fetch fresh copies. */
  const VERSION = '1';

  /**
   * Paints shown on this page. `bg` must match the theme's `background` in
   * `src/themes/*.ts`, so drawings sit seamlessly on the page.
   */
  const PAINTS = [
    { id: 'riso', name: 'Riso', no: '05', tag: 'fluoro pink & federal blue on cream stock',
      light: { bg: '#f7f2e8', ink: '#1b3a8c', accent: '#f0337f' }, dark: { bg: '#151515', ink: '#fff4dc', accent: '#ff5fa2' } },
    { id: 'blueprint', name: 'Blueprint', no: '02', tag: 'chalk lines on architect blue',
      light: { bg: '#eef4fb', ink: '#0b2a55', accent: '#c2362f' }, dark: { bg: '#123f78', ink: '#f4f8ff', accent: '#ffab9c' } },
    { id: 'chalkboard', name: 'Chalkboard', no: '03', tag: 'dusty chalk, or markers on a whiteboard',
      light: { bg: '#fbfbf8', ink: '#1c1c1c', accent: '#d32f2f' }, dark: { bg: '#263a33', ink: '#f3f0e6', accent: '#ffa3a3' } },
    { id: 'phosphor', name: 'Phosphor', no: '04', tag: 'green CRT glow, or a green-bar printout',
      light: { bg: '#f3f8ee', ink: '#16351f', accent: '#9a3412' }, dark: { bg: '#06100a', ink: '#8dffa8', accent: '#ffb000' } },
    { id: 'synthwave', name: 'Synthwave', no: '06', tag: 'neon night drive, or cotton candy',
      light: { bg: '#fff1f8', ink: '#3a1460', accent: '#c2187a' }, dark: { bg: '#1b0f33', ink: '#fdf0ff', accent: '#ff4fd8' } },
    { id: 'rvfolio', name: 'Paper & Ink', no: '01', tag: 'warm paper, rust accent (the author\'s blog)',
      light: { bg: '#f7f3ec', ink: '#1b1815', accent: '#b23a16' }, dark: { bg: '#181716', ink: '#f1ece4', accent: '#f0642d' } },
    { id: 'default', name: 'Auto', no: '00', tag: 'no palette at all: pure OKLCH math',
      light: { bg: '#ffffff', ink: '#1e1e1e', accent: '#e03131' }, dark: { bg: '#0f172a', ink: '#e2e8f0', accent: '#f87171' } },
  ];

  /** Names for Excalidraw's standard palette, used in the itemized receipt. */
  const EXCALIDRAW_NAMES = {
    '#1e1e1e': 'ink', '#e03131': 'red', '#2f9e44': 'green', '#1971c2': 'blue', '#f08c00': 'orange',
    '#ffc9c9': 'rose', '#b2f2bb': 'mint', '#a5d8ff': 'sky', '#ffec99': 'butter', '#ffffff': 'paper',
  };

  const root = document.documentElement;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const cdnBase = (() => {
    const configured = $('meta[name="tintflare-cdn"]')?.content.trim();
    if (configured) return configured.replace(/\/+$/, '') + '/';
    // Opened straight from disk: borrow the public demo worker.
    if (location.protocol === 'file:') return 'https://tintflare.rscx.workers.dev/';
    return new URL('./', location.href).href;
  })();

  const drawingUrl = (file, paint, mode) => {
    const url = new URL(`drawings/${file}`, cdnBase);
    if (paint) {
      url.searchParams.set('theme', paint);
      url.searchParams.set('tm', mode);
      url.searchParams.set('v', VERSION);
    }
    return url.href;
  };

  const paintById = (id) => PAINTS.find((p) => p.id === id) ?? PAINTS[0];
  const state = { paint: root.dataset.theme, mode: root.dataset.mode, ticket: 0 };

  // ---------------------------------------------------------------- loading
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(src));
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });

  // ---------------------------------------------------------------- applying a paint
  async function setPaint(paint, mode, origin) {
    if (paint === state.paint && mode === state.mode && $('#hero-img').src) return;
    state.paint = paint;
    state.mode = mode;

    const hero = drawingUrl('tintflare-story.svg', paint, mode);
    const ready = await Promise.allSettled([loadImage(hero)]);
    if (paint !== state.paint || mode !== state.mode) return; // a newer click won

    const commit = () => {
      root.dataset.theme = paint;
      root.dataset.mode = mode;
      renderPaint(ready[0].status === 'fulfilled');
    };

    if (origin && document.startViewTransition && !reducedMotion.matches) {
      root.style.setProperty('--vt-x', `${origin.x}px`);
      root.style.setProperty('--vt-y', `${origin.y}px`);
      // A skipped transition (hidden tab, rapid clicks) still runs `commit`.
      document.startViewTransition(commit).ready.catch(() => {});
    } else {
      commit();
    }

    try {
      localStorage.setItem('tintflare:paint', JSON.stringify({ theme: paint, mode }));
    } catch {}
    history.replaceState(null, '', `#${paint}/${mode}`);
  }

  function renderPaint(heroLoaded) {
    const { paint, mode } = state;
    const meta = paintById(paint);
    const label = `${meta.name} · ${mode}`;

    const hero = $('#hero-img');
    hero.src = drawingUrl('tintflare-story.svg', paint, mode);
    $('.stage-error').hidden = heroLoaded;
    hero.hidden = !heroLoaded;

    $$('.paint-name').forEach((el) => (el.textContent = label));
    $$('.paint-slug').forEach((el) => (el.textContent = paint));
    $('.mode-label').textContent = mode;
    $('.mode-toggle').setAttribute('aria-pressed', String(mode === 'dark'));
    $('.u-val[data-part="theme"]').textContent = paint;
    $('.u-val[data-part="mode"]').textContent = mode;
    $('.u-val[data-part="v"]').textContent = VERSION;
    $('meta[name="theme-color"]')?.setAttribute('content', meta[mode].bg);

    $$('.chip').forEach((chip) => chip.setAttribute('aria-checked', String(chip.dataset.paint === paint)));
    $$('.paint-card').forEach((card) => {
      card.classList.toggle('is-current', card.dataset.paint === paint);
      const p = paintById(card.dataset.paint);
      card.style.setProperty('--card-bg', p[mode].bg);
      card.style.setProperty('--card-ink', p[mode].ink);
      card.style.setProperty('--card-accent', p[mode].accent);
      $('img', card).src = drawingUrl('palette-card.svg', p.id, mode);
    });

    $('.slider-before').src = drawingUrl('tintflare-story.svg');
    $('.slider-after').src = hero.src;
    $('.inverted').src = drawingUrl('tintflare-story.svg');
    $('.tinted-dark').src = drawingUrl('tintflare-story.svg', paint, 'dark');
    $$('.dark-swatch').forEach((el) => el.style.setProperty('--swatch-bg', meta.dark.bg));

    $('.file-name').textContent = `src/themes/${paint === 'default' ? 'light.ts / dark.ts' : `${paint}.ts`}`;
    writeTicket(hero.src, label);
    itemize(paint, mode);
  }

  // ---------------------------------------------------------------- chips + wall
  function buildChips() {
    const rail = $('.chip-rail');
    const wall = $('.wall-grid');

    for (const p of PAINTS) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip';
      chip.dataset.paint = p.id;
      chip.setAttribute('role', 'radio');
      chip.style.setProperty('--chip-light', p.light.bg);
      chip.style.setProperty('--chip-dark', p.dark.bg);
      chip.style.setProperty('--chip-accent', p.light.accent);
      chip.style.setProperty('--chip-accent-dark', p.dark.accent);
      chip.innerHTML = `<span class="chip-swatch" aria-hidden="true"></span><span class="chip-name">${p.name}</span>`;
      chip.addEventListener('click', (event) => setPaint(p.id, state.mode, pointFrom(event, chip)));
      rail.append(chip);

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'paint-card';
      card.dataset.paint = p.id;
      card.innerHTML = `
        <span class="paint-sample"><img alt="" width="960" height="400" loading="lazy" /></span>
        <span class="paint-label">
          <span class="paint-no">No. ${p.no}</span>
          <span class="paint-title">${p.name}</span>
          <span class="paint-tag">${p.tag}</span>
          <code class="paint-query">?theme=${p.id}</code>
        </span>`;
      card.setAttribute('aria-label', `Use the ${p.name} paint`);
      card.addEventListener('click', (event) => {
        setPaint(p.id, state.mode, pointFrom(event, card));
        $('#top').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      });
      wall.append(card);
    }

    // Arrow keys move between chips like a proper radio group.
    rail.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      event.stopPropagation();
      step(event.key === 'ArrowRight' ? 1 : -1, true);
    });
  }

  const pointFrom = (event, el) => {
    if (event.clientX || event.clientY) return { x: event.clientX, y: event.clientY };
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  function step(delta, focusChip) {
    const i = PAINTS.findIndex((p) => p.id === state.paint);
    const next = PAINTS[(i + delta + PAINTS.length) % PAINTS.length];
    const chip = $(`.chip[data-paint="${next.id}"]`);
    if (focusChip) chip.focus();
    chip.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    setPaint(next.id, state.mode, pointFrom({}, chip));
  }

  function toggleMode(origin) {
    setPaint(state.paint, state.mode === 'dark' ? 'light' : 'dark', origin);
  }

  // ---------------------------------------------------------------- live ticket
  function writeTicket(src, label) {
    state.ticket += 1;
    const ticket = state.ticket;
    $('.ticket-no').textContent = `#${String(ticket).padStart(4, '0')}`;
    $('[data-t="paint"]').textContent = label;
    ['cache', 'time', 'size'].forEach((k) => ($(`[data-t="${k}"]`).textContent = '…'));

    // The browser's own timing for the image request. Same-origin (or a
    // Timing-Allow-Origin header) exposes sizes and the worker's Server-Timing.
    const read = () => {
      if (ticket !== state.ticket) return;
      const entry = performance.getEntriesByName(src).pop();
      if (!entry) return void setTimeout(read, 150);
      const cache = entry.serverTiming?.find((t) => t.name === 'cache')?.description;
      const fromBrowser = entry.transferSize === 0 && entry.decodedBodySize > 0;
      $('[data-t="cache"]').textContent = fromBrowser ? 'browser cache' : cache ? cache.toLowerCase() : 'n/a (cross-origin)';
      $('[data-t="time"]').textContent = `${Math.max(1, Math.round(entry.duration))} ms`;
      $('[data-t="size"]').textContent = entry.decodedBodySize ? `${(entry.decodedBodySize / 1024).toFixed(1)} KB` : 'n/a (cross-origin)';
    };
    setTimeout(read, 60);
  }

  // ---------------------------------------------------------------- itemized swaps
  const textCache = new Map();
  const fetchText = (url) => {
    if (!textCache.has(url)) textCache.set(url, fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(r.status))));
    return textCache.get(url);
  };

  /** Paint colors in document order, with the role Tintflare gives each. */
  function paintColors(svg) {
    const found = [];
    for (const tag of svg.match(/<[a-z][^>]*>/gi) ?? []) {
      const isText = /^<text\b/i.test(tag);
      for (const [, attr, color] of tag.matchAll(/\b(fill|stroke)="(#[0-9a-f]{3,8})"/gi)) {
        found.push({ role: attr === 'stroke' ? 'stroke' : isText ? 'text' : 'fill', color: color.toLowerCase() });
      }
    }
    return found;
  }

  async function itemize(paint, mode) {
    const list = $('.swap-list');
    list.setAttribute('aria-busy', 'true');
    try {
      const [raw, themed] = await Promise.all([
        fetchText(drawingUrl('palette-card.svg')),
        fetchText(drawingUrl('palette-card.svg', paint, mode)),
      ]);
      if (paint !== state.paint || mode !== state.mode) return;

      const before = paintColors(raw);
      const after = paintColors(themed);
      const swaps = new Map();
      before.forEach((b, i) => {
        const key = `${b.role}:${b.color}`;
        if (!swaps.has(key) && after[i]) swaps.set(key, { ...b, to: after[i].color });
      });

      const order = { text: 0, stroke: 1, fill: 2 };
      const rows = [...swaps.values()].sort((a, b) => order[a.role] - order[b.role] || a.color.localeCompare(b.color));
      list.innerHTML = rows
        .map((s) => `
          <li class="swap">
            <span class="swap-role">${s.role}</span>
            <span class="swap-name">${EXCALIDRAW_NAMES[s.color] ?? 'custom'}</span>
            <span class="swap-chip" style="--c:${s.color}" title="${s.color}"></span>
            <code>${s.color}</code>
            <span class="swap-arrow" aria-hidden="true">→</span>
            <span class="swap-chip" style="--c:${s.to}" title="${s.to}"></span>
            <code>${s.to}</code>
          </li>`)
        .join('');
      $('.theme-code').innerHTML = themeCode(paint, mode, rows);
    } catch {
      list.innerHTML = '<li class="swap swap-empty">Couldn\'t reach the worker for this paint. Is it deployed?</li>';
      $('.theme-code').textContent = '';
    } finally {
      list.removeAttribute('aria-busy');
    }
  }

  function themeCode(paint, mode, rows) {
    const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const byColor = new Map();
    for (const r of rows) {
      if (r.color === '#ffffff') continue; // white fills follow the background automatically
      const roles = byColor.get(r.color) ?? {};
      roles[r.role] = r.to;
      byColor.set(r.color, roles);
    }
    const lines = [...byColor.entries()].map(([color, roles]) => {
      const values = [...new Set(Object.values(roles))];
      const name = EXCALIDRAW_NAMES[color] ?? '';
      if (values.length === 1) return `      <span class="s">'${color}'</span>: <span class="s">'${values[0]}'</span>, <span class="c">// ${name}</span>`;
      const inner = Object.entries(roles).map(([role, v]) => `${role}: <span class="s">'${v}'</span>`).join(', ');
      return `      <span class="s">'${color}'</span>: { ${inner} }, <span class="c">// ${name}</span>`;
    });
    const name = paint === 'default' ? 'auto' : paint;
    return [
      `<span class="k">export const</span> ${esc(name)}Theme = {`,
      `  ${mode}: {`,
      `    background: <span class="s">'${paintById(paint)[mode].bg}'</span>,`,
      `    overrides: {`,
      ...lines,
      `    },`,
      `  },`,
      `  <span class="c">// …and a ${mode === 'dark' ? 'light' : 'dark'} twin</span>`,
      `};`,
    ].join('\n');
  }

  // ---------------------------------------------------------------- before/after slider
  function wireSlider() {
    const slider = $('.slider');
    const input = $('.slider-input');
    const set = (v) => slider.style.setProperty('--split', `${v}%`);
    input.addEventListener('input', () => set(input.value));
    // Let the whole picture be a drag target, not just the thin handle.
    slider.addEventListener('pointerdown', (event) => {
      const move = (e) => {
        const r = slider.getBoundingClientRect();
        const v = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
        input.value = String(Math.round(v));
        set(v);
      };
      move(event);
      slider.setPointerCapture(event.pointerId);
      slider.addEventListener('pointermove', move);
      slider.addEventListener('pointerup', () => slider.removeEventListener('pointermove', move), { once: true });
    });
  }

  // ---------------------------------------------------------------- misc
  function wireControls() {
    $('.mode-toggle').addEventListener('click', (event) => toggleMode(pointFrom(event, event.currentTarget)));

    $('.copy-btn').addEventListener('click', async (event) => {
      const button = event.currentTarget;
      try {
        await navigator.clipboard.writeText($('#hero-img').src);
        button.textContent = 'Copied ✓';
      } catch {
        button.textContent = 'Copy blocked';
      }
      setTimeout(() => (button.textContent = 'Copy URL'), 1600);
    });

    document.addEventListener('keydown', (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target.closest('input, textarea, [contenteditable]')) return;
      const key = event.key.toLowerCase();
      if (key === 'arrowright') step(1);
      else if (key === 'arrowleft') step(-1);
      else if (key === 'd') toggleMode({ x: innerWidth - 40, y: 32 });
      else if (key === 'r') {
        const others = PAINTS.filter((p) => p.id !== state.paint);
        const pick = others[Math.floor(Math.random() * others.length)];
        setPaint(pick.id, Math.random() < 0.5 ? 'light' : 'dark', { x: innerWidth / 2, y: innerHeight / 2 });
      } else return;
      event.preventDefault();
    });

    addEventListener('hashchange', () => {
      const [paint, mode] = location.hash.slice(1).split('/');
      if (PAINTS.some((p) => p.id === paint)) setPaint(paint, mode === 'dark' ? 'dark' : 'light');
    });

    $('.year').textContent = String(new Date().getFullYear());
  }

  // Add a theme-color meta that follows the paint.
  const themeColor = document.createElement('meta');
  themeColor.name = 'theme-color';
  document.head.append(themeColor);

  buildChips();
  wireSlider();
  wireControls();
  state.paint = null; // force the first render
  setPaint(root.dataset.theme, root.dataset.mode);
})();
