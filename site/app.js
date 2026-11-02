(function () {
  const KEY = 'el-progress';
  const body = document.body;
  const root = document.documentElement;

  // ---------- progress ----------
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  const save = (p) => localStorage.setItem(KEY, JSON.stringify(p));

  function refresh() {
    const p = load();
    document.querySelectorAll('[data-path]').forEach((el) => {
      if (el.id === 'done-btn') return;
      el.classList.toggle('done', !!p[el.dataset.path]);
    });

    // per-module counts (from sidebar links, which list every topic once)
    const all = [...document.querySelectorAll('.sidebar .nav-topic')];
    const byModule = {};
    all.forEach((a) => {
      const mod = a.dataset.path.split('/')[0];
      byModule[mod] ??= { total: 0, done: 0 };
      byModule[mod].total++;
      if (p[a.dataset.path]) byModule[mod].done++;
    });
    Object.entries(byModule).forEach(([mod, c]) => {
      document.querySelectorAll(`[data-count-module="${mod}"]`).forEach((el) => (el.textContent = `${c.done}/${c.total}`));
      document.querySelectorAll(`[data-bar-module="${mod}"]`).forEach((el) => (el.style.width = `${(c.done / c.total) * 100}%`));
    });

    const done = all.filter((a) => p[a.dataset.path]).length;
    const pct = all.length ? Math.round((done / all.length) * 100) : 0;
    const set = (id, fn) => { const el = document.getElementById(id); if (el) fn(el); };
    set('progress-bar-mini', (el) => (el.style.width = pct + '%'));
    set('progress-text-mini', (el) => (el.textContent = `${done}/${all.length}`));
    set('progress-bar-big', (el) => (el.style.width = pct + '%'));
    set('progress-text-big', (el) => (el.textContent = `${pct}%`));
    set('done-count', (el) => (el.textContent = done));
    set('done-btn', (el) => {
      const isDone = !!p[el.dataset.path];
      el.classList.toggle('done', isDone);
      el.textContent = isDone ? '✓ Đã ôn xong' : 'Đánh dấu đã ôn';
    });
  }

  const doneBtn = document.getElementById('done-btn');
  if (doneBtn) {
    doneBtn.addEventListener('click', () => {
      const p = load();
      const k = doneBtn.dataset.path;
      if (p[k]) delete p[k]; else p[k] = Date.now();
      save(p);
      refresh();
    });
  }
  window.addEventListener('storage', refresh);
  refresh();

  // ---------- theme ----------
  function applyHighlightTheme() {
    const dark = root.dataset.theme === 'dark';
    const l = document.getElementById('hl-light');
    const d = document.getElementById('hl-dark');
    if (l) l.disabled = dark;
    if (d) d.disabled = !dark;
  }
  applyHighlightTheme();
  document.getElementById('theme-btn')?.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('el-theme', root.dataset.theme);
    applyHighlightTheme();
  });

  // ---------- mobile sidebar ----------
  const toggleMenu = (open) => body.classList.toggle('menu-open', open);
  document.getElementById('menu-btn')?.addEventListener('click', () => toggleMenu(!body.classList.contains('menu-open')));
  document.getElementById('backdrop')?.addEventListener('click', () => toggleMenu(false));

  // scroll active link into view
  document.querySelector('.nav-topic.active')?.scrollIntoView({ block: 'center' });

  // ---------- search ----------
  const search = document.getElementById('search');
  search?.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
    document.querySelectorAll('.nav-module').forEach((mod) => {
      let any = false;
      mod.querySelectorAll('li').forEach((li) => {
        const t = li.textContent.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
        const hit = !q || t.includes(q);
        li.hidden = !hit;
        any ||= hit;
      });
      mod.hidden = !any;
      if (q) mod.open = any;
    });
  });

  // ---------- code: highlight + copy ----------
  window.addEventListener('load', () => {
    if (window.hljs) document.querySelectorAll('pre code').forEach((el) => window.hljs.highlightElement(el));
  });
  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const code = btn.parentElement.querySelector('code')?.innerText || '';
      try {
        await navigator.clipboard.writeText(code);
        btn.textContent = 'Copied!';
      } catch {
        btn.textContent = 'Lỗi';
      }
      setTimeout(() => (btn.textContent = 'Copy'), 1500);
    });
  });

  // ---------- mermaid (lazy) ----------
  if (document.querySelector('pre.mermaid')) {
    import('https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs').then(({ default: mermaid }) => {
      mermaid.initialize({ startOnLoad: false, theme: root.dataset.theme === 'dark' ? 'dark' : 'default' });
      mermaid.run({ querySelector: 'pre.mermaid' });
    });
  }
})();
