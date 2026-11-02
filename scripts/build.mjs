// Build static HTML site from markdown sources.
// Source of truth for module/topic order & titles: README.md
// Output: dist/ (deploy to Vercel, or open dist/index.html directly)

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const SITE_TITLE = 'Engineering Lab';
const SITE_SUBTITLE = 'Ôn tập Senior Fullstack · PHP · Node.js · React/Vue';

// ---------- helpers ----------
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const slugify = (s) =>
  String(s)
    .replace(/<[^>]+>/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const inlineMd = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

// ---------- parse README ----------
function parseIndex() {
  const lines = readFileSync(join(ROOT, 'README.md'), 'utf8').split('\n');
  const modules = [];
  let priority = '';
  for (const line of lines) {
    const mod = line.match(/^###\s+(\d+)\s+[–-]\s+(.+)$/);
    if (mod) {
      modules.push({ num: mod[1], title: mod[2].trim(), topics: [] });
      continue;
    }
    const topic = line.match(/^\s*-\s+\[[ xX]\]\s+\[(.+)\]\(([^)]+\.md)\)/);
    if (topic && modules.length) {
      const mdPath = topic[2];
      modules.at(-1).topics.push({
        title: topic[1],
        mdPath,
        htmlPath: mdPath.replace(/\.md$/, '.html'),
        dir: mdPath.split('/')[0],
      });
      continue;
    }
    const pr = line.match(/^\*\*Thứ tự ưu tiên viết\/ôn:\*\*\s*(.+)$/);
    if (pr) priority = pr[1];
  }
  for (const m of modules) m.dir = m.topics[0]?.dir ?? `module-${m.num}`;
  return { modules, priority };
}

// ---------- markdown ----------
function createMarked(toc) {
  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const id = slugify(html) || `h-${toc.length}`;
        if (depth === 2 || depth === 3) toc.push({ id, depth, html });
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}">#</a>${html}</h${depth}>\n`;
      },
      code({ text, lang }) {
        const language = (lang || '').trim().split(/\s+/)[0];
        if (language === 'mermaid') return `<pre class="mermaid">${esc(text)}</pre>\n`;
        const cls = language ? ` class="language-${esc(language)}"` : '';
        return `<div class="code-block"><button class="copy-btn" type="button">Copy</button><pre><code${cls}>${esc(text)}</code></pre></div>\n`;
      },
      table(token) {
        // wrap tables for horizontal scroll on mobile
        const header = token.header.map((c) => `<th${c.align ? ` style="text-align:${c.align}"` : ''}>${this.parser.parseInline(c.tokens)}</th>`).join('');
        const rows = token.rows
          .map((r) => '<tr>' + r.map((c) => `<td${c.align ? ` style="text-align:${c.align}"` : ''}>${this.parser.parseInline(c.tokens)}</td>`).join('') + '</tr>')
          .join('');
        return `<div class="table-wrap"><table><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>\n`;
      },
    },
  });
  return marked;
}

