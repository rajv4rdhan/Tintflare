/**
 * Tintflare showcase.
 *
 * This script only chooses URLs. The worker does every bit of recoloring;
 * nothing here touches a color inside an SVG.
 */
(() => {
  'use strict';

  /** Bump after changing a theme on the worker, so browsers fetch fresh copies. */
  const VERSION = '1';

  /** The public worker, used whenever this page isn't served by Tintflare itself. */
  const PUBLIC_WORKER = 'https://tintflare.rscx.workers.dev/';

  /** `bg` and `accent` must match `src/themes/*.ts` so the pots preview each paint. */
  const PAINTS = [
    { id: 'rvfolio', name: 'paper & ink', light: ['#f7f3ec', '#b23a16'], dark: ['#181716', '#f0642d'] },
    { id: 'riso', name: 'riso', light: ['#f7f2e8', '#f0337f'], dark: ['#151515', '#ff5fa2'] },
    { id: 'blueprint', name: 'blueprint', light: ['#eef4fb', '#1d5fbf'], dark: ['#123f78', '#a6dbff'] },
    { id: 'chalkboard', name: 'chalkboard', light: ['#fbfbf8', '#d32f2f'], dark: ['#263a33', '#ffa3a3'] },
    { id: 'phosphor', name: 'phosphor', light: ['#f3f8ee', '#1e6b34'], dark: ['#06100a', '#39ff6a'] },
    { id: 'synthwave', name: 'synthwave', light: ['#fff1f8', '#c2187a'], dark: ['#1b0f33', '#ff4fd8'] },
    { id: 'default', name: 'auto (pure math)', light: ['#ffffff', '#e03131'], dark: ['#0f172a', '#60a5fa'] },
  ];

  const root = document.documentElement;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const calm = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { paint: root.dataset.theme, mode: root.dataset.mode, peek: false, cdn: PUBLIC_WORKER };

  /**
   * Drawings come from this page's own address only when Tintflare serves it:
   * the worker always sends `Server-Timing: cache;…`, and a plain static host
   * (Pages, Vercel, a local file server) doesn't, so it would ignore `?theme=`.
   */
  async function findWorker() {
    const configured = $('meta[name="tintflare-cdn"]')?.content.trim();
    if (configured) return configured.replace(/\/+$/, '') + '/';
    if (location.protocol === 'file:') return PUBLIC_WORKER;
    try {
      const probe = await fetch(new URL('drawings/tinty.svg', location.href), { method: 'HEAD', cache: 'no-store' });
      if (/(^|,)\s*cache;/.test(probe.headers.get('server-timing') ?? '')) return new URL('./', location.href).href;
    } catch {}
    return PUBLIC_WORKER;
  }

  const drawing = (file, paint, mode) => {
    const url = new URL(`drawings/${file}`, state.cdn);
    if (paint) {
      url.searchParams.set('theme', paint);
      url.searchParams.set('tm', mode);
      url.searchParams.set('v', VERSION);
    }
    return url.href;
  };

  const preload = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => (img.decode?.() ?? Promise.resolve()).catch(() => {}).then(() => resolve(true));
      img.onerror = () => resolve(false);
      img.src = src;
    });

  // ------------------------------------------------------------------ painting
  async function paint(id, mode, origin) {
    state.paint = id;
    state.mode = mode;
    state.peek = false;
    const ok = await preload(drawing('tinty.svg', id, mode));
    if (id !== state.paint || mode !== state.mode) return; // a newer pick won

    let committed = false;
    const commit = () => {
      if (committed) return;
      committed = true;
      root.dataset.theme = id;
      root.dataset.mode = mode;
      render(ok);
    };
    if (origin && document.startViewTransition && !calm.matches) {
      root.style.setProperty('--vt-x', `${origin.x}px`);
      root.style.setProperty('--vt-y', `${origin.y}px`);
      // A skipped transition (hidden tab, quick clicks) still runs `commit`.
      document.startViewTransition(commit).ready.catch(() => {});
      // A transition waits for a rendered frame; never leave the old paint up.
      setTimeout(commit, 1000);
    } else {
      commit();
    }

    try { localStorage.setItem('tintflare:paint', JSON.stringify({ theme: id, mode })); } catch {}
    history.replaceState(null, '', `#${id}/${mode}`);
  }

  function render(ok = true) {
    const { paint: id, mode, peek } = state;
    const meta = PAINTS.find((p) => p.id === id) ?? PAINTS[0];

    const tinty = $('#tinty');
    tinty.src = peek ? drawing('tinty.svg') : drawing('tinty.svg', id, mode);
    tinty.hidden = !ok;
    $('.canvas-error').hidden = ok;
    $('#flow').src = drawing('flow.svg', id, mode);

    $('.paint-name').textContent = peek ? 'nothing (as exported)' : `${meta.name}, ${mode}`;
    $('.peek').textContent = peek ? 'back to the paint' : 'see the original';
    $('.peek').setAttribute('aria-pressed', String(peek));
    $('.url b[data-part="theme"]').textContent = id;
    $('.url b[data-part="mode"]').textContent = mode;
    $$('.code-paint').forEach((el) => (el.textContent = id));
    $$('.code-mode').forEach((el) => (el.textContent = mode));
    // The theme example uses whatever page you're looking at as "your page".
    $('.code-mode-key').textContent = mode;
    $('.code-bg').textContent = meta[mode][0];
    $('.code-ink').textContent = mode === 'dark' ? '#f1ece4' : '#1b1815';
    $('.code-fill').textContent = mode === 'dark' ? '#243127' : '#dbe2d5';
    $('meta[name="theme-color"]').content = meta[mode][0];

    $$('.pot').forEach((pot) => {
      const p = PAINTS.find((x) => x.id === pot.dataset.paint);
      pot.style.setProperty('--pot-bg', p[mode][0]);
      pot.style.setProperty('--pot-accent', p[mode][1]);
      pot.setAttribute('aria-checked', String(p.id === id));
    });
  }

  // ------------------------------------------------------------------ controls
  const centerOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  function step(delta) {
    const i = PAINTS.findIndex((p) => p.id === state.paint);
    const next = PAINTS[(i + delta + PAINTS.length) % PAINTS.length];
    const pot = $(`.pot[data-paint="${next.id}"]`);
    paint(next.id, state.mode, centerOf(pot));
    return pot;
  }

  const flipMode = (origin) => paint(state.paint, state.mode === 'dark' ? 'light' : 'dark', origin);

  function togglePeek() {
    state.peek = !state.peek;
    render();
  }

  function build() {
    const pots = $('.paints');
    for (const p of PAINTS) {
      const pot = document.createElement('button');
      pot.type = 'button';
      pot.className = 'pot';
      pot.dataset.paint = p.id;
      pot.setAttribute('role', 'radio');
      pot.setAttribute('aria-label', p.name);
      pot.innerHTML = `<span class="pot-label">${p.name}</span>`;
      pot.addEventListener('click', (e) => paint(p.id, state.mode, e.clientX ? { x: e.clientX, y: e.clientY } : centerOf(pot)));
      pots.append(pot);
    }
    pots.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      e.stopPropagation();
      step(e.key === 'ArrowRight' ? 1 : -1).focus();
    });

    $('.mode').addEventListener('click', (e) => flipMode({ x: e.clientX, y: e.clientY }));
    $('.peek').addEventListener('click', togglePeek);

    $('.url').addEventListener('click', async () => {
      const note = $('.url-copied');
      try {
        await navigator.clipboard.writeText(drawing('tinty.svg', state.paint, state.mode));
        note.textContent = 'copied';
      } catch {
        note.textContent = 'copy blocked';
      }
      setTimeout(() => (note.textContent = ''), 1400);
    });

    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.target.closest?.('input, textarea')) return;
      const key = e.key.toLowerCase();
      if (key === 'arrowright') step(1);
      else if (key === 'arrowleft') step(-1);
      else if (key === 'd') flipMode(centerOf($('.mode')));
      else if (key === 'o') togglePeek();
      else return;
      e.preventDefault();
    });

    addEventListener('hashchange', () => {
      const [id, mode] = location.hash.slice(1).split('/');
      if (PAINTS.some((p) => p.id === id)) paint(id, mode === 'dark' ? 'dark' : 'light');
    });

    const themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.append(themeColor);
  }

  build();
  findWorker().then((cdn) => {
    state.cdn = cdn;
    paint(root.dataset.theme, root.dataset.mode);
  });
})();