function renderTopic(md) {
  // Drop the first H1 (page title is rendered from README) and TODO comments
  const body = md.replace(/^\s*#\s+.+\n/, '');
  const meaningful = body
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^>\s*Module:.*$/m, '')
    .trim();
  const toc = [];
  const html = createMarked(toc)
    .parse(body)
    // rewrite links to other markdown files -> html
    .replace(/href="([^"#:]+)\.md(#[^"]*)?"/g, (_, p, h = '') => `href="${p}.html${h}"`);
  return { html, toc, empty: meaningful.length === 0 };
}

// ---------- layout ----------
function sidebar(modules, prefix, currentPath) {
  return modules
    .map((m) => {
      const open = m.topics.some((t) => t.htmlPath === currentPath);
      const items = m.topics
        .map((t) => {
          const active = t.htmlPath === currentPath ? ' active' : '';
          const empty = t.empty ? ' is-empty' : '';
          return `<li><a class="nav-topic${active}${empty}" data-path="${esc(t.htmlPath)}" href="${prefix}${esc(t.htmlPath)}"><span class="check" aria-hidden="true"></span><span class="label">${inlineMd(t.title)}</span></a></li>`;
        })
        .join('');
      return `<details class="nav-module" data-module="${esc(m.dir)}"${open ? ' open' : ''}>
  <summary><span class="num">${m.num}</span><span class="mtitle">${esc(m.title)}</span><span class="mcount" data-count-module="${esc(m.dir)}"></span></summary>
  <ul>${items}</ul>
</details>`;
    })
    .join('\n');
}

function layout({ title, prefix, modules, currentPath, main, toc = [] }) {
  const tocHtml = toc.length
    ? `<aside class="toc"><div class="toc-title">Trong bài này</div><ul>${toc
        .map((h) => `<li class="d${h.depth}"><a href="#${h.id}">${h.html.replace(/<a[^>]*>|<\/a>/g, '')}</a></li>`)
        .join('')}</ul></aside>`
    : '';
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<script>(function(){var t=localStorage.getItem('el-theme');if(!t){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t})()</script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/styles/github.min.css" id="hl-light">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/styles/github-dark.min.css" id="hl-dark">
<link rel="stylesheet" href="${prefix}assets/style.css">
</head>
<body data-prefix="${prefix}" data-current="${esc(currentPath || '')}">
<header class="topbar">
  <button class="icon-btn" id="menu-btn" type="button" aria-label="Menu">☰</button>
  <a class="brand" href="${prefix}index.html">${SITE_TITLE}</a>
  <div class="progress-mini" title="Tiến độ ôn tập"><div class="bar"><span id="progress-bar-mini"></span></div><span id="progress-text-mini"></span></div>
  <button class="icon-btn" id="theme-btn" type="button" aria-label="Đổi giao diện">◐</button>
</header>
<div class="layout">
  <nav class="sidebar" id="sidebar">
    <input class="search" id="search" type="search" placeholder="Tìm chủ đề…" autocomplete="off">
    ${sidebar(modules, prefix, currentPath)}
  </nav>
  <main class="content">${main}</main>
  ${tocHtml}
</div>
<div class="backdrop" id="backdrop"></div>
<script src="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.11.1/highlight.min.js" defer></script>
<script src="${prefix}assets/app.js" defer></script>
</body>
</html>
`;
}

function topicPage(mod, topic, prev, next, modules) {
  const prefix = '../';
  const { html, toc, empty } = topic.rendered;
  const navLink = (t, label, cls) =>
    t ? `<a class="pn ${cls}" href="${prefix}${esc(t.htmlPath)}"><small>${label}</small><span>${inlineMd(t.title)}</span></a>` : '<span></span>';
  const main = `
<nav class="breadcrumb"><a href="${prefix}index.html">Trang chủ</a> / <a href="${prefix}index.html#${esc(mod.dir)}">${mod.num} – ${esc(mod.title)}</a></nav>
<article class="article">
  <h1>${inlineMd(topic.title)}</h1>
  <div class="article-actions">
    <button class="done-btn" id="done-btn" type="button" data-path="${esc(topic.htmlPath)}">Đánh dấu đã ôn</button>
  </div>
  ${empty ? `<div class="empty-note"><strong>Chưa có nội dung.</strong> Tạo nội dung cho file <code>${esc(topic.mdPath)}</code> bằng prompt trong <code>_templates/ai-prompt.md</code>, rồi chạy lại <code>npm run build</code>.</div>` : html}
</article>
<div class="prev-next">${navLink(prev, '← Bài trước', 'prev')}${navLink(next, 'Bài tiếp →', 'next')}</div>`;
  return layout({ title: `${topic.title.replace(/`/g, '')} · ${SITE_TITLE}`, prefix, modules, currentPath: topic.htmlPath, main, toc });
}

function indexPage(modules, priority, total, filled) {
  const prefix = '';
  const cards = modules
    .map((m) => {
      const items = m.topics
        .map(
          (t) =>
            `<li><a class="card-topic${t.empty ? ' is-empty' : ''}" data-path="${esc(t.htmlPath)}" href="${esc(t.htmlPath)}"><span class="check" aria-hidden="true"></span><span>${inlineMd(t.title)}</span></a></li>`,
        )
        .join('');
      return `<section class="card" id="${esc(m.dir)}">
  <header><span class="num">${m.num}</span><h2>${esc(m.title)}</h2></header>
  <div class="card-progress"><div class="bar"><span data-bar-module="${esc(m.dir)}"></span></div><span data-count-module="${esc(m.dir)}"></span></div>
  <ul>${items}</ul>
</section>`;
    })
    .join('\n');
  const main = `
<section class="hero">
  <h1>${SITE_TITLE}</h1>
  <p class="sub">${SITE_SUBTITLE}</p>
  <p>Kiến thức cần và đủ của một Senior Developer để đi phỏng vấn và cập nhật CV.</p>
  <div class="stats">
    <div><b>${modules.length}</b><span>module</span></div>
    <div><b>${total}</b><span>bài</span></div>
    <div><b>${filled}</b><span>bài đã có nội dung</span></div>
    <div><b id="done-count">0</b><span>bài đã ôn</span></div>
  </div>
  <div class="progress-big"><div class="bar"><span id="progress-bar-big"></span></div><span id="progress-text-big"></span></div>
  ${priority ? `<p class="priority"><b>Thứ tự ưu tiên:</b> ${esc(priority)}</p>` : ''}
  <p class="hint">Tiến độ được lưu trên trình duyệt này (localStorage). Bài mờ là bài chưa có nội dung.</p>
</section>
<div class="cards">${cards}</div>`;
  return layout({ title: `${SITE_TITLE} – ${SITE_SUBTITLE}`, prefix, modules, currentPath: '', main });
}

// ---------- build ----------
const { modules, priority } = parseIndex();
rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'assets'), { recursive: true });
cpSync(join(ROOT, 'site'), join(DIST, 'assets'), { recursive: true });

const flat = [];
let missing = 0;
for (const m of modules) {
  for (const t of m.topics) {
    const src = join(ROOT, t.mdPath);
    if (!existsSync(src)) {
      console.warn(`⚠ missing: ${t.mdPath}`);
      missing++;
      t.rendered = { html: '', toc: [], empty: true };
    } else {
      t.rendered = renderTopic(readFileSync(src, 'utf8'));
    }
    t.empty = t.rendered.empty;
    flat.push({ m, t });
  }
}

flat.forEach(({ m, t }, i) => {
  const out = join(DIST, t.htmlPath);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, topicPage(m, t, flat[i - 1]?.t, flat[i + 1]?.t, modules));
});

const filled = flat.filter(({ t }) => !t.empty).length;
writeFileSync(join(DIST, 'index.html'), indexPage(modules, priority, flat.length, filled));

console.log(`✔ Built ${flat.length} topics (${filled} có nội dung) in ${modules.length} modules → dist/${missing ? ` (${missing} missing)` : ''}`);
