#!/usr/bin/env node
/**
 * ZopDev University — Static site generator
 * Reads all markdown lessons; generates static HTML under site/
 * Vercel-deployable. No framework.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const TRACKS_DIR = path.join(ROOT, 'tracks');
const SITE_DIR = path.join(ROOT, 'site');

// BASE_URL: production path prefix. Empty for local preview.
// Set BASE_URL=/resources/university for prod build:
//   BASE_URL=/resources/university node build.js
const BASE = process.env.BASE_URL || '';
const ABS_BASE = 'https://zop.dev/resources/university';
const u = (p) => BASE + p;

// =============================================================
// TRACK METADATA
// =============================================================
const TRACKS = [
  {
    id: 'T0', code: 'T0', slug: 'foundations',
    dir: 'T0_foundations',
    title: 'Cloud Cost Foundations',
    short: 'Foundations',
    eyebrow: 'Course / Foundations',
    tier: 'Operator',
    desc: 'The four categories on every cloud bill, the difference between rack rate and what you paid, FinOps principles, scheduling vs commitments. The vocabulary every engineer and finance partner should share.',
    time: '5 hours',
    audience: 'Everyone',
  },
  {
    id: 'T1', code: 'T1', slug: 'operator',
    dir: 'T1_zopnight_operator',
    title: 'ZopNight Operator',
    short: 'Operator',
    eyebrow: 'Course / Operator',
    tier: 'Operator',
    desc: 'Connect your cloud, discover the estate, run schedules, set overrides, route notifications, audit every action. The operating manual for the team that runs ZopNight day to day.',
    time: '5 hours',
    audience: 'Platform Engineer / FinOps Analyst',
  },
  {
    id: 'T2', code: 'T2', slug: 'engineer',
    dir: 'T2_zopnight_engineer',
    title: 'ZopNight Engineer',
    short: 'Engineer',
    eyebrow: 'Course / Engineer',
    tier: 'Engineer',
    desc: 'Read the 460-rule library, reason about evidence, configure auto-remediation, schedule K8s and Databricks workloads, pre-scale for events, optimize Bedrock. The depth tier for engineers building cost-aware systems.',
    time: '10 hours',
    audience: 'Platform Engineer / SRE / ML Engineer',
  },
  {
    id: 'T3', code: 'T3', slug: 'architect',
    dir: 'T3_zopnight_architect',
    title: 'ZopNight Architect',
    short: 'Architect',
    eyebrow: 'Course / Architect',
    tier: 'Architect',
    desc: 'RBAC, multi-org design, audit log architecture, ZopNight\'s data model, the IDOR-safe gateway, integration patterns, compliance posture (SOC 2, ISO 27001). For platform leads who own the deployment.',
    time: '7 hours',
    audience: 'Platform Lead / Architect / Security',
  },
  {
    id: 'T4', code: 'T4', slug: 'finops-mastery',
    dir: 'T4_finops_mastery',
    title: 'FinOps Mastery',
    short: 'FinOps',
    eyebrow: 'Course / FinOps Mastery',
    tier: 'Architect',
    desc: 'FinOps Foundation framework deep, unit economics, anomaly response, forecasting, commitments, sustainability. The FinOps Practitioner-grade curriculum.',
    time: '7 hours',
    audience: 'FinOps Lead / Finance Partner / Engineering Leader',
  },
  {
    id: 'T5', code: 'T5', slug: 'devops-cost-discipline',
    dir: 'T5_devops_cost_discipline',
    title: 'DevOps Cost Discipline',
    short: 'DevOps Cost',
    eyebrow: 'Course / DevOps Cost Discipline',
    tier: 'Engineer',
    desc: 'Tagging strategy, schedule patterns, K8s discipline, multi-account design, reliability vs cost, IaC enforcement, incident response. The engineering practices that keep cost discipline durable.',
    time: '6 hours',
    audience: 'Platform Engineer / DevOps / SRE',
  },
  {
    id: 'T6', code: 'T6', slug: 'ai-powered-cloud-ops',
    dir: 'T6_ai_powered_cloud_ops',
    title: 'AI-Powered Cloud Ops',
    short: 'AI Ops',
    eyebrow: 'Course / AI-Powered Cloud Ops',
    tier: 'Engineer',
    desc: 'MCP read-only architecture, AI agent setup (Claude, Cursor, Codex), PAT management, audit logging, team-specific prompts. The 2026 differentiator: agent-driven FinOps.',
    time: '5 hours',
    audience: 'Platform Engineer / AI Ops / FinOps',
  },
];

// =============================================================
// HELPERS
// =============================================================
const escapeHTML = (s) => String(s)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const slugify = (s) => String(s)
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// Strip basic markdown syntax from a string for use in plain excerpts:
// bold/italic markers, inline code backticks, link syntax. Leaves the
// text content. Used for module/lesson card summaries where we don't
// want raw **markdown** showing through.
const stripMarkdown = (s) => String(s || '')
  .replace(/\*\*([^*]+)\*\*/g, '$1')           // **bold**
  .replace(/(^|[^*])\*([^*]+)\*/g, '$1$2')     // *italic* (not part of **)
  .replace(/__([^_]+)__/g, '$1')               // __bold__
  .replace(/(^|[^_])_([^_]+)_/g, '$1$2')       // _italic_
  .replace(/`([^`]+)`/g, '$1')                 // `code`
  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')     // [text](url)
  .replace(/\s+/g, ' ')
  .trim();

// Sanitize the authored "§ T0 · M0.1 · L1 of 5 · Operator tier · 9 min"
// signature line for display in the lesson-id header. The orange square
// pseudo-element already does the section-marker duty per DESIGN.md, and
// middle dots are banned in chrome per SKILL.md §4. Source markdown is
// not modified; this is a display-only transform.
function formatLessonSignature(sig) {
  if (!sig) return '';
  return String(sig)
    .replace(/^§\s*/, '')                // drop the section sign + space
    .replace(/\s*[·]\s*/g, ' / ');       // middle dot to slash
}

// Minimal inline renderer for outcome/excerpt strings (bold + italic + code spans only).
// Input is treated as plain text first, then bold/italic markers are converted.
function renderInlineBasic(text) {
  // Escape HTML first
  let t = escapeHTML(String(text));
  // Then revive markdown markers (the escape doesn't touch * or `)
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(?<![*\w])\*([^*\n]+)\*(?![*\w])/g, '<em>$1</em>');
  return t;
}

// Strip frontmatter-style YAML if present
const stripFrontmatter = (md) => {
  if (md.startsWith('---\n')) {
    const end = md.indexOf('\n---\n', 4);
    if (end > 0) return md.slice(end + 5);
  }
  return md;
};

// Strip the lesson header block: H1 + § signature + outcome + metadata table.
// All of these are extracted and shown in dedicated template slots (lesson-id,
// h1, outcome callout, metabox) — rendering them again in the body causes
// duplication.
const stripLessonHeaderBlock = (md) => {
  const lines = md.split('\n');
  // Find the first heading that begins a real content section.
  // Real content sections start with: "## 1.", "## 2.", ... or "## Concept",
  // "## Demo", "## Hands-on", "## Knowledge", "## Apply", "## Module quiz",
  // "## Related", "## Glossary", "## Track" (track-complete), etc.
  // We anchor on the END of the metadata table: the last `---` separator
  // before the first non-Outcome H2.
  let firstContentHeadingIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^##\s+(.+)$/);
    if (!m) continue;
    const heading = m[1].trim();
    if (/^outcome$/i.test(heading)) continue; // skip outcome heading
    firstContentHeadingIdx = i;
    break;
  }
  if (firstContentHeadingIdx === -1) return md;
  // Walk back from the content heading to the nearest `---` separator
  // (the one closing the metadata table). Skip it too.
  let startIdx = firstContentHeadingIdx;
  for (let i = firstContentHeadingIdx - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (t === '---') { startIdx = i + 1; break; }
    if (t === '') continue;
    // hit some non-separator content → stop, keep current startIdx
    break;
  }
  return lines.slice(startIdx).join('\n');
};

// Minimal markdown → HTML renderer
function renderMarkdown(md) {
  md = stripFrontmatter(md);
  // Strip the lesson "header block" — H1, § signature, hr, ## Outcome + outcome para,
  // hr, metadata table, hr — all rendered separately in the lesson template.
  // The body content begins at the first "## " heading that's NOT "## Outcome".
  md = stripLessonHeaderBlock(md);
  const lines = md.split('\n');
  const out = [];
  let i = 0;
  let inCode = false, codeBuf = [], codeLang = '';
  let inList = false, listType = '';
  let inTable = false, tableHeaderDone = false;

  const flushPara = (buf) => {
    if (buf.length === 0) return '';
    const text = buf.join(' ').trim();
    if (!text) return '';
    return `<p>${renderInline(text)}</p>\n`;
  };

  const renderInline = (text) => {
    // Code spans
    text = text.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHTML(code)}</code>`);
    // Bold
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Italic (not greedy; avoid lists)
    text = text.replace(/(?<![*\w])\*([^*\n]+)\*(?![*\w])/g, '<em>$1</em>');
    // Links [text](url) — also rewrite lesson-body references to
    // reference/glossary/<slug>.md into the per-term page URL.
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => {
      // Glossary term: lessons author them as relative .md paths
      // (../../../reference/glossary/<slug>.md). Rewrite to the
      // generated per-term page so the link actually resolves.
      const glossaryM = url.match(/reference\/glossary\/([^)\/]+?)\.md$/i);
      if (glossaryM) {
        return `<a href="${BASE}/glossary/${slugify(glossaryM[1])}/">${txt}</a>`;
      }
      // Cross-lesson reference: lessons sometimes author L1_foo.md etc.
      // Leave these alone for now — they'd need full-path resolution.
      const isExternal = /^https?:\/\//.test(url);
      const target = isExternal ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${url}"${target}>${txt}</a>`;
    });
    return text;
  };

  let paraBuf = [];

  while (i < lines.length) {
    const line = lines[i];

    // Code block fence
    if (line.startsWith('```')) {
      if (!inCode) {
        if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
        if (inList) { out.push(`</${listType}>\n`); inList = false; }
        inCode = true;
        codeLang = line.slice(3).trim();
        codeBuf = [];
      } else {
        inCode = false;
        out.push(`<pre><code${codeLang ? ` class="lang-${codeLang}"` : ''}>${escapeHTML(codeBuf.join('\n'))}</code></pre>\n`);
        codeBuf = [];
      }
      i++; continue;
    }
    if (inCode) { codeBuf.push(line); i++; continue; }

    // Horizontal rule
    if (line.trim() === '---') {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      if (inList) { out.push(`</${listType}>\n`); inList = false; }
      out.push('<hr>\n');
      i++; continue;
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      if (inList) { out.push(`</${listType}>\n`); inList = false; }
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      // Skip H1 in body (handled in header section)
      if (level === 1) { i++; continue; }
      const slug = slugify(text);
      out.push(`<h${level} id="${slug}">${renderInline(text)}</h${level}>\n`);
      i++; continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      const bqLines = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        bqLines.push(lines[i].slice(2));
        i++;
      }
      out.push(`<blockquote>${renderInline(bqLines.join(' '))}</blockquote>\n`);
      continue;
    }

    // Tables (simple GFM)
    if (line.startsWith('|') && i + 1 < lines.length && lines[i+1].match(/^\|[\s\-\|:]+\|/)) {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      if (inList) { out.push(`</${listType}>\n`); inList = false; }
      const tableLines = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const headerCells = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
        const bodyRows = tableLines.slice(2).map(row =>
          row.split('|').slice(1, -1).map(c => c.trim())
        );
        out.push('<table>\n<thead>\n<tr>');
        for (const h of headerCells) out.push(`<th>${renderInline(h)}</th>`);
        out.push('</tr>\n</thead>\n<tbody>\n');
        for (const r of bodyRows) {
          out.push('<tr>');
          for (const c of r) out.push(`<td>${renderInline(c)}</td>`);
          out.push('</tr>\n');
        }
        out.push('</tbody>\n</table>\n');
      }
      continue;
    }

    // Unordered list
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      if (!inList || listType !== 'ul') {
        if (inList) out.push(`</${listType}>\n`);
        out.push('<ul>\n');
        inList = true;
        listType = 'ul';
      }
      out.push(`<li>${renderInline(ulMatch[1])}</li>\n`);
      i++; continue;
    }

    // Ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      if (!inList || listType !== 'ol') {
        if (inList) out.push(`</${listType}>\n`);
        out.push('<ol>\n');
        inList = true;
        listType = 'ol';
      }
      out.push(`<li>${renderInline(olMatch[1])}</li>\n`);
      i++; continue;
    }

    // Details / summary (raw HTML)
    if (line.trim().startsWith('<details>') || line.trim().startsWith('</details>') ||
        line.trim().startsWith('<summary>') || line.trim().startsWith('</summary>')) {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      if (inList) { out.push(`</${listType}>\n`); inList = false; }
      out.push(line + '\n');
      i++; continue;
    }

    // Empty line
    if (line.trim() === '') {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      if (inList) { out.push(`</${listType}>\n`); inList = false; }
      i++; continue;
    }

    // Paragraph accumulator
    paraBuf.push(line);
    i++;
  }

  if (paraBuf.length) out.push(flushPara(paraBuf));
  if (inList) out.push(`</${listType}>\n`);
  if (inCode) out.push(`<pre><code>${escapeHTML(codeBuf.join('\n'))}</code></pre>\n`);

  return out.join('');
}

// =============================================================
// PARSE LESSON FILES
// =============================================================
function parseLessonFile(filePath) {
  const md = fs.readFileSync(filePath, 'utf8');
  const lines = md.split('\n');

  // First H1 is the title
  let title = '';
  for (const line of lines) {
    const m = line.match(/^#\s+(.+)$/);
    if (m) { title = m[1].trim(); break; }
  }

  // Find the "§ ... · X min" line (lesson signature)
  let signature = '';
  for (const line of lines.slice(0, 10)) {
    if (line.startsWith('§')) { signature = line.trim(); break; }
  }

  // Find metadata table
  const meta = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\|\s*\*\*([^*]+)\*\*\s*\|\s*(.+?)\s*\|$/);
    if (m) {
      meta[m[1].trim()] = m[2].trim();
    }
  }

  // Find Outcome (first paragraph after "## Outcome")
  let outcome = '';
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '## Outcome') {
      for (let j = i + 1; j < lines.length; j++) {
        const t = lines[j].trim();
        if (!t) continue;
        if (t.startsWith('---')) break;
        if (t.startsWith('|')) break;
        if (t.startsWith('#')) break;
        outcome = t;
        break;
      }
      break;
    }
  }

  return { title, signature, meta, outcome, raw: md };
}

// =============================================================
// COLLECT ALL LESSONS
// =============================================================
function collectTracks() {
  const tracks = [];
  for (const t of TRACKS) {
    const trackDir = path.join(TRACKS_DIR, t.dir);
    if (!fs.existsSync(trackDir)) continue;
    const moduleDirs = fs.readdirSync(trackDir)
      .filter(d => fs.statSync(path.join(trackDir, d)).isDirectory())
      .filter(d => d.startsWith('M'))
      .sort();

    const modules = [];
    for (const md of moduleDirs) {
      const modDir = path.join(trackDir, md);
      const lessonFiles = fs.readdirSync(modDir)
        .filter(f => f.startsWith('L') && f.endsWith('.md'))
        .sort();

      // Module code: M2.1 from M2.1_rule_library
      const modCode = md.match(/^(M\d+\.\d+)/)?.[1] || md;
      const modTitleSlug = md.replace(/^M\d+\.\d+_/, '');
      const modTitle = modTitleSlug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      // Read module README for description (if present).
      // Find the first real prose paragraph — skip headings, eyebrow lines,
      // hr separators, table rows, and bullet markers. If the first prose
      // line happens to live under a "## Module outcome" heading, grab that.
      const readmePath = path.join(modDir, '00_README.md');
      let modDesc = '';
      if (fs.existsSync(readmePath)) {
        const r = fs.readFileSync(readmePath, 'utf8');
        const isProse = (l) => {
          const t = l.trim();
          if (!t) return false;
          if (t.startsWith('#')) return false;          // headings
          if (t.startsWith('§')) return false;          // eyebrow
          if (/^[-=*_]{3,}\s*$/.test(t)) return false;  // hr separators (---, ***, ===)
          if (t.startsWith('|')) return false;          // table rows
          if (/^[-*+]\s/.test(t)) return false;         // bullet lists
          if (/^\d+\.\s/.test(t)) return false;         // ordered lists
          if (t.startsWith('>')) return false;          // blockquotes
          return true;
        };
        const lines = r.split('\n');
        // Prefer the paragraph right after "## Module outcome" if present
        const outcomeIdx = lines.findIndex(l => /^##\s+Module outcome/i.test(l.trim()));
        if (outcomeIdx >= 0) {
          for (let i = outcomeIdx + 1; i < lines.length; i++) {
            if (isProse(lines[i])) { modDesc = lines[i].trim(); break; }
            if (/^##\s/.test(lines[i])) break;          // next section
          }
        }
        if (!modDesc) {
          const firstPara = lines.find(isProse);
          modDesc = (firstPara || '').trim();
        }
      }

      const lessons = [];
      for (const lf of lessonFiles) {
        const lfPath = path.join(modDir, lf);
        const parsed = parseLessonFile(lfPath);
        // L1, L2, etc.
        const lessonCode = lf.match(/^(L\d+)/)?.[1] || lf;
        const lessonSlug = lf.replace(/^L\d+_/, '').replace(/\.md$/, '').replace(/_/g, '-');
        lessons.push({
          code: lessonCode,
          slug: lessonSlug,
          file: lf,
          path: lfPath,
          ...parsed,
        });
      }

      modules.push({
        code: modCode,
        slug: modTitleSlug.replace(/_/g, '-'),
        dir: md,
        title: modTitle,
        desc: modDesc,
        lessons,
      });
    }
    tracks.push({ ...t, modules });
  }
  return tracks;
}

// =============================================================
// SHARED PARTIALS — nav, footer
// =============================================================
// =============================================================
// SECONDARY UNIVERSITY NAV
// =============================================================
// Sits just under the primary ZopDev chrome on every University
// page. Mirrors stripe.training: brand-lockup left, Catalog with a
// role-filtered dropdown, Certifications, Glossary, Search.
function universityNav(opts = {}) {
  const { active = '' } = opts;
  const cls = (id) => id === active ? 'active' : '';
  return `
<nav class="uni-nav" aria-label="University navigation">
  <div class="container uni-nav-inner">
    <a href="${BASE}/" class="uni-brand" aria-label="ZopDev University home">
      <svg class="uni-brand-mark" viewBox="0 0 32 32" aria-hidden="true"><use href="#mark-zopnight"/></svg>
      <span class="uni-brand-zop">ZopDev</span>
      <span class="uni-brand-uni">University</span>
    </a>
    <div class="uni-nav-links">
      <div class="uni-dropdown" data-uni-dropdown>
        <button class="uni-link uni-dropdown-toggle ${cls('courses')}" type="button"
                aria-expanded="false" aria-controls="uni-courses-menu">
          Courses
          <span class="uni-caret" aria-hidden="true"></span>
        </button>
        <div class="uni-dropdown-menu" id="uni-courses-menu" role="menu">
          <a href="${BASE}/foundations/" role="menuitem">Foundations</a>
          <a href="${BASE}/operator/" role="menuitem">Operator</a>
          <a href="${BASE}/engineer/" role="menuitem">Engineer</a>
          <a href="${BASE}/architect/" role="menuitem">Architect</a>
          <a href="${BASE}/finops-mastery/" role="menuitem">FinOps Mastery</a>
          <a href="${BASE}/devops-cost-discipline/" role="menuitem">DevOps Cost</a>
          <a href="${BASE}/ai-powered-cloud-ops/" role="menuitem">AI Ops</a>
        </div>
      </div>
      <div class="uni-dropdown" data-uni-dropdown>
        <button class="uni-link uni-dropdown-toggle ${cls('certifications')}" type="button"
                aria-expanded="false" aria-controls="uni-certs-menu">
          Certifications
          <span class="uni-caret" aria-hidden="true"></span>
        </button>
        <div class="uni-dropdown-menu" id="uni-certs-menu" role="menu">
          <a href="${BASE}/certifications/#operator" role="menuitem">Operator</a>
          <a href="${BASE}/certifications/#engineer" role="menuitem">Engineer</a>
          <a href="${BASE}/certifications/#architect" role="menuitem">Architect</a>
          <a href="${BASE}/certifications/operator/sample/" role="menuitem">Sample certificate</a>
          <a href="${BASE}/certifications/verify/" role="menuitem">Verify a credential</a>
        </div>
      </div>
      <a href="${BASE}/glossary/" class="uni-link ${cls('glossary')}">Glossary</a>
      <form class="uni-search" role="search" action="${BASE}/search/" method="get">
        <svg class="uni-search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5"/>
          <path d="M10.5 10.5 L14 14"/>
        </svg>
        <input class="uni-search-input" type="search" name="q" placeholder="Search 237 lessons" autocomplete="off" spellcheck="false" aria-label="Search lessons" />
        <kbd class="uni-search-key" aria-hidden="true">/</kbd>
        <div class="uni-search-panel" id="uni-search-panel" role="listbox" hidden></div>
      </form>
    </div>
  </div>
</nav>
<script>
(function(){
  var dds = document.querySelectorAll('[data-uni-dropdown]');
  if (!dds.length) return;
  function closeAll(){
    dds.forEach(function(d){
      d.querySelector('.uni-dropdown-toggle').setAttribute('aria-expanded','false');
      d.classList.remove('open');
    });
  }
  dds.forEach(function(dd){
    var btn = dd.querySelector('.uni-dropdown-toggle');
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') === 'true';
      closeAll();
      if (!open) {
        btn.setAttribute('aria-expanded','true');
        dd.classList.add('open');
      }
    });
  });
  document.addEventListener('click', function(e){
    var inside = false;
    dds.forEach(function(d){ if (d.contains(e.target)) inside = true; });
    if (!inside) closeAll();
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeAll();
  });
})();

/* Inline search · loads lessons.json once, live-filters into a small panel. */
(function(){
  var input = document.querySelector('.uni-search-input');
  var panel = document.getElementById('uni-search-panel');
  if (!input || !panel) return;
  var idx = null;
  function load(){
    if (idx) return Promise.resolve(idx);
    return fetch('${BASE}/assets/lessons.json').then(function(r){ return r.json(); }).then(function(j){ idx = j; return j; }).catch(function(){ idx = []; return []; });
  }
  function close(){ panel.hidden = true; panel.innerHTML = ''; }
  function render(matches, q){
    if (!matches.length) {
      panel.innerHTML = '<div class="uni-search-empty">No lessons match <strong>' + escapeText(q) + '</strong></div>';
      panel.hidden = false;
      return;
    }
    panel.innerHTML = matches.slice(0, 8).map(function(m){
      return '<a class="uni-search-hit" href="' + m.url + '">' +
        '<span class="uni-search-hit-code">' + escapeText(m.code || '') + '</span>' +
        '<span class="uni-search-hit-title">' + highlight(m.title, q) + '</span>' +
        (m.track ? '<span class="uni-search-hit-meta">' + escapeText(m.track) + '</span>' : '') +
        '</a>';
    }).join('');
    panel.hidden = false;
  }
  function escapeText(s){ return String(s).replace(/[&<>\"']/g, function(c){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'})[c]; }); }
  function highlight(s, q){
    var safe = escapeText(s);
    if (!q) return safe;
    var rx = new RegExp('(' + q.replace(/[.*+?^\${}()|[\\\\]\\\\\\\\]/g, '\\\\$&') + ')', 'ig');
    return safe.replace(rx, '<mark>$1</mark>');
  }
  function match(q, items){
    var ql = q.toLowerCase();
    return items.filter(function(i){
      return (i.title && i.title.toLowerCase().indexOf(ql) !== -1) || (i.body && i.body.toLowerCase().indexOf(ql) !== -1);
    });
  }
  input.addEventListener('focus', function(){ load(); });
  input.addEventListener('input', function(){
    var q = input.value.trim();
    if (q.length < 2) { close(); return; }
    load().then(function(items){ render(match(q, items), q); });
  });
  input.addEventListener('blur', function(){ setTimeout(close, 180); });
  document.addEventListener('keydown', function(e){
    if (e.key === '/' && document.activeElement !== input && !/INPUT|TEXTAREA/.test((document.activeElement||{}).tagName||'')) {
      e.preventDefault(); input.focus();
    }
    if (e.key === 'Escape') { input.blur(); close(); }
  });
})();
</script>`;
}

function nav(currentPath = '/resources/university/') {
  return `
<!-- OG marketing-site nav · mirror of /Users/zopdev/zopdev-site/index.html -->
<nav class="nav" aria-label="Primary navigation">
  <div class="container nav-inner">
    <a href="/" class="logo-lockup sm" aria-label="ZopDev">
      <svg viewBox="0 0 715 276"><use href="#logo-zopdev"/></svg>
    </a>
    <div class="nav-links" id="nav-links">
      <a href="/product/">Product <span class="nav-caret" aria-hidden="true"></span></a>
      <a href="/resources/" class="nav-active">Resources <span class="nav-caret" aria-hidden="true"></span></a>
      <a href="/pricing/">Pricing</a>
      <a href="/company/">Company <span class="nav-caret" aria-hidden="true"></span></a>
      <a href="/community/">Community</a>
    </div>
    <div class="nav-cta">
      <div class="nav-pg-wrap">
        <a class="chip-playground" href="/playground/" aria-haspopup="menu" aria-expanded="false">
          <span>Playground</span>
          <span class="nav-caret nav-pg-caret" aria-hidden="true"></span>
        </a>
        <div class="nav-pg-menu" role="menu" aria-label="Playground options">
          <a class="nav-pg-card nav-pg-card--night" href="/playground/#zopnight" role="menuitem">
            <span class="nav-pg-card-head">
              <span class="nav-pg-mark">
                <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><use href="#mark-zopnight"/></svg>
              </span>
              <span class="nav-pg-body">
                <span class="nav-pg-name">ZopNight playground</span>
                <span class="nav-pg-desc">Cost loop &middot; idle, schedules, anomalies</span>
              </span>
              <span class="nav-pg-arrow" aria-hidden="true">&rarr;</span>
            </span>
          </a>
          <a class="nav-pg-card nav-pg-card--day" href="/playground/#zopday" role="menuitem">
            <span class="nav-pg-card-head">
              <span class="nav-pg-mark">
                <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><use href="#mark-zopday"/></svg>
              </span>
              <span class="nav-pg-body">
                <span class="nav-pg-name">ZopDay playground</span>
                <span class="nav-pg-desc">Deploy loop &middot; clusters, datastores, push</span>
              </span>
              <span class="nav-pg-arrow" aria-hidden="true">&rarr;</span>
            </span>
          </a>
        </div>
      </div>
      <a class="sign" href="/signin/">Sign In</a>
      <a class="btn btn-accent" href="/book-demo/"><span>Book a Demo</span> <span class="arrow" aria-hidden="true">→</span></a>
    </div>
    <button class="nav-mobile-toggle" aria-label="Toggle menu" aria-expanded="false" aria-controls="nav-drawer"><span></span></button>
  </div>
</nav>
<div id="nav-drawer" class="nav-drawer" aria-hidden="true">
  <div class="nav-drawer-links">
    <a href="/product/">Product</a>
    <a href="/resources/">Resources</a>
    <a href="/pricing/">Pricing</a>
    <a href="/company/">Company</a>
    <a href="/community/">Community</a>
    <a href="/playground/">Playground</a>
  </div>
  <div class="nav-drawer-cta">
    <a href="/signin/" class="sign">Sign in</a>
    <a href="/book-demo/" class="btn btn-accent">Book a demo <span class="arrow">→</span></a>
  </div>
</div>
<script>
(function(){
  var t = document.querySelector('.nav-mobile-toggle');
  var d = document.getElementById('nav-drawer');
  if (!t || !d) return;
  t.addEventListener('click', function(){
    var open = t.getAttribute('aria-expanded') === 'true';
    t.setAttribute('aria-expanded', String(!open));
    d.setAttribute('aria-hidden', String(open));
    document.body.classList.toggle('drawer-open', !open);
  });
  d.addEventListener('click', function(e){
    if (e.target.tagName === 'A') {
      t.setAttribute('aria-expanded', 'false');
      d.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('drawer-open');
    }
  });
})();
</script>`;
}

function finalCTA() {
  return `
<section class="final">
  <div class="container">
    <div class="final-grid">
      <div>
        <div class="final-eyebrow">end · ready when you are</div>
        <h2>Start with the bill.</h2>
        <p class="final-tag">Foundations takes about five hours. The first lesson is nine minutes.</p>
        <p>Open curriculum. No login. No paywall. ${237} lessons across 7 courses, three publicly verifiable credentials. Read it on the train, take the exam on a Saturday, list the credential on your résumé Monday.</p>
        <div class="final-cta">
          <a class="btn btn-primary" href="${BASE}/foundations/">Read Foundations <span class="arrow">→</span></a>
          <a class="btn btn-secondary" href="${BASE}/certifications/">See the credentials <span class="arrow">→</span></a>
        </div>
        <div class="final-stats final-stats--inline">
          <div><strong>5h</strong>median time to finish Foundations</div>
          <div><strong>0</strong>logins, paywalls, or marketing forms</div>
          <div><strong>open</strong>curriculum, public credential verifier</div>
        </div>
      </div>
      <div class="final-aside" aria-hidden="true"></div>
    </div>
  </div>
</section>`;
}

function footer() {
  return `
${finalCTA()}
<footer class="footer">
  <div class="container">
    <div class="foot-grid foot-grid--equal">
      <div class="foot-col"><h3>product</h3><ul>
        <li><a href="/zopnight/">ZopNight</a></li>
        <li><a href="/zopday/">ZopDay</a></li>
        <li><a href="/kubernetes-view/">Kubernetes View</a></li>
        <li><a href="/zopcloud/">ZopCloud</a></li>
        <li><a href="/pricing/">Pricing</a></li>
      </ul></div>
      <div class="foot-col"><h3>resources</h3><ul>
        <li><a href="${BASE}/">University</a></li>
        <li><a href="/resources/blog/">Blog</a></li>
        <li><a href="/resources/ebooks/">Ebooks</a></li>
        <li><a href="/resources/customers/">Case studies</a></li>
        <li><a href="/resources/changelog/">Changelog</a></li>
      </ul></div>
      <div class="foot-col"><h3>university</h3><ul>
        <li><a href="${BASE}/foundations/">Foundations</a></li>
        <li><a href="${BASE}/operator/">Operator</a></li>
        <li><a href="${BASE}/engineer/">Engineer</a></li>
        <li><a href="${BASE}/architect/">Architect</a></li>
        <li><a href="${BASE}/certifications/">Certifications</a></li>
        <li><a href="${BASE}/certifications/verify/">Verify credential</a></li>
        <li><a href="${BASE}/glossary/">Glossary</a></li>
      </ul></div>
      <div class="foot-col"><h3>company</h3><ul>
        <li><a href="/company/about/">About</a></li>
        <li><a href="/company/careers/">Careers</a></li>
        <li><a href="/trust/">Trust</a></li>
        <li><a href="/community/">Community</a></li>
      </ul></div>
    </div>

    <div class="foot-globe">
      <div class="foot-globe-left">
        <a href="/" class="foot-globe-mark" aria-label="ZopDev">
          <svg class="foot-globe-logo" viewBox="0 0 715 276" aria-hidden="true">
            <use href="#logo-zopdev"/>
          </svg>
        </a>
        <div class="foot-globe-badges" aria-label="Compliance certifications">
          <span class="foot-globe-badge" aria-label="SOC 2 Type II">
            <svg viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <path d="M32 8 a24 24 0 0 1 24 24 v6 a24 24 0 0 1 -24 24 a24 24 0 0 1 -24 -24 v-6 a24 24 0 0 1 24 -24 z" fill="none" stroke="currentColor" stroke-width="1" opacity=".5"/>
              <path d="M22 32 l8 8 l14 -16" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="square" stroke-linejoin="miter"/>
            </svg>
            <span class="foot-globe-badge-label"><strong>SOC 2</strong> Type II</span>
          </span>
          <span class="foot-globe-badge" aria-label="ISO 27001:2022">
            <svg viewBox="0 0 64 64" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="6" width="52" height="52" fill="none" stroke="currentColor" stroke-width="1.5"/>
              <rect x="11" y="11" width="42" height="42" fill="none" stroke="currentColor" stroke-width="1" opacity=".5"/>
              <text x="32" y="29" font-family="Space Grotesk, monospace" font-size="9" fill="currentColor" text-anchor="middle" letter-spacing="2">ISO</text>
              <text x="32" y="42" font-family="Space Grotesk, sans-serif" font-size="11" font-weight="700" fill="currentColor" text-anchor="middle">27001</text>
              <line x1="14" y1="50" x2="50" y2="50" stroke="currentColor" stroke-width="1"/>
            </svg>
            <span class="foot-globe-badge-label"><strong>ISO 27001</strong> 2022</span>
          </span>
        </div>
      </div>
      <div class="foot-globe-right"></div>
    </div>

    <div class="foot-bottom foot-bottom-3">
      <div class="foot-copy">© <span data-year>2026</span> ZopDev · <a href="/trust/">privacy</a> · <a href="/trust/">terms</a></div>
      <div class="foot-mid">made with <svg viewBox="0 0 7 6" aria-hidden="true"><rect x="1" y="0" width="1" height="1"/><rect x="2" y="0" width="1" height="1"/><rect x="4" y="0" width="1" height="1"/><rect x="5" y="0" width="1" height="1"/><rect x="0" y="1" width="7" height="1"/><rect x="0" y="2" width="7" height="1"/><rect x="1" y="3" width="5" height="1"/><rect x="2" y="4" width="3" height="1"/><rect x="3" y="5" width="1" height="1"/></svg> by <a href="https://zop.dev" target="_blank" rel="noopener">zop.dev</a></div>
      <div class="foot-social">
        <a href="https://linkedin.com/company/zopdev">linkedin</a>
        <a href="https://twitter.com/zopdev">twitter</a>
        <a href="https://github.com/zopdev">github</a>
      </div>
    </div>
  </div>
</footer>

<!-- ABSORB the old footer markup below so it remains valid HTML. We render
     the canonical OG markup above, then close with a hidden placeholder so
     legacy classes still parse without showing anything. -->
<div style="display:none">
  <div class="footer-brand-col" aria-hidden="true">
    <a href="/" class="logo-lockup md footer-brand-lockup">
      <svg viewBox="0 0 715 276"><use href="#logo-zopdev"/></svg>
    </a>
    <p class="footer-tag"></p>
      <div class="footer-col">
        <h4>Product</h4>
        <ul>
          <li><a href="/zopnight/">ZopNight</a></li>
          <li><a href="/zopday/">ZopDay</a></li>
          <li><a href="/kubernetes-view/">Kubernetes View</a></li>
          <li><a href="/zopcloud/">ZopCloud</a></li>
          <li><a href="/pricing/">Pricing</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Resources</h4>
        <ul>
          <li><a href="${BASE}/">University</a></li>
          <li><a href="/resources/blog/">Blog</a></li>
          <li><a href="/resources/ebooks/">Ebooks</a></li>
          <li><a href="/resources/case-studies/">Case studies</a></li>
          <li><a href="/resources/docs/">Documentation</a></li>
          <li><a href="/resources/changelog/">Changelog</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>University</h4>
        <ul>
          <li><a href="${BASE}/foundations/">Foundations</a></li>
          <li><a href="${BASE}/operator/">Operator</a></li>
          <li><a href="${BASE}/engineer/">Engineer</a></li>
          <li><a href="${BASE}/architect/">Architect</a></li>
          <li><a href="${BASE}/certifications/">Certifications</a></li>
          <li><a href="${BASE}/certifications/verify/">Verify a credential</a></li>
          <li><a href="${BASE}/glossary/">Glossary</a></li>
          <li><a href="${BASE}/search/">Search</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="/company/about/">About</a></li>
          <li><a href="/company/careers/">Careers</a></li>
          <li><a href="/trust/">Trust</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Community</h4>
        <ul>
          <li><a href="/community/">Slack</a></li>
          <li><a href="https://twitter.com/zopdev" target="_blank" rel="noopener">Twitter</a></li>
          <li><a href="https://github.com/zopdev" target="_blank" rel="noopener">GitHub</a></li>
          <li><a href="https://linkedin.com/company/zopdev" target="_blank" rel="noopener">LinkedIn</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <div>© 2026 ZopDev / All rights reserved</div>
      <div class="footer-bottom-links">
        <a href="/terms/">Terms</a>
        <a href="/privacy/">Privacy</a>
        <a href="/security/">Security</a>
      </div>
    </div>
  </div>
</footer>
</div>`;
}

// =============================================================
// LAYOUT
// =============================================================
function pageHTML({
  title,
  description,
  canonical,
  ogImage,
  schema,
  bodyClass = '',
  uniNav = 'courses',
  hideUniNav = false,
  body,
}) {
  const ogDesc = description || 'Cloud cost optimization curriculum. 237 lessons across 7 courses. Operator, Engineer, Architect certifications.';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHTML(title)}</title>
<meta name="description" content="${escapeHTML(ogDesc)}">
<link rel="canonical" href="${canonical}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta name="author" content="ZopDev University editorial board">

<!-- Open Graph -->
<meta property="og:type" content="article">
<meta property="og:site_name" content="ZopDev University">
<meta property="og:title" content="${escapeHTML(title)}">
<meta property="og:description" content="${escapeHTML(ogDesc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${ogImage || 'https://zop.dev/resources/university/og/default.png'}">
<meta property="og:locale" content="en_US">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@zopdev">
<meta name="twitter:title" content="${escapeHTML(title)}">
<meta name="twitter:description" content="${escapeHTML(ogDesc)}">

${schema || ''}

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${BASE}/assets/styles.css">
<link rel="icon" type="image/svg+xml" href="${BASE}/assets/favicon.svg">
<script>
  // Site is dark-mode-only — lock the theme attribute before paint.
  document.documentElement.setAttribute('data-theme', 'dark');
</script>
</head>
<body class="${bodyClass}">
<a href="#main" class="skip-link">Skip to content</a>

<!-- Brand-mark symbol defs · canonical from zop.dev homepage. Defined once
     per page so any <use href="#mark-zopnight"> / <use href="#logo-zopdev">
     in nav, footer, or content resolves correctly. -->
<svg width="0" height="0" style="position:absolute;overflow:hidden" aria-hidden="true" focusable="false">
  <defs>
    <symbol id="mark-zopnight" viewBox="0 0 32 32">
      <rect width="32" height="32" fill="#2A4494"/>
      <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
    </symbol>
    <symbol id="mark-zopday" viewBox="0 0 32 32">
      <rect width="32" height="32" fill="#F58549"/>
      <circle cx="16" cy="16" r="8" fill="#FFFFFF"/>
    </symbol>
    <symbol id="mark-zopcloud" viewBox="0 0 32 32">
      <rect width="32" height="32" fill="#2A4494"/>
      <rect x="12" y="8"  width="8"  height="6"  fill="#FFFFFF"/>
      <rect x="6"  y="14" width="20" height="10" fill="#FFFFFF"/>
    </symbol>
    <symbol id="logo-zopdev" viewBox="0 0 715 276">
      <path d="M7.452 229V201.784L63.504 137.308V134.716H9.072V115.6H85.86V142.816L29.808 207.292V209.884H86.184V229H7.452ZM136.786 231.268C128.794 231.268 121.612 229.648 115.24 226.408C108.868 223.168 103.846 218.47 100.174 212.314C96.5022 206.158 94.6662 198.76 94.6662 190.12V187.528C94.6662 178.888 96.5022 171.49 100.174 165.334C103.846 159.178 108.868 154.48 115.24 151.24C121.612 148 128.794 146.38 136.786 146.38C144.778 146.38 151.96 148 158.332 151.24C164.704 154.48 169.726 159.178 173.398 165.334C177.07 171.49 178.906 178.888 178.906 187.528V190.12C178.906 198.76 177.07 206.158 173.398 212.314C169.726 218.47 164.704 223.168 158.332 226.408C151.96 229.648 144.778 231.268 136.786 231.268ZM136.786 213.124C143.05 213.124 148.234 211.126 152.338 207.13C156.442 203.026 158.494 197.194 158.494 189.634V188.014C158.494 180.454 156.442 174.676 152.338 170.68C148.342 166.576 143.158 164.524 136.786 164.524C130.522 164.524 125.338 166.576 121.234 170.68C117.13 174.676 115.078 180.454 115.078 188.014V189.634C115.078 197.194 117.13 203.026 121.234 207.13C125.338 211.126 130.522 213.124 136.786 213.124ZM192.888 261.4V148.648H212.976V158.368H215.892C217.728 155.236 220.59 152.482 224.478 150.106C228.366 147.622 233.928 146.38 241.164 146.38C247.644 146.38 253.638 148 259.146 151.24C264.654 154.372 269.082 159.016 272.43 165.172C275.778 171.328 277.452 178.78 277.452 187.528V190.12C277.452 198.868 275.778 206.32 272.43 212.476C269.082 218.632 264.654 223.33 259.146 226.57C253.638 229.702 247.644 231.268 241.164 231.268C236.304 231.268 232.2 230.674 228.852 229.486C225.612 228.406 222.966 227.002 220.914 225.274C218.97 223.438 217.404 221.602 216.216 219.766H213.3V261.4H192.888ZM235.008 213.448C241.38 213.448 246.618 211.45 250.722 207.454C254.934 203.35 257.04 197.41 257.04 189.634V188.014C257.04 180.238 254.934 174.352 250.722 170.356C246.51 166.252 241.272 164.2 235.008 164.2C228.744 164.2 223.506 166.252 219.294 170.356C215.082 174.352 212.976 180.238 212.976 188.014V189.634C212.976 197.41 215.082 203.35 219.294 207.454C223.506 211.45 228.744 213.448 235.008 213.448ZM287.446 229V210.208H302.35V134.392H287.446V115.6H334.102C349.33 115.6 360.886 119.488 368.77 127.264C376.762 134.932 380.758 146.38 380.758 161.608V182.992C380.758 198.22 376.762 209.722 368.77 217.498C360.886 225.166 349.33 229 334.102 229H287.446ZM323.734 209.56H334.426C343.066 209.56 349.384 207.292 353.38 202.756C357.376 198.22 359.374 191.848 359.374 183.64V160.96C359.374 152.644 357.376 146.272 353.38 141.844C349.384 137.308 343.066 135.04 334.426 135.04H323.734V209.56ZM430.981 231.268C422.989 231.268 415.915 229.594 409.759 226.246C403.711 222.79 398.959 217.984 395.503 211.828C392.155 205.564 390.481 198.22 390.481 189.796V187.852C390.481 179.428 392.155 172.138 395.503 165.982C398.851 159.718 403.549 154.912 409.597 151.564C415.645 148.108 422.665 146.38 430.657 146.38C438.541 146.38 445.399 148.162 451.231 151.726C457.063 155.182 461.599 160.042 464.839 166.306C468.079 172.462 469.699 179.644 469.699 187.852V194.818H411.217C411.433 200.326 413.485 204.808 417.373 208.264C421.261 211.72 426.013 213.448 431.629 213.448C437.353 213.448 441.565 212.206 444.265 209.722C446.965 207.238 449.017 204.484 450.421 201.46L467.107 210.208C465.595 213.016 463.381 216.094 460.465 219.442C457.657 222.682 453.877 225.49 449.125 227.866C444.373 230.134 438.325 231.268 430.981 231.268ZM411.379 179.59H448.963C448.531 174.946 446.641 171.22 443.293 168.412C440.053 165.604 435.787 164.2 430.495 164.2C424.987 164.2 420.613 165.604 417.373 168.412C414.133 171.22 412.135 174.946 411.379 179.59ZM497.482 229L471.886 148.648H493.594L512.224 214.096H515.14L533.77 148.648H555.478L529.882 229H497.482Z" fill="currentColor"/>
      <rect x="537" width="89" height="89" fill="#2A4494"/>
      <rect x="626" width="89" height="89" fill="#F58549"/>
      <rect x="626" y="89" width="89" height="89" fill="#7FB236"/>
    </symbol>
  </defs>
</svg>

${nav()}
${hideUniNav ? '' : universityNav({ active: uniNav })}
<main id="main">
${body}
</main>
${footer()}
</body>
</html>`;
}

// =============================================================
// JSON-LD SCHEMAS
// =============================================================
function landingSchema() {
  return `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "EducationalOccupationalProgram",
  "name": "ZopDev University",
  "description": "Cloud cost optimization curriculum. 237 lessons across 7 courses. Operator, Engineer, Architect certifications.",
  "url": "https://zop.dev/resources/university/",
  "provider": { "@type": "Organization", "name": "ZopDev", "url": "https://zop.dev" },
  "inLanguage": "en-US",
  "occupationalCategory": ["Platform Engineer", "FinOps Analyst", "Engineering Leader", "Cloud Architect"],
  "educationalCredentialAwarded": [
    {"@type": "EducationalOccupationalCredential", "name": "ZopNight Operator", "credentialCategory": "certification"},
    {"@type": "EducationalOccupationalCredential", "name": "ZopNight Engineer", "credentialCategory": "certification"},
    {"@type": "EducationalOccupationalCredential", "name": "ZopNight Architect", "credentialCategory": "certification"}
  ],
  "numberOfCredits": 237,
  "timeToComplete": "P45H",
}, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "ZopDev", "item": "https://zop.dev/"},
    {"@type": "ListItem", "position": 2, "name": "Resources", "item": "https://zop.dev/resources/"},
    {"@type": "ListItem", "position": 3, "name": "University", "item": "https://zop.dev/resources/university/"}
  ]
}, null, 2)}
</script>`;
}

function trackSchema(track) {
  return `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Course",
  "name": track.title,
  "description": track.desc,
  "courseCode": track.code,
  "url": `https://zop.dev/resources/university/${track.slug}/`,
  "provider": { "@type": "Organization", "name": "ZopDev" },
  "inLanguage": "en-US",
  "timeRequired": "PT" + track.time.replace(' hours', 'H'),
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "online",
    "courseWorkload": "PT" + track.time.replace(' hours', 'H')
  }
}, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "ZopDev", "item": "https://zop.dev/"},
    {"@type": "ListItem", "position": 2, "name": "Resources", "item": "https://zop.dev/resources/"},
    {"@type": "ListItem", "position": 3, "name": "University", "item": "https://zop.dev/resources/university/"},
    {"@type": "ListItem", "position": 4, "name": track.title, "item": `https://zop.dev/resources/university/${track.slug}/`}
  ]
}, null, 2)}
</script>`;
}

function lessonSchema(track, mod, lesson) {
  return `<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "LearningResource",
  "name": lesson.title,
  "description": lesson.outcome || lesson.title,
  "url": `https://zop.dev/resources/university/${track.slug}/${mod.slug}/${lesson.slug}/`,
  "learningResourceType": "Lesson",
  "educationalLevel": track.tier,
  "timeRequired": "PT9M",
  "inLanguage": "en-US",
  "isPartOf": {
    "@type": "Course",
    "name": track.title,
    "url": `https://zop.dev/resources/university/${track.slug}/`
  },
  "provider": { "@type": "Organization", "name": "ZopDev" }
}, null, 2)}
</script>
<script type="application/ld+json">
${JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "ZopDev", "item": "https://zop.dev/"},
    {"@type": "ListItem", "position": 2, "name": "Resources", "item": "https://zop.dev/resources/"},
    {"@type": "ListItem", "position": 3, "name": "University", "item": "https://zop.dev/resources/university/"},
    {"@type": "ListItem", "position": 4, "name": track.title, "item": `https://zop.dev/resources/university/${track.slug}/`},
    {"@type": "ListItem", "position": 5, "name": mod.title, "item": `https://zop.dev/resources/university/${track.slug}/${mod.slug}/`},
    {"@type": "ListItem", "position": 6, "name": lesson.title, "item": `https://zop.dev/resources/university/${track.slug}/${mod.slug}/${lesson.slug}/`}
  ]
}, null, 2)}
</script>`;
}

// =============================================================
// PAGE BUILDERS
// =============================================================
function renderLanding(tracks) {
  const totalLessons = tracks.reduce((sum, t) => sum + t.modules.reduce((s, m) => s + m.lessons.length, 0), 0);
  const totalModules = tracks.reduce((sum, t) => sum + t.modules.length, 0);

  const tByCode = Object.fromEntries(tracks.map(t => [t.code, t]));
  const lessonCountFor = (t) => t.modules.reduce((s, m) => s + m.lessons.length, 0);

  // Track card (used in catalog rows). Compact, equal-size grid cells per
  // Stripe.training catalog pattern. Each card carries: level chip, title,
  // description, module/lesson/time meta.
  const trackCard = (t, opts = {}) => {
    const lc = lessonCountFor(t);
    const persona = t.audience;
    const extraCls = opts.featured ? ' track-card-featured' : '';
    return `<a href="${BASE}/${t.slug}/" class="track-card${extraCls}">
  <div class="track-card-head">
    <span class="track-card-code">${escapeHTML(t.code)}</span>
    <span class="track-card-tier">${escapeHTML(t.tier)}</span>
  </div>
  <h3 class="track-card-title">${escapeHTML(t.title)}</h3>
  <p class="track-card-desc">${escapeHTML(t.desc)}</p>
  <div class="track-card-meta">
    <div><span class="meta-key">Audience</span><span class="meta-val">${escapeHTML(persona)}</span></div>
    <div><span class="meta-key">Modules</span><span class="meta-val">${t.modules.length}</span></div>
    <div><span class="meta-key">Lessons</span><span class="meta-val">${lc}</span></div>
    <div><span class="meta-key">Time</span><span class="meta-val">${escapeHTML(t.time)}</span></div>
  </div>
</a>`;
  };

  const t0 = tByCode['T0'];
  const otherTracks = ['T1','T2','T3','T4','T5','T6'].map(c => tByCode[c]).filter(Boolean);

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <span class="current">University</span>
  </div>
</section>

<!-- HERO — pure typography, no side stats grid -->
<section class="lp-hero">
  <div class="container">
    <div class="lp-hero-eyebrow"><span class="eyebrow-square" aria-hidden="true"></span>ZopDev University</div>
    <h1 class="lp-hero-title">Cloud cost,<br>understood end&#x2011;to&#x2011;end.</h1>
    <p class="lp-hero-lead">A free, open curriculum from the team that builds <a href="/zopnight/">ZopNight</a>. ${totalLessons} lessons across ${tracks.length} courses. Read your first cloud bill in an afternoon. Earn a credential a hiring manager recognizes by the end of the quarter.</p>
    <div class="lp-hero-cta">
      <a href="${BASE}/foundations/" class="btn btn-primary">Start with Foundations <span class="arrow">→</span></a>
      <a href="${BASE}/certifications/" class="btn btn-secondary">Get certified</a>
    </div>
  </div>
</section>

<!-- PROOF STRIP — full-width band with the four big numbers -->
<section class="lp-proof">
  <div class="container">
    <div class="lp-proof-grid">
      <div class="lp-proof-cell">
        <div class="lp-proof-num">${totalLessons}</div>
        <div class="lp-proof-lbl">Lessons</div>
      </div>
      <div class="lp-proof-cell">
        <div class="lp-proof-num">${tracks.length}</div>
        <div class="lp-proof-lbl">Courses</div>
      </div>
      <div class="lp-proof-cell">
        <div class="lp-proof-num">3</div>
        <div class="lp-proof-lbl">Certifications</div>
      </div>
      <div class="lp-proof-cell">
        <div class="lp-proof-num">Free</div>
        <div class="lp-proof-lbl">Open, no login</div>
      </div>
    </div>
  </div>
</section>

<!-- WHO IT'S FOR — three personas, single confident row -->
<section class="lp-personas">
  <div class="container">
    <div class="lp-section-head">
      <h2 class="lp-h2">Built for the three people who actually own cloud cost.</h2>
    </div>
    <div class="lp-persona-grid">
      <a href="${BASE}/operator/" class="lp-persona">
        <div class="lp-persona-num">01</div>
        <h3 class="lp-persona-title">Operator</h3>
        <p class="lp-persona-body">You run the tooling. Connect clouds, build schedules, route alerts, audit actions. The credential says: hand them ZopNight, they'll ship.</p>
        <span class="lp-persona-link">See the Operator course<span class="lp-arrow" aria-hidden="true"></span></span>
      </a>
      <a href="${BASE}/engineer/" class="lp-persona">
        <div class="lp-persona-num">02</div>
        <h3 class="lp-persona-title">Engineer</h3>
        <p class="lp-persona-body">You ship cost-aware systems. Rule library, K8s scheduling, event pre-scaling, ML inference optimization. The depth tier for people who build.</p>
        <span class="lp-persona-link">See the Engineer course<span class="lp-arrow" aria-hidden="true"></span></span>
      </a>
      <a href="${BASE}/architect/" class="lp-persona">
        <div class="lp-persona-num">03</div>
        <h3 class="lp-persona-title">Architect</h3>
        <p class="lp-persona-body">You own the practice. Multi-org RBAC, audit log architecture, SOC 2 / ISO posture, FinOps Foundation framework, AI-driven ops.</p>
        <span class="lp-persona-link">See the Architect course<span class="lp-arrow" aria-hidden="true"></span></span>
      </a>
    </div>
  </div>
</section>

<!-- CATALOG — single grid, Foundations as featured, then 6 cards -->
<section class="lp-catalog">
  <div class="container">
    <div class="lp-section-head lp-section-head-row">
      <div>
        <div class="lp-section-eyebrow"><span class="eyebrow-square" aria-hidden="true"></span>Courses</div>
        <h2 class="lp-h2">Seven courses. Start anywhere.</h2>
      </div>
      <p class="lp-section-sub">Linear if you want it, à la carte if you don't. Every lesson stands alone. Foundations is the prerequisite for the three credentials.</p>
    </div>
    <a href="${BASE}/${t0.slug}/" class="lp-foundations">
      <div class="lp-foundations-tag">Prerequisite</div>
      <div class="lp-foundations-body">
        <div class="lp-foundations-code">${escapeHTML(t0.code)}</div>
        <h3 class="lp-foundations-title">${escapeHTML(t0.title)}</h3>
        <p class="lp-foundations-desc">${escapeHTML(t0.desc)}</p>
        <div class="lp-foundations-meta">
          <span><strong>${t0.modules.length}</strong> modules</span>
          <span><strong>${lessonCountFor(t0)}</strong> lessons</span>
          <span><strong>${escapeHTML(t0.time)}</strong></span>
          <span><strong>${escapeHTML(t0.audience)}</strong></span>
        </div>
      </div>
      <div class="lp-foundations-cta">
        Start here<span class="lp-arrow" aria-hidden="true"></span>
      </div>
    </a>
    <div class="lp-catalog-grid">
      ${otherTracks.map((t) => {
        const lc = lessonCountFor(t);
        return `<a href="${BASE}/${t.slug}/" class="lp-program">
  <div class="lp-program-head">
    <span class="lp-program-code">${escapeHTML(t.code)}</span>
    <span class="lp-program-tier">${escapeHTML(t.tier)}</span>
  </div>
  <h3 class="lp-program-title">${escapeHTML(t.title)}</h3>
  <p class="lp-program-desc">${escapeHTML(t.desc)}</p>
  <div class="lp-program-foot">
    <span>${t.modules.length} mod / ${lc} lessons / ${escapeHTML(t.time)}</span>
    <span class="lp-arrow" aria-hidden="true"></span>
  </div>
</a>`;
      }).join('\n')}
    </div>
  </div>
</section>

<!-- CERTIFICATIONS — glorified, big seals as the visual hero -->
<section class="lp-certs">
  <div class="container">
    <div class="lp-section-head">
      <div class="lp-section-eyebrow"><span class="eyebrow-square" aria-hidden="true"></span>Certifications</div>
      <h2 class="lp-h2">Three credentials. Publicly verifiable.</h2>
      <p class="lp-section-sub">Each certification verifies a real on-the-job capability. Pass the proctored exam, get a <a href="${BASE}/certifications/verify/">credential a hiring manager can verify in two clicks</a> — paste an ID, see holder + tier + issue date. No login, no marketing wall.</p>
    </div>
    <div class="lp-cert-row">
      <a href="${BASE}/certifications/#operator" class="lp-cert-card">
        <div class="lp-cert-seal-wrap">${certSeal('operator', { size: 'large' })}</div>
        <div class="lp-cert-tier">Tier I</div>
        <h3 class="lp-cert-name">ZopNight Operator</h3>
        <p class="lp-cert-blurb">Run ZopNight in production. Connect, schedule, route, audit.</p>
        <div class="lp-cert-stats"><span>30-min exam</span><span>80% to pass</span></div>
      </a>
      <a href="${BASE}/certifications/#engineer" class="lp-cert-card">
        <div class="lp-cert-seal-wrap">${certSeal('engineer', { size: 'large' })}</div>
        <div class="lp-cert-tier">Tier II</div>
        <h3 class="lp-cert-name">ZopNight Engineer</h3>
        <p class="lp-cert-blurb">Shape the cost surface. Rules, K8s scheduling, ML inference.</p>
        <div class="lp-cert-stats"><span>45-min exam</span><span>80% to pass</span></div>
      </a>
      <a href="${BASE}/certifications/#architect" class="lp-cert-card">
        <div class="lp-cert-seal-wrap">${certSeal('architect', { size: 'large' })}</div>
        <div class="lp-cert-tier">Tier III</div>
        <h3 class="lp-cert-name">ZopNight Architect</h3>
        <p class="lp-cert-blurb">Own the practice. RBAC, audit, FinOps framework, AI ops.</p>
        <div class="lp-cert-stats"><span>60-min exam</span><span>75% to pass</span></div>
      </a>
    </div>
    <div class="lp-cert-cta">
      <a href="${BASE}/certifications/" class="btn btn-primary">Browse certifications <span class="arrow">→</span></a>
      <a href="${BASE}/certifications/operator/sample/" class="btn-ghost">See a sample certificate</a>
      <a href="${BASE}/certifications/verify/" class="btn-ghost">Verify a credential</a>
    </div>
  </div>
</section>

<!-- AUTHORED-BY band — credibility -->
<section class="lp-authored">
  <div class="container">
    <div class="lp-authored-grid">
      <div class="lp-authored-copy">
        <div class="lp-section-eyebrow"><span class="eyebrow-square" aria-hidden="true"></span>Authored by</div>
        <p class="lp-authored-headline">Written by the engineers, FinOps practitioners, and platform leads who build ZopNight.</p>
        <p class="lp-authored-body">Every lesson is reviewed by the ZopDev University Editorial Board. Same standard as production runbooks. Last reviewed May 2026. Updated continuously.</p>
      </div>
      <div class="lp-authored-badges">
        <div class="lp-badge">SOC 2 Type II</div>
        <div class="lp-badge">ISO 27001:2022</div>
        <div class="lp-badge">FinOps Foundation aligned</div>
      </div>
    </div>
  </div>
</section>

<!-- Final CTA · the global OG .final section in pageHTML now serves this slot. -->`;

  return pageHTML({
    title: 'ZopDev University / The operating manual for cloud cost teams',
    description: `Seven courses, ${totalLessons} lessons, three certifications. Cloud cost optimization curriculum from the team that builds ZopNight. From foundations to AI-powered ops.`,
    canonical: 'https://zop.dev/resources/university/',
    schema: landingSchema(),
    body,
  });
}

function renderTrack(track) {
  const totalLessons = track.modules.reduce((s, m) => s + m.lessons.length, 0);

  const moduleList = track.modules.map((m, idx) => {
    const titleCased = m.title.replace(/^\w/, c => c.toUpperCase());
    const desc = stripMarkdown(m.desc || (m.lessons[0]?.outcome || '')).slice(0, 200);
    const mins = m.lessons.length * 9;
    return `<a href="${BASE}/${track.slug}/${m.slug}/" class="m-row" data-mod="${idx + 1}">
  <span class="m-row-code">${escapeHTML(m.code)}</span>
  <div class="m-row-body">
    <h3 class="m-row-title">${escapeHTML(titleCased)}</h3>
    ${desc ? `<p class="m-row-desc">${escapeHTML(desc)}</p>` : ''}
  </div>
  <div class="m-row-meta">
    <span class="m-row-meta-num">${m.lessons.length}</span>
    <span class="m-row-meta-unit">lessons</span>
    <span class="m-row-meta-sep" aria-hidden="true">·</span>
    <span class="m-row-meta-num">~${mins}</span>
    <span class="m-row-meta-unit">min</span>
  </div>
  <span class="m-row-arrow" aria-hidden="true">→</span>
</a>`;
  }).join('\n');

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <span class="current">${escapeHTML(track.title)}</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">${escapeHTML(track.eyebrow)}</div>
    <h1>${escapeHTML(track.title)}</h1>
    <p class="track-hero-lead">${escapeHTML(track.desc)}</p>
    <div class="track-meta-row">
      <div class="item"><strong>Tier</strong>${escapeHTML(track.tier)}</div>
      <div class="item"><strong>Audience</strong>${escapeHTML(track.audience)}</div>
      <div class="item"><strong>Modules</strong>${track.modules.length}</div>
      <div class="item"><strong>Lessons</strong>${totalLessons}</div>
      <div class="item"><strong>Time</strong>${escapeHTML(track.time)}</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">Modules</div>
      <div>
        <h2>${track.modules.length} modules. ${totalLessons} lessons.</h2>
        <p class="sub">Linear is the recommended order; each module also stands alone.</p>
      </div>
    </div>
    <div class="module-list">
      ${moduleList}
    </div>
  </div>
</section>

<section class="track-next">
  <div class="container">
    <div class="track-next-grid">
      <div class="track-next-copy">
        <div class="track-next-eyebrow">Start here</div>
        <h2>Ready to dig in?</h2>
        <p>The first lesson is the foundation of everything that follows. Nine minutes. No login.</p>
        <div class="track-next-cta">
          <a href="${BASE}/${track.slug}/${track.modules[0]?.slug}/${track.modules[0]?.lessons[0]?.slug}/" class="btn btn-primary">Start Module 1 <span class="arrow">→</span></a>
          <a href="${BASE}/" class="btn-ghost">All courses <span class="arrow">→</span></a>
        </div>
      </div>
      <a class="track-next-card" href="${BASE}/${track.slug}/${track.modules[0]?.slug}/${track.modules[0]?.lessons[0]?.slug}/">
        <div class="track-next-card-head">
          <span class="track-next-card-code">${escapeHTML(track.modules[0]?.code || 'M1')} · L1</span>
          <span class="track-next-card-time">~9 min</span>
        </div>
        <h3 class="track-next-card-title">${escapeHTML(track.modules[0]?.lessons[0]?.title || 'Open the first lesson')}</h3>
        <p class="track-next-card-outcome">${escapeHTML(stripMarkdown(track.modules[0]?.lessons[0]?.outcome || `The opening lesson of ${track.title.toLowerCase()}.`).slice(0, 180))}</p>
        <div class="track-next-card-foot">
          <span>Open lesson</span>
          <span class="track-next-card-arrow" aria-hidden="true">→</span>
        </div>
      </a>
    </div>
  </div>
</section>`;

  return pageHTML({
    title: `${track.title} / ZopDev University`,
    description: track.desc,
    canonical: `https://zop.dev/resources/university/${track.slug}/`,
    schema: trackSchema(track),
    body,
  });
}

function renderModule(track, mod) {
  const lessonList = mod.lessons.map(l => `<a href="${BASE}/${track.slug}/${mod.slug}/${l.slug}/" class="m-row m-row--lesson">
  <span class="m-row-code">${escapeHTML(l.code)}</span>
  <div class="m-row-body">
    <h3 class="m-row-title">${escapeHTML(l.title)}</h3>
    ${l.outcome ? `<p class="m-row-desc">${escapeHTML(stripMarkdown(l.outcome).slice(0, 160))}</p>` : ''}
  </div>
  <div class="m-row-meta">
    <span class="m-row-meta-num">~9</span>
    <span class="m-row-meta-unit">min</span>
  </div>
  <span class="m-row-arrow" aria-hidden="true">→</span>
</a>`).join('\n');

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <a href="${BASE}/${track.slug}/">${escapeHTML(track.short)}</a><span class="sep">›</span>
    <span class="current">${escapeHTML(mod.title)}</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">${escapeHTML(track.code)} / ${escapeHTML(mod.code)}</div>
    <h1>${escapeHTML(mod.title)}</h1>
    <p class="track-hero-lead">${escapeHTML(mod.desc || `${mod.lessons.length} lessons covering the practical patterns for ${mod.title.toLowerCase()}.`)}</p>
    <div class="track-meta-row">
      <div class="item"><strong>Module</strong>${escapeHTML(mod.code)}</div>
      <div class="item"><strong>Lessons</strong>${mod.lessons.length}</div>
      <div class="item"><strong>Time</strong>~${mod.lessons.length * 9} minutes</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">Lessons</div>
      <div>
        <h2>${mod.lessons.length} lessons.</h2>
        <p class="sub">Read in order, or jump to what you need.</p>
      </div>
    </div>
    <div class="lesson-list">
      ${lessonList}
    </div>
  </div>
</section>`;

  return pageHTML({
    title: `${mod.title} / ${track.title} / ZopDev University`,
    description: mod.desc || `${mod.lessons.length} lessons covering ${mod.title.toLowerCase()}.`,
    canonical: `https://zop.dev/resources/university/${track.slug}/${mod.slug}/`,
    body,
  });
}

function renderLesson(track, mod, lesson, prevLesson, nextLesson) {
  const contentHTML = renderMarkdown(lesson.raw);

  // Sidebar: all lessons in this module
  const sidebarLessons = mod.lessons.map(l => `
<a href="${BASE}/${track.slug}/${mod.slug}/${l.slug}/" class="${l.code === lesson.code ? 'current' : ''}">
  <span class="num">${l.code}</span>
  <span>${escapeHTML(l.title.length > 40 ? l.title.slice(0, 38) + '…' : l.title)}</span>
</a>`).join('');

  // Metadata box. Values come from the authored frontmatter table; we
  // sweep middle dots to slashes at render time so chrome stays
  // brand-compliant without modifying the source .md file.
  const metaRows = Object.entries(lesson.meta || {}).map(([k, v]) => `
<dt>${escapeHTML(k)}</dt>
<dd>${escapeHTML(String(v).replace(/\s*[·]\s*/g, ' / '))}</dd>`).join('');

  // Prev/next
  const prevHTML = prevLesson
    ? `<a href="${BASE}/${prevLesson.trackSlug}/${prevLesson.modSlug}/${prevLesson.lesson.slug}/" class="lesson-nav-link">
  <div class="nav-dir">← Previous</div>
  <div class="nav-title">${escapeHTML(prevLesson.lesson.title)}</div>
</a>`
    : `<div class="lesson-nav-link lesson-nav-empty">
  <div class="nav-dir">Start of module</div>
  <div class="nav-title">${escapeHTML(mod.title)}</div>
</div>`;

  const nextHTML = nextLesson
    ? `<a href="${BASE}/${nextLesson.trackSlug}/${nextLesson.modSlug}/${nextLesson.lesson.slug}/" class="lesson-nav-link lesson-nav-next">
  <div class="nav-dir">Next</div>
  <div class="nav-title">${escapeHTML(nextLesson.lesson.title)}</div>
</a>`
    : `<a href="${BASE}/${track.slug}/" class="lesson-nav-link lesson-nav-next">
  <div class="nav-dir">Module complete</div>
  <div class="nav-title">Back to ${escapeHTML(track.title)}</div>
</a>`;

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <a href="${BASE}/${track.slug}/">${escapeHTML(track.short)}</a><span class="sep">›</span>
    <a href="${BASE}/${track.slug}/${mod.slug}/">${escapeHTML(mod.title)}</a><span class="sep">›</span>
    <span class="current">${escapeHTML(lesson.title)}</span>
  </div>
</section>

<div class="container">
  <div class="lesson-layout">
    <aside class="lesson-sidebar" aria-label="Module navigation">
      <h4>${escapeHTML(mod.title)}</h4>
      <nav>${sidebarLessons}</nav>
    </aside>

    <article class="lesson-content">
      <header class="lesson-header">
        <div class="lesson-id">
          <span>${escapeHTML(formatLessonSignature(lesson.signature) || `${track.code} / ${mod.code} / ${lesson.code}`)}</span>
        </div>
        <h1>${escapeHTML(lesson.title)}</h1>
      </header>
      ${lesson.outcome ? `<div class="lesson-outcome"><div class="lesson-outcome-label">Outcome</div><p>${renderInlineBasic(lesson.outcome)}</p></div>` : ''}
      ${metaRows ? `<div class="lesson-metabox"><dl>${metaRows}</dl></div>` : ''}
      ${contentHTML}

      <nav class="lesson-nav" aria-label="Lesson navigation">
        ${prevHTML}
        ${nextHTML}
      </nav>
    </article>

    <aside class="lesson-toc" aria-label="On this page">
      <h4>On this page</h4>
      <ul id="lesson-toc-list"></ul>
    </aside>
  </div>
</div>

<script>
// Generate TOC from rendered h2s
document.addEventListener('DOMContentLoaded', function() {
  const tocList = document.getElementById('lesson-toc-list');
  if (!tocList) return;
  const headings = document.querySelectorAll('.lesson-content h2');
  headings.forEach(h => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    li.appendChild(a);
    tocList.appendChild(li);
  });
});
</script>`;

  return pageHTML({
    title: `${lesson.title} / ${track.title} / ZopDev University`,
    description: lesson.outcome || `${track.title} / ${mod.title} / ${lesson.title}`,
    canonical: `https://zop.dev/resources/university/${track.slug}/${mod.slug}/${lesson.slug}/`,
    schema: lessonSchema(track, mod, lesson),
    body,
  });
}

// =============================================================
// MAIN BUILD
// =============================================================
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
}

console.log('🔨 Building ZopDev University...\n');

const tracks = collectTracks();
let pageCount = 0;
const allLessonsForSearch = [];

// Build flat lesson list with prev/next pointers
const allLessons = [];
for (const track of tracks) {
  for (const mod of track.modules) {
    for (const lesson of mod.lessons) {
      allLessons.push({
        trackSlug: track.slug,
        modSlug: mod.slug,
        track, mod, lesson,
      });
    }
  }
}

// Landing
writeFile(path.join(SITE_DIR, 'index.html'), renderLanding(tracks));
pageCount++;

// Tracks
for (const track of tracks) {
  writeFile(path.join(SITE_DIR, track.slug, 'index.html'), renderTrack(track));
  pageCount++;

  // Modules
  for (const mod of track.modules) {
    writeFile(
      path.join(SITE_DIR, track.slug, mod.slug, 'index.html'),
      renderModule(track, mod)
    );
    pageCount++;

    // Lessons
    for (let i = 0; i < mod.lessons.length; i++) {
      const lesson = mod.lessons[i];

      // Compute global prev/next across modules + tracks
      const flatIdx = allLessons.findIndex(a => a.lesson === lesson);
      const prevLesson = flatIdx > 0 ? allLessons[flatIdx - 1] : null;
      const nextLesson = flatIdx < allLessons.length - 1 ? allLessons[flatIdx + 1] : null;

      writeFile(
        path.join(SITE_DIR, track.slug, mod.slug, lesson.slug, 'index.html'),
        renderLesson(track, mod, lesson, prevLesson, nextLesson)
      );
      pageCount++;

      // Add to search index
      allLessonsForSearch.push({
        title: lesson.title,
        url: `${BASE}/${track.slug}/${mod.slug}/${lesson.slug}/`,
        track: track.short,
        module: mod.title,
        outcome: lesson.outcome || '',
        body: lesson.raw.replace(/[#`*\[\]()_]/g, '').slice(0, 1500),
      });
    }
  }
}

// =============================================================
// CERTIFICATIONS PAGE
// =============================================================
// =============================================================
// CERTIFICATE SEAL + ARTWORK
// =============================================================
// CSS-drawn cert seal used on cert badge previews + the full
// printable certificate. No external image — every glyph is HTML
// so the deployable artifact is a single static page that
// screenshots cleanly to PNG or prints to PDF.
function tierMarkSVG(tier) {
  if (tier === 'operator') {
    // Foundation: solid serif "I" inside a faint outer frame, with horizontal axis ticks.
    return `<svg viewBox="0 0 200 200" class="tier-mark-svg tier-mark-operator" aria-hidden="true" focusable="false">
      <rect x="40" y="40" width="120" height="120" fill="none" stroke="currentColor" stroke-width="1" opacity="0.32"/>
      <rect x="92" y="60" width="16" height="80" fill="currentColor"/>
      <rect x="74" y="60" width="52" height="5" fill="currentColor"/>
      <rect x="74" y="135" width="52" height="5" fill="currentColor"/>
      <line x1="20" y1="100" x2="38" y2="100" stroke="currentColor" stroke-width="1" opacity="0.55"/>
      <line x1="162" y1="100" x2="180" y2="100" stroke="currentColor" stroke-width="1" opacity="0.55"/>
    </svg>`;
  }
  if (tier === 'engineer') {
    // System depth: double-bar "II" over a dotted 3x3 grid background.
    return `<svg viewBox="0 0 200 200" class="tier-mark-svg tier-mark-engineer" aria-hidden="true" focusable="false">
      <rect x="40" y="40" width="120" height="120" fill="none" stroke="currentColor" stroke-width="1" opacity="0.32"/>
      <g opacity="0.3" fill="currentColor">
        <circle cx="58"  cy="58"  r="2"/>
        <circle cx="100" cy="58"  r="2"/>
        <circle cx="142" cy="58"  r="2"/>
        <circle cx="58"  cy="100" r="2"/>
        <circle cx="142" cy="100" r="2"/>
        <circle cx="58"  cy="142" r="2"/>
        <circle cx="100" cy="142" r="2"/>
        <circle cx="142" cy="142" r="2"/>
      </g>
      <rect x="74"  y="62" width="14" height="76" fill="currentColor"/>
      <rect x="112" y="62" width="14" height="76" fill="currentColor"/>
      <rect x="62"  y="62" width="76" height="4" fill="currentColor"/>
      <rect x="62"  y="134" width="76" height="4" fill="currentColor"/>
    </svg>`;
  }
  if (tier === 'architect') {
    // Orchestration: triple-bar "III" inside nested frames, crossed axes, corner accents.
    return `<svg viewBox="0 0 200 200" class="tier-mark-svg tier-mark-architect" aria-hidden="true" focusable="false">
      <rect x="36" y="36" width="128" height="128" fill="none" stroke="currentColor" stroke-width="1" opacity="0.32"/>
      <rect x="56" y="56" width="88"  height="88"  fill="none" stroke="currentColor" stroke-width="1" opacity="0.5"/>
      <rect x="67"  y="65" width="10" height="70" fill="currentColor"/>
      <rect x="95"  y="65" width="10" height="70" fill="currentColor"/>
      <rect x="123" y="65" width="10" height="70" fill="currentColor"/>
      <rect x="58"  y="65" width="84" height="4" fill="currentColor"/>
      <rect x="58"  y="131" width="84" height="4" fill="currentColor"/>
      <line x1="14" y1="100" x2="34" y2="100" stroke="currentColor" stroke-width="1" opacity="0.5"/>
      <line x1="166" y1="100" x2="186" y2="100" stroke="currentColor" stroke-width="1" opacity="0.5"/>
      <line x1="100" y1="14" x2="100" y2="34" stroke="currentColor" stroke-width="1" opacity="0.5"/>
      <line x1="100" y1="166" x2="100" y2="186" stroke="currentColor" stroke-width="1" opacity="0.5"/>
      <rect x="34" y="34" width="4" height="4" fill="currentColor"/>
      <rect x="162" y="34" width="4" height="4" fill="currentColor"/>
      <rect x="34" y="162" width="4" height="4" fill="currentColor"/>
      <rect x="162" y="162" width="4" height="4" fill="currentColor"/>
    </svg>`;
  }
  return '';
}

function tierBadgeGraphic(tier) {
  // Enhanced central graphics per tier. Each one is a rich composition rather
  // than just a Roman numeral: tier-specific architecture in cream over the
  // drenched tier-color fill. viewBox 0 0 240 240.
  if (tier === 'operator') {
    // I: one serif Roman column. Cream cap-rules above and below give the
    // foundation column weight; flanking compass ticks frame it as a single
    // calibrated unit; two marker dots float above as targeting points.
    return `<svg class="badge-graphic" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <circle class="bg-marker" cx="105" cy="22" r="2.5"/>
      <circle class="bg-marker" cx="135" cy="22" r="2.5"/>
      <line class="bg-tick" x1="14" y1="120" x2="48" y2="120"/>
      <line class="bg-tick" x1="192" y1="120" x2="226" y2="120"/>
      <rect class="bg-rule" x="80" y="48" width="80" height="6"/>
      <rect class="bg-block" x="104" y="54" width="32" height="132"/>
      <rect class="bg-rule" x="80" y="186" width="80" height="6"/>
    </svg>`;
  }
  if (tier === 'engineer') {
    // II: two serif Roman columns. Cap-rules above and below each bar give
    // proper Roman-numeral weight. A 4x4 sparse dot grid backdrop suggests
    // the systems lattice. NO bridge — the eye reads "II" cleanly.
    return `<svg class="badge-graphic" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <g class="bg-dots">
        <circle cx="32"  cy="32"  r="2"/>
        <circle cx="208" cy="32"  r="2"/>
        <circle cx="32"  cy="208" r="2"/>
        <circle cx="208" cy="208" r="2"/>
        <circle cx="32"  cy="120" r="2"/>
        <circle cx="208" cy="120" r="2"/>
        <circle cx="120" cy="32"  r="2"/>
        <circle cx="120" cy="208" r="2"/>
      </g>
      <line class="bg-tick" x1="14" y1="120" x2="40" y2="120"/>
      <line class="bg-tick" x1="200" y1="120" x2="226" y2="120"/>
      <rect class="bg-rule" x="60"  y="48" width="56" height="6"/>
      <rect class="bg-rule" x="124" y="48" width="56" height="6"/>
      <rect class="bg-block" x="76"  y="54" width="24" height="132"/>
      <rect class="bg-block" x="140" y="54" width="24" height="132"/>
      <rect class="bg-rule" x="60"  y="186" width="56" height="6"/>
      <rect class="bg-rule" x="124" y="186" width="56" height="6"/>
    </svg>`;
  }
  if (tier === 'architect') {
    // III: three serif Roman columns inside a cream surveyor frame. Each
    // column gets cap-rules. The frame is breached by 4 axis ticks at the
    // compass points, with corner anchors and a faint crosshair behind.
    return `<svg class="badge-graphic" viewBox="0 0 240 240" aria-hidden="true" focusable="false">
      <rect class="bg-frame" x="32" y="32" width="176" height="176"/>
      <line class="bg-tick" x1="2" y1="120" x2="32" y2="120"/>
      <line class="bg-tick" x1="208" y1="120" x2="238" y2="120"/>
      <line class="bg-tick" x1="120" y1="2" x2="120" y2="32"/>
      <line class="bg-tick" x1="120" y1="208" x2="120" y2="238"/>
      <line class="bg-crosshair" x1="96" y1="120" x2="144" y2="120"/>
      <line class="bg-crosshair" x1="120" y1="96" x2="120" y2="144"/>
      <rect class="bg-rule" x="46"  y="60" width="40" height="5"/>
      <rect class="bg-rule" x="100" y="60" width="40" height="5"/>
      <rect class="bg-rule" x="154" y="60" width="40" height="5"/>
      <rect class="bg-block" x="56"  y="65" width="20" height="110"/>
      <rect class="bg-block" x="110" y="65" width="20" height="110"/>
      <rect class="bg-block" x="164" y="65" width="20" height="110"/>
      <rect class="bg-rule" x="46"  y="175" width="40" height="5"/>
      <rect class="bg-rule" x="100" y="175" width="40" height="5"/>
      <rect class="bg-rule" x="154" y="175" width="40" height="5"/>
      <rect class="bg-corner" x="28"  y="28"  width="8" height="8"/>
      <rect class="bg-corner" x="204" y="28"  width="8" height="8"/>
      <rect class="bg-corner" x="28"  y="204" width="8" height="8"/>
      <rect class="bg-corner" x="204" y="204" width="8" height="8"/>
    </svg>`;
  }
  return '';
}

function certSeal(tier, opts = {}) {
  const { size = 'medium' } = opts;
  const TIERS = {
    operator: { label: 'Operator',  num: 'I',   accent: 'seal-accent-green' },
    engineer: { label: 'Engineer',  num: 'II',  accent: 'seal-accent-blue' },
    architect:{ label: 'Architect', num: 'III', accent: 'seal-accent-orange' },
  };
  const d = TIERS[tier] || TIERS.operator;
  return `<article class="cert-seal cert-seal-${size} ${d.accent} cert-seal-${tier}" aria-label="ZopDev University ${d.label} badge">
  <span class="seal-vignette" aria-hidden="true"></span>
  <span class="seal-frame" aria-hidden="true"></span>
  <svg class="seal-mini-mark" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect width="32" height="32" fill="#F0EBDB"/>
    <circle cx="16" cy="16" r="8" fill="currentColor"/>
  </svg>
  <div class="seal-graphic">${tierBadgeGraphic(tier)}</div>
  <div class="seal-label-row">
    <span class="seal-label-rule" aria-hidden="true"></span>
    <h3 class="seal-label">${d.label}</h3>
    <span class="seal-label-rule" aria-hidden="true"></span>
  </div>
  <span class="seal-tier-num" aria-hidden="true">${d.num}</span>
</article>`;
}

// Generate a deterministic verifiable credential ID for sample cert
// pages. Real IDs come from the credentialing service; these are stable
// for demo purposes.
function sampleCredentialId(tier) {
  return ({
    operator: 'ZDU-OP-2026-A7F3-K9M2',
    engineer: 'ZDU-EN-2026-B4D8-R6L1',
    architect: 'ZDU-AR-2026-C1H5-T8N4',
  })[tier];
}

function sampleCredentialData(tier) {
  return ({
    operator: {
      tier, tierLabel: 'Operator', tierTitle: 'ZopNight Operator',
      title: 'Tier I / ZopNight Operator',
      blurb: 'has demonstrated the ability to operate ZopNight in production: connect clouds, discover resources, build schedules, route notifications, and audit every action.',
      coverage: 'Cloud Cost Foundations (T0) + ZopNight Operator (T1)',
      examLength: '30 minutes',
      questions: '20 questions',
      passScore: '80%',
      name: 'Alex Russo',
      role: 'Platform Engineer, Linarc Health',
      date: 'March 14, 2026',
      issuer: 'ZopDev University Editorial Board',
    },
    engineer: {
      tier, tierLabel: 'Engineer', tierTitle: 'ZopNight Engineer',
      title: 'Tier II / ZopNight Engineer',
      blurb: 'has demonstrated the ability to build cost-aware systems on ZopNight: read the 460-rule library, configure auto-remediation, schedule K8s and Databricks workloads, pre-scale for events, and optimize Bedrock inference.',
      coverage: 'ZopNight Engineer (T2) + DevOps Cost Discipline (T5)',
      examLength: '45 minutes',
      questions: '30 questions',
      passScore: '80%',
      name: 'Priya Menon',
      role: 'Senior Platform Engineer, Flexflow',
      date: 'April 22, 2026',
      issuer: 'ZopDev University Editorial Board',
    },
    architect: {
      tier, tierLabel: 'Architect', tierTitle: 'ZopNight Architect',
      title: 'Tier III / ZopNight Architect',
      blurb: 'has demonstrated the ability to own the cost-discipline practice for a multi-cloud organization: multi-org RBAC, audit log architecture, SOC 2 / ISO 27001 posture, FinOps Foundation framework, forecasting, commitments, and AI-powered ops via MCP.',
      coverage: 'ZopNight Architect (T3) + FinOps Mastery (T4) + AI-Powered Cloud Ops (T6)',
      examLength: '60 minutes',
      questions: '40 questions',
      passScore: '75%',
      name: 'Talvinder Singh',
      role: 'Head of Platform, McAfee',
      date: 'May 7, 2026',
      issuer: 'ZopDev University Editorial Board',
    },
  })[tier];
}

// Render the printable credential artwork. Wrapped in .credential-page
// so the print stylesheet can hide chrome and snap to a single page.
function credentialArtwork(tier, data) {
  const id = sampleCredentialId(tier);
  const issueYear = (data.date.match(/(\d{4})/) || [, '2026'])[1];
  const tierNum = { operator: 'I', engineer: 'II', architect: 'III' }[tier] || '';
  const tierLabelCaps = { operator: 'OPERATOR', engineer: 'ENGINEER', architect: 'ARCHITECT' }[tier];
  return `<div class="credential-artwork credential-${tier}">
  <div class="credential-frame">
    <!-- Header band: issuer wordmark left, coverage right -->
    <div class="credential-band-top">
      <div class="credential-issuer-mark">
        <span class="cred-mark-square"></span>
        <span class="cred-mark-circle"></span>
        <span class="cred-mark-name">ZopDev <em>University</em></span>
      </div>
      <div class="credential-coverage">${escapeHTML(data.coverage)}</div>
    </div>

    <!-- Hero strip band: vertical accent bar + big Roman numeral + tier label
         Replaces the centered seal with the proof-cell style. -->
    <div class="credential-strip">
      <div class="credential-strip-cell">
        <div class="credential-strip-num">${tierNum}</div>
        <div class="credential-strip-lbl">${tierLabelCaps}</div>
      </div>
      <div class="credential-strip-cell">
        <div class="credential-strip-num credential-strip-num-text">${escapeHTML(data.tierTitle.replace(/^ZopNight /, ''))}</div>
        <div class="credential-strip-lbl">Title</div>
      </div>
      <div class="credential-strip-cell">
        <div class="credential-strip-num credential-strip-num-text">EST. ${issueYear}</div>
        <div class="credential-strip-lbl">Issued</div>
      </div>
    </div>

    <!-- Recipient band: name + blurb directly below the strip -->
    <div class="credential-recipient">
      <div class="credential-presents">This is to certify that</div>
      <div class="credential-name">${escapeHTML(data.name)}</div>
      <div class="credential-name-rule"></div>
      <div class="credential-blurb">${escapeHTML(data.blurb)}</div>
      <div class="credential-award-row">
        <div class="credential-award">has been awarded the title of</div>
        <div class="credential-title">${escapeHTML(data.tierTitle)}</div>
      </div>
    </div>

    <!-- Foot band: 4-col metadata strip -->
    <div class="credential-foot">
      <div class="credential-foot-col">
        <div class="foot-key">Issued</div>
        <div class="foot-val">${escapeHTML(data.date)}</div>
      </div>
      <div class="credential-foot-col">
        <div class="foot-key">Credential ID</div>
        <div class="foot-val foot-val-mono">${escapeHTML(id)}</div>
      </div>
      <div class="credential-foot-col">
        <div class="foot-key">Verify at</div>
        <div class="foot-val foot-val-mono">zop.dev/resources/university/certifications/verify/</div>
      </div>
      <div class="credential-foot-col">
        <div class="foot-key">Issuer</div>
        <div class="foot-val">${escapeHTML(data.issuer)}</div>
      </div>
    </div>
  </div>
</div>`;
}

function renderCertSample(tier) {
  const data = sampleCredentialData(tier);
  const id = sampleCredentialId(tier);
  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <a href="${BASE}/certifications/">Certifications</a><span class="sep">›</span>
    <span class="current">${escapeHTML(data.tierTitle)} sample</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">Sample credential / ${escapeHTML(data.tierLabel)}</div>
    <h1>${tier === 'engineer' || tier === 'architect' ? 'An' : 'A'} ${escapeHTML(data.tierLabel)} credential, up close.</h1>
    <p class="track-hero-lead">This is the exact artwork a graduate receives once they pass the proctored ${escapeHTML(data.tierLabel)} exam. Every credential ships with a public verification page so a hiring manager can confirm authenticity in two clicks. The example below uses sample data.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="credential-stage">
      ${credentialArtwork(tier, data)}
    </div>
    <div class="credential-actions">
      <a href="${BASE}/certifications/verify/?id=${encodeURIComponent(id)}" class="btn btn-primary">Try the verify flow <span class="arrow">→</span></a>
      <button onclick="window.print()" class="btn btn-secondary" type="button">Print or save as PDF</button>
      <a href="${BASE}/${tier === 'operator' ? 'operator' : tier === 'engineer' ? 'engineer' : 'architect'}/" class="btn-ghost">Read the ${escapeHTML(data.tierLabel)} course</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">Anatomy</div>
      <div>
        <h2>Every credential carries five things.</h2>
        <p class="sub">So a hiring manager who has never seen ZopDev University can still verify it in one minute.</p>
      </div>
    </div>
    <ol class="anatomy-list">
      <li class="anatomy-item">
        <div class="anatomy-num">01</div>
        <div><h3>The seal</h3><p>Tier number (I, II, or III), tier name, and the canonical ZopDev University mark. The seal is consistent across all credentials so the artifact is instantly recognizable.</p></div>
      </li>
      <li class="anatomy-item">
        <div class="anatomy-num">02</div>
        <div><h3>The named capability</h3><p>One sentence describing what the holder has demonstrated. Not "completed a course." A specific operational thing they can do.</p></div>
      </li>
      <li class="anatomy-item">
        <div class="anatomy-num">03</div>
        <div><h3>The credential ID</h3><p>Stable, monospace, unique. Format <code>ZDU-XX-YYYY-XXXX-XXXX</code>. A hiring manager can paste this into the verify page.</p></div>
      </li>
      <li class="anatomy-item">
        <div class="anatomy-num">04</div>
        <div><h3>The verify URL</h3><p>Public, no login. Hits <code>zop.dev/resources/university/certifications/verify/</code> with the ID, returns the candidate's name, issue date, and the tier — nothing else. Privacy-respectful by design.</p></div>
      </li>
      <li class="anatomy-item">
        <div class="anatomy-num">05</div>
        <div><h3>The issuer line</h3><p>The ZopDev University Editorial Board owns the credentialing. The full editorial board roster is published on the <a href="/company/about/">ZopDev about page</a>.</p></div>
      </li>
    </ol>
  </div>
</section>

<section class="cta-strip">
  <div class="container">
    <h2>Earn yours.</h2>
    <p>The ${escapeHTML(data.tierLabel)} certification requires ${escapeHTML(data.questions)} answered in ${escapeHTML(data.examLength)}, at ${escapeHTML(data.passScore)} pass score. Cover the curriculum first.</p>
    <div class="hero-cta">
      <a href="${BASE}/${tier === 'operator' ? 'foundations' : tier}/" class="btn btn-primary">Start studying <span class="arrow">→</span></a>
      <a href="${BASE}/certifications/" class="btn btn-secondary">Compare all three</a>
    </div>
  </div>
</section>`;

  return pageHTML({
    title: `${data.tierTitle} sample credential / ZopDev University`,
    description: `What a verified ZopDev University ${data.tierLabel} credential looks like, with anatomy and the public verification URL.`,
    canonical: `https://zop.dev/resources/university/certifications/${tier}/sample/`,
    bodyClass: 'has-credential',
    uniNav: 'certifications',
    body,
  });
}

function renderVerify() {
  const samples = ['operator', 'engineer', 'architect'].map(tier => {
    const d = sampleCredentialData(tier);
    const id = sampleCredentialId(tier);
    return { tier, id, d };
  });
  const samplesJSON = JSON.stringify(Object.fromEntries(samples.map(s => [
    s.id,
    {
      tier: s.tier,
      tierTitle: s.d.tierTitle,
      tierLabel: s.d.tierLabel,
      name: s.d.name,
      role: s.d.role,
      date: s.d.date,
      coverage: s.d.coverage,
      blurb: s.d.blurb,
    }
  ])));

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <a href="${BASE}/certifications/">Certifications</a><span class="sep">›</span>
    <span class="current">Verify a credential</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">Public verification / No login</div>
    <h1>Verify a ZopDev University credential.</h1>
    <p class="track-hero-lead">Paste the credential ID from a candidate's certificate. The ID is printed on the credential artwork itself and on the candidate's résumé. Verification is public, no account required.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="verify-shell">
      <form class="verify-form" id="verify-form" onsubmit="event.preventDefault(); window.universityVerify();">
        <label for="verify-id" class="verify-label">Credential ID</label>
        <div class="verify-row">
          <input type="text" id="verify-id" class="verify-input" placeholder="ZDU-OP-2026-A7F3-K9M2" autocomplete="off" spellcheck="false">
          <button type="submit" class="btn btn-primary">Verify <span class="arrow">→</span></button>
        </div>
        <div class="verify-help">Try one of the sample IDs:
          <button type="button" class="verify-sample-btn" data-id="${samples[0].id}">${samples[0].id}</button>
          <button type="button" class="verify-sample-btn" data-id="${samples[1].id}">${samples[1].id}</button>
          <button type="button" class="verify-sample-btn" data-id="${samples[2].id}">${samples[2].id}</button>
        </div>
      </form>

      <div class="verify-result" id="verify-result" aria-live="polite" hidden>
        <div class="verify-status">
          <span class="verify-check" aria-hidden="true"></span>
          <span class="verify-status-text">Credential verified</span>
        </div>
        <div class="verify-table">
          <div class="verify-row-r"><div class="verify-k">Credential ID</div><div class="verify-v verify-v-mono" id="r-id">—</div></div>
          <div class="verify-row-r"><div class="verify-k">Holder</div><div class="verify-v" id="r-name">—</div></div>
          <div class="verify-row-r"><div class="verify-k">Title</div><div class="verify-v" id="r-title">—</div></div>
          <div class="verify-row-r"><div class="verify-k">Tier</div><div class="verify-v" id="r-tier">—</div></div>
          <div class="verify-row-r"><div class="verify-k">Issued</div><div class="verify-v" id="r-date">—</div></div>
          <div class="verify-row-r"><div class="verify-k">Coverage</div><div class="verify-v" id="r-coverage">—</div></div>
          <div class="verify-row-r"><div class="verify-k">Issuer</div><div class="verify-v">ZopDev University Editorial Board</div></div>
        </div>
        <div class="verify-blurb" id="r-blurb"></div>
      </div>

      <div class="verify-error" id="verify-error" aria-live="polite" hidden>
        <div class="verify-status verify-status-bad">
          <span class="verify-x" aria-hidden="true"></span>
          <span class="verify-status-text">No credential found</span>
        </div>
        <p>That ID doesn't match a ZopDev University credential. Double-check the format (<code>ZDU-XX-YYYY-XXXX-XXXX</code>), or paste one of the sample IDs above to see how verification works.</p>
      </div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">How verification works</div>
      <div>
        <h2>Three things, in two clicks.</h2>
        <p class="sub">No login. No marketing wall. Verification is a public read on a public endpoint.</p>
      </div>
    </div>
    <ol class="anatomy-list">
      <li class="anatomy-item">
        <div class="anatomy-num">01</div>
        <div><h3>Paste the ID</h3><p>The credential ID is printed on the certificate artwork in the foot row, and on the holder's résumé. Format: <code>ZDU-XX-YYYY-XXXX-XXXX</code>.</p></div>
      </li>
      <li class="anatomy-item">
        <div class="anatomy-num">02</div>
        <div><h3>Read the verification</h3><p>You see the holder's name, the tier (Operator / Engineer / Architect), the issue date, and the curriculum coverage. Nothing else — no email, no employer, no PII beyond name.</p></div>
      </li>
      <li class="anatomy-item">
        <div class="anatomy-num">03</div>
        <div><h3>Cross-check the seal</h3><p>Compare the seal on the candidate's certificate with the canonical seal shown on <a href="${BASE}/certifications/">the certifications page</a>. ZopDev University seals never change — if the artwork doesn't match, the credential is forged.</p></div>
      </li>
    </ol>
  </div>
</section>

<section class="cta-strip">
  <div class="container">
    <h2>Verify any credential in under a minute.</h2>
    <p>Or browse the three certifications and the curriculum that backs each one.</p>
    <div class="hero-cta">
      <a href="${BASE}/certifications/" class="btn btn-primary">See certifications <span class="arrow">→</span></a>
      <a href="${BASE}/certifications/operator/sample/" class="btn-ghost">View a sample certificate</a>
    </div>
  </div>
</section>

<script>
window.__zopuni_credentials = ${samplesJSON};
window.universityVerify = function(){
  var idInput = document.getElementById('verify-id');
  var result = document.getElementById('verify-result');
  var error = document.getElementById('verify-error');
  var raw = (idInput.value || '').trim().toUpperCase();
  var rec = window.__zopuni_credentials[raw];
  if (!rec) {
    result.hidden = true;
    error.hidden = false;
    return;
  }
  error.hidden = true;
  document.getElementById('r-id').textContent = raw;
  document.getElementById('r-name').textContent = rec.name;
  document.getElementById('r-title').textContent = rec.tierTitle;
  document.getElementById('r-tier').textContent = 'Tier ' + ({operator:'I',engineer:'II',architect:'III'}[rec.tier]) + ' / ' + rec.tierLabel;
  document.getElementById('r-date').textContent = rec.date;
  document.getElementById('r-coverage').textContent = rec.coverage;
  document.getElementById('r-blurb').textContent = rec.name + ' ' + rec.blurb;
  result.hidden = false;
  result.scrollIntoView({behavior:'smooth', block:'start'});
};

// Sample-id helper buttons + URL ?id= autofill
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('.verify-sample-btn').forEach(function(b){
    b.addEventListener('click', function(){
      document.getElementById('verify-id').value = b.dataset.id;
      window.universityVerify();
    });
  });
  var params = new URLSearchParams(window.location.search);
  var preset = params.get('id');
  if (preset) {
    document.getElementById('verify-id').value = preset;
    window.universityVerify();
  }
});
</script>`;

  return pageHTML({
    title: 'Verify a credential / ZopDev University',
    description: 'Public verification for ZopDev University credentials. Paste a credential ID, see the holder name, tier, and issue date. No login.',
    canonical: 'https://zop.dev/resources/university/certifications/verify/',
    uniNav: 'certifications',
    body,
  });
}

function renderCertifications(tracks) {
  const t0 = tracks.find(t => t.code === 'T0');
  const t1 = tracks.find(t => t.code === 'T1');
  const t2 = tracks.find(t => t.code === 'T2');
  const t3 = tracks.find(t => t.code === 'T3');
  const t4 = tracks.find(t => t.code === 'T4');
  const t5 = tracks.find(t => t.code === 'T5');
  const t6 = tracks.find(t => t.code === 'T6');
  const ll = (t) => t ? t.modules.reduce((s,m)=>s+m.lessons.length,0) : 0;

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <span class="current">Certifications</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">Certifications / 3 tiers</div>
    <h1>Three credentials. Three different jobs.</h1>
    <p class="track-hero-lead">Each ZopDev University certification verifies a specific operational capability. Operator runs the tool. Engineer builds with it. Architect owns the practice. Pass the exam, list it on your résumé.</p>
  </div>
</section>

<!-- Proof strip at the top of the certifications page: tier numerals
     as the four big numbers, mirroring the homepage proof strip. -->
<section class="lp-proof lp-proof-certs">
  <div class="container">
    <div class="lp-proof-grid lp-proof-grid-3">
      <div class="lp-proof-cell lp-proof-cell-operator">
        <div class="lp-proof-num">I</div>
        <div class="lp-proof-lbl">Operator</div>
      </div>
      <div class="lp-proof-cell lp-proof-cell-engineer">
        <div class="lp-proof-num">II</div>
        <div class="lp-proof-lbl">Engineer</div>
      </div>
      <div class="lp-proof-cell lp-proof-cell-architect">
        <div class="lp-proof-num">III</div>
        <div class="lp-proof-lbl">Architect</div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="operator">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">Tier I / Operator</div>
      <div>
        <h2>ZopNight Operator</h2>
        <p class="sub">For whoever runs ZopNight day to day.</p>
      </div>
    </div>
    <article class="cert-card cert-card-with-seal cert-card-operator">
      <aside class="cert-card-seal">
        ${certSeal('operator', { size: 'medium' })}
        <div class="cert-card-seal-meta">
          <span class="cert-card-seal-tier">Tier I</span>
          <span class="cert-card-seal-rule" aria-hidden="true"></span>
          <span class="cert-card-seal-year">EST. 2026</span>
        </div>
      </aside>
      <div class="cert-card-body">
        <header class="cert-card-header">
          <div class="cert-level">Operator certification</div>
          <h3>You can run ZopNight in production.</h3>
          <p class="cert-card-lead">Hand them ZopNight on Monday. They'll have schedules running, an estate audited, and the on-call team trained by Friday.</p>
        </header>

        <dl class="cert-card-stats">
          <div>
            <dt>Lessons</dt>
            <dd>${ll(t0) + ll(t1)}</dd>
          </div>
          <div>
            <dt>Course time</dt>
            <dd>10 <span class="unit">hr</span></dd>
          </div>
          <div>
            <dt>Exam</dt>
            <dd>30 <span class="unit">min</span></dd>
          </div>
          <div>
            <dt>Pass mark</dt>
            <dd>80<span class="unit">%</span></dd>
          </div>
        </dl>

        <section class="cert-card-scope">
          <span class="cert-card-scope-label">What it proves</span>
          <ul>
            <li>Reads a cloud bill and names the four cost categories</li>
            <li>Connects a cloud, runs estate discovery, audits tags</li>
            <li>Builds schedules, sets safe-window overrides, routes notifications</li>
            <li>Manages groups, RBAC roles, and the audit log</li>
          </ul>
        </section>

        <div class="cert-card-path">
          <span class="cert-card-path-label">Path</span>
          <ol class="cert-card-path-chain">
            <li><a href="${BASE}/foundations/">Foundations</a></li>
            <li><a href="${BASE}/operator/">Operator</a></li>
            <li><span>Operator exam</span></li>
          </ol>
        </div>

        <footer class="cert-card-cta">
          <a href="${BASE}/operator/" class="btn btn-primary">Start Operator course <span class="arrow">→</span></a>
          <a href="${BASE}/certifications/operator/sample/" class="btn-ghost">See sample certificate <span class="arrow">→</span></a>
        </footer>
      </div>
    </article>
  </div>
</section>

<section class="section" id="engineer">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">Tier II / Engineer</div>
      <div>
        <h2>ZopNight Engineer</h2>
        <p class="sub">For engineers building cost-aware systems.</p>
      </div>
    </div>
    <article class="cert-card cert-card-with-seal cert-card-engineer">
      <aside class="cert-card-seal">
        ${certSeal('engineer', { size: 'medium' })}
        <div class="cert-card-seal-meta">
          <span class="cert-card-seal-tier">Tier II</span>
          <span class="cert-card-seal-rule" aria-hidden="true"></span>
          <span class="cert-card-seal-year">EST. 2026</span>
        </div>
      </aside>
      <div class="cert-card-body">
        <header class="cert-card-header">
          <div class="cert-level">Engineer certification</div>
          <h3>You can shape the cost surface.</h3>
          <p class="cert-card-lead">Not just running the tool — building the practice. Tagging at the IaC layer, scaling for events, handling cost incidents like real incidents.</p>
        </header>

        <dl class="cert-card-stats">
          <div>
            <dt>Lessons</dt>
            <dd>${ll(t2) + ll(t5)}</dd>
          </div>
          <div>
            <dt>Course time</dt>
            <dd>16 <span class="unit">hr</span></dd>
          </div>
          <div>
            <dt>Exam</dt>
            <dd>45 <span class="unit">min</span></dd>
          </div>
          <div>
            <dt>Pass mark</dt>
            <dd>80<span class="unit">%</span></dd>
          </div>
        </dl>

        <section class="cert-card-scope">
          <span class="cert-card-scope-label">What it proves</span>
          <ul>
            <li>Reads the 460-rule library, configures auto-remediation</li>
            <li>Schedules K8s + Databricks workloads, pre-scales for events</li>
            <li>Tags at the IaC layer (Terraform / Pulumi / CDK)</li>
            <li>Runs a cost incident: detect, diagnose, remediate, postmortem</li>
          </ul>
        </section>

        <div class="cert-card-path">
          <span class="cert-card-path-label">Path</span>
          <ol class="cert-card-path-chain">
            <li><span class="cert-card-path-earned">Operator</span></li>
            <li><a href="${BASE}/engineer/">Engineer</a></li>
            <li><a href="${BASE}/devops-cost-discipline/">DevOps Cost Discipline</a></li>
            <li><span>Engineer exam</span></li>
          </ol>
        </div>

        <footer class="cert-card-cta">
          <a href="${BASE}/engineer/" class="btn btn-primary">Start Engineer course <span class="arrow">→</span></a>
          <a href="${BASE}/certifications/engineer/sample/" class="btn-ghost">See sample certificate <span class="arrow">→</span></a>
        </footer>
      </div>
    </article>
  </div>
</section>

<section class="section" id="architect">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">Tier III / Architect</div>
      <div>
        <h2>ZopNight Architect</h2>
        <p class="sub">For platform leads owning the cost-discipline practice.</p>
      </div>
    </div>
    <article class="cert-card cert-card-with-seal cert-card-architect">
      <aside class="cert-card-seal">
        ${certSeal('architect', { size: 'medium' })}
        <div class="cert-card-seal-meta">
          <span class="cert-card-seal-tier">Tier III</span>
          <span class="cert-card-seal-rule" aria-hidden="true"></span>
          <span class="cert-card-seal-year">EST. 2026</span>
        </div>
      </aside>
      <div class="cert-card-body">
        <header class="cert-card-header">
          <div class="cert-level">Architect certification</div>
          <h3>You own how the org thinks about cost.</h3>
          <p class="cert-card-lead">The senior conversation. Finance asks for forecasts. Security asks for posture. The CTO asks what the next twelve months look like. You have answers.</p>
        </header>

        <dl class="cert-card-stats">
          <div>
            <dt>Lessons</dt>
            <dd>${ll(t3) + ll(t4) + ll(t6)}</dd>
          </div>
          <div>
            <dt>Course time</dt>
            <dd>19 <span class="unit">hr</span></dd>
          </div>
          <div>
            <dt>Exam</dt>
            <dd>60 <span class="unit">min</span></dd>
          </div>
          <div>
            <dt>Pass mark</dt>
            <dd>75<span class="unit">%</span></dd>
          </div>
        </dl>

        <section class="cert-card-scope">
          <span class="cert-card-scope-label">What it proves</span>
          <ul>
            <li>Multi-org RBAC, audit-log architecture, SOC 2 / ISO posture</li>
            <li>FinOps Foundation framework, KPIs, maturity model</li>
            <li>Forecasting, commitments (RIs, SPs, CUDs), unit economics</li>
            <li>AI-powered ops via MCP, agentic remediation, guardrails</li>
          </ul>
        </section>

        <div class="cert-card-path">
          <span class="cert-card-path-label">Path</span>
          <ol class="cert-card-path-chain">
            <li><span class="cert-card-path-earned">Engineer</span></li>
            <li><a href="${BASE}/architect/">Architect</a></li>
            <li><a href="${BASE}/finops-mastery/">FinOps Mastery</a></li>
            <li><a href="${BASE}/ai-powered-cloud-ops/">AI Ops</a></li>
            <li><span>Architect exam</span></li>
          </ol>
        </div>

        <footer class="cert-card-cta">
          <a href="${BASE}/architect/" class="btn btn-primary">Start Architect course <span class="arrow">→</span></a>
          <a href="${BASE}/certifications/architect/sample/" class="btn-ghost">See sample certificate <span class="arrow">→</span></a>
        </footer>
      </div>
    </article>
  </div>
</section>

<section class="section" id="verify">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">Verification</div>
      <div>
        <h2>Every credential is publicly verifiable.</h2>
        <p class="sub">A hiring manager pastes the ID, reads the candidate's name, tier, and date. No login. No marketing wall.</p>
      </div>
    </div>
    <div class="verify-promo">
      <div class="verify-promo-copy">
        <p>Each certificate ships with a <strong>credential ID</strong> in the format <code>ZDU-XX-YYYY-XXXX-XXXX</code>. The candidate puts the ID on their résumé. The verifier pastes the ID, sees three lines, knows it's authentic.</p>
      </div>
      <div class="verify-promo-actions">
        <a href="${BASE}/certifications/verify/" class="btn btn-primary">Verify a credential <span class="arrow">→</span></a>
        <a href="${BASE}/certifications/operator/sample/" class="btn-ghost">View a sample</a>
      </div>
    </div>
  </div>
</section>

<section class="cta-strip">
  <div class="container">
    <h2>The credential is the artifact.</h2>
    <p>What it stands for is the operating practice you'll bring to your team. Start where you are.</p>
    <div class="hero-cta">
      <a href="${BASE}/" class="btn btn-primary">See all courses <span class="arrow">→</span></a>
    </div>
  </div>
</section>`;

  return pageHTML({
    title: 'Certifications / ZopDev University',
    description: 'Three certifications across cloud cost optimization: Operator, Engineer, Architect. Each verifies a real operational capability.',
    canonical: 'https://zop.dev/resources/university/certifications/',
    uniNav: 'certifications',
    body,
  });
}

writeFile(path.join(SITE_DIR, 'certifications', 'index.html'), renderCertifications(tracks));
pageCount++;

// Sample certificate pages — one per tier
for (const tier of ['operator', 'engineer', 'architect']) {
  writeFile(
    path.join(SITE_DIR, 'certifications', tier, 'sample', 'index.html'),
    renderCertSample(tier)
  );
  pageCount++;
}

// Verify-a-credential page
writeFile(path.join(SITE_DIR, 'certifications', 'verify', 'index.html'), renderVerify());
pageCount++;

// =============================================================
// GLOSSARY (index + per-term page)
// =============================================================
// Build a map: term -> [{track, mod, lesson}, ...]
// Extract the paragraph that mentions each term in the authored lesson
// markdown body (as plain text, not a glossary link). The "Glossary
// terms touched" footer list is just an index — real definition prose
// lives in the body, where the author writes about the term in
// sentences.
//
// Strategy:
// 1. Find every line that mentions the term as a whole word (case-i).
// 2. Reject lines inside the "Glossary terms touched" or "Related
//    lessons" sections (those are link lists, not definitions).
// 3. Reject lines inside code fences.
// 4. Among valid candidates, pick the one in the EARLIEST body section
//    (usually "## 1. Concept" — where the author defines the term).
// 5. Walk back/forward to the paragraph boundary, strip code fences.
function extractTermDefinitionFromLesson(rawMd, term) {
  const lines = rawMd.split('\n');
  // Whole-word, case-insensitive. Term may include hyphens, dots, etc.,
  // so anchor on non-letter boundaries instead of strict \b.
  const termEscaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const termRegex = new RegExp(`(^|[^A-Za-z0-9])${termEscaped}([^A-Za-z0-9]|$)`, 'i');

  // Track section + code-fence state per line
  const sectionForLine = [];
  const inCodeForLine = [];
  let currentSection = '';
  let inCode = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('```')) inCode = !inCode;
    inCodeForLine[i] = inCode;
    const hm = lines[i].match(/^#{1,6}\s+(.+)$/);
    if (hm) currentSection = hm[1].toLowerCase();
    sectionForLine[i] = currentSection;
  }

  const candidates = [];
  for (let i = 0; i < lines.length; i++) {
    if (inCodeForLine[i]) continue;
    if (!termRegex.test(lines[i])) continue;
    const sec = sectionForLine[i] || '';
    if (/glossary terms?/i.test(sec)) continue;
    if (/related lessons?/i.test(sec)) continue;
    if (/module quiz|track\s*\d+\s*complete/i.test(sec)) continue;
    // Skip lines that ARE the heading itself
    if (/^#{1,6}\s/.test(lines[i])) continue;
    // Skip table rows + ascii-art lines (start with | or look like code)
    if (lines[i].startsWith('|')) continue;
    if (/^[\s│┌└├]/.test(lines[i]) && !/^[\s]+[A-Za-z]/.test(lines[i])) continue;

    // Walk back to paragraph start
    let start = i;
    while (start > 0 && lines[start - 1].trim() !== '' && !/^[#|>]/.test(lines[start - 1]) && !lines[start - 1].startsWith('```') && lines[start - 1].trim() !== '---') {
      start--;
    }
    let end = i;
    while (end < lines.length - 1 && lines[end + 1].trim() !== '' && !/^[#|>]/.test(lines[end + 1]) && !lines[end + 1].startsWith('```') && lines[end + 1].trim() !== '---') {
      end++;
    }
    let para = lines.slice(start, end + 1).join(' ').trim();
    if (para.length < 40) continue;

    // Reject paragraphs that are dominated by glossary links (the footer
    // bleeds into adjacent lines sometimes)
    const linkCount = (para.match(/\[[^\]]+\]\([^)]+\)/g) || []).length;
    const nonLinkText = para.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/`[^`]+`/g, '');
    if (linkCount >= 4 && nonLinkText.length < 80) continue;

    candidates.push({ para, sectionIdx: i, prose: nonLinkText.length });
  }

  if (candidates.length === 0) return '';
  // Prefer the earliest occurrence (lessons define terms before reusing
  // them). Among same-section candidates, prefer the one with most prose.
  candidates.sort((a, b) => a.sectionIdx - b.sectionIdx || b.prose - a.prose);
  return candidates[0].para;
}

// Strip markdown formatting for display in compact contexts (cards).
function stripMd(text) {
  return String(text)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')   // links → text
    .replace(/`([^`]+)`/g, '$1')                  // code → text
    .replace(/\*\*([^*]+)\*\*/g, '$1')            // bold → text
    .replace(/\*([^*]+)\*/g, '$1')                // italic → text
    .replace(/\s+/g, ' ')
    .trim();
}

function buildGlossaryIndex() {
  // termName -> { refs: [{track, mod, lesson}], definition: string }
  const termMap = new Map();
  for (const a of allLessons) {
    const matches = a.lesson.raw.matchAll(/\[([^\]]+)\]\(\.\.\/\.\.\/\.\.\/reference\/glossary\/[^)]+\.md\)/g);
    const seen = new Set();
    for (const m of matches) {
      const term = m[1].trim();
      if (seen.has(term)) continue;
      seen.add(term);
      if (!termMap.has(term)) {
        termMap.set(term, { refs: [], definition: '' });
      }
      const entry = termMap.get(term);
      entry.refs.push({ track: a.track, mod: a.mod, lesson: a.lesson });
      // Capture definition from the first lesson that introduces the term
      if (!entry.definition) {
        const para = extractTermDefinitionFromLesson(a.lesson.raw, term);
        if (para) entry.definition = stripMd(para);
      }
    }
  }
  return termMap;
}

function renderGlossaryTermPage(term, entry) {
  const refs = entry.refs;
  const definition = entry.definition || '';
  const lessonRows = refs.map(r => `
<a href="${BASE}/${r.track.slug}/${r.mod.slug}/${r.lesson.slug}/" class="glossary-ref-row">
  <span class="ref-code">${escapeHTML(r.track.code)} / ${escapeHTML(r.mod.code)} / ${escapeHTML(r.lesson.code)}</span>
  <span class="ref-title">${escapeHTML(r.lesson.title)}</span>
  <span class="ref-arrow" aria-hidden="true"></span>
</a>`).join('');

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <a href="${BASE}/glossary/">Glossary</a><span class="sep">›</span>
    <span class="current">${escapeHTML(term)}</span>
  </div>
</section>

<section class="glossary-term-hero">
  <div class="container">
    <div class="glossary-term-meta"><span class="eyebrow-square" aria-hidden="true"></span>Glossary term</div>
    <h1 class="glossary-term-name">${escapeHTML(term)}</h1>
    ${definition ? `<p class="glossary-term-def">${escapeHTML(definition)}</p>` : `<p class="glossary-term-def glossary-term-def-empty">A vocabulary term used in ${refs.length} ${refs.length === 1 ? 'lesson' : 'lessons'} across the curriculum. Read it in context below.</p>`}
    <div class="glossary-term-foot">
      <span class="glossary-term-count">${refs.length} ${refs.length === 1 ? 'lesson reference' : 'lesson references'}</span>
      <a href="${BASE}/glossary/" class="glossary-term-back">← Back to glossary</a>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="glossary-term-refs-head">
      <div class="lp-section-eyebrow"><span class="eyebrow-square" aria-hidden="true"></span>Where it appears</div>
      <h2 class="glossary-term-refs-h2">Read the term in context.</h2>
      <p class="glossary-term-refs-sub">Each row is a lesson that uses this term. The lesson where it first appears is the canonical definition.</p>
    </div>
    <div class="glossary-refs">${lessonRows}</div>
  </div>
</section>`;

  return pageHTML({
    title: `${term} / Glossary / ZopDev University`,
    description: definition || `Glossary entry for "${term}". Referenced in ${refs.length} lessons across ZopDev University.`,
    canonical: `https://zop.dev/resources/university/glossary/${slugify(term)}/`,
    uniNav: 'glossary',
    body,
  });
}

function renderGlossary(termMap) {
  // Drop terms that start with a non-alphabetic character (backticks,
  // numbers, symbols). They're authored-code artifacts from lesson
  // markdown — kept reachable via lesson body links and search, but
  // not surfaced in the glossary index.
  const allTerms = [...termMap.keys()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  const terms = allTerms.filter(t => /^[A-Za-z]/.test(t));

  // Group by first letter for navigation (alphabetic only)
  const byLetter = new Map();
  for (const t of terms) {
    const key = t[0].toUpperCase();
    if (!byLetter.has(key)) byLetter.set(key, []);
    byLetter.get(key).push(t);
  }

  const letters = [...byLetter.keys()].sort();
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const letterNav = allLetters.map(L => {
    const has = byLetter.has(L);
    return `<a href="${has ? '#letter-'+L : ''}" class="gx-letter-link${has ? '' : ' is-empty'}" data-letter="${L}"${has ? '' : ' aria-disabled="true"'}>${L}</a>`;
  }).join('');
  const totalWithDef = terms.filter(t => (termMap.get(t).definition || '').length > 0).length;

  const sections = letters.map(L => {
    const items = byLetter.get(L).map(t => {
      const entry = termMap.get(t);
      const def = entry.definition || '';
      const defShort = def.length > 180 ? def.slice(0, 180).replace(/[,. ]+$/, '') + '…' : def;
      const refCount = entry.refs.length;
      const searchKey = t.toLowerCase();
      return `<a href="${BASE}/glossary/${slugify(t)}/" class="gx-entry" data-term="${escapeHTML(searchKey)}">
  <span class="gx-entry-name">${escapeHTML(t)}</span>${defShort ? `
  <span class="gx-entry-def">${escapeHTML(defShort)}</span>` : ''}
  <span class="gx-entry-count">${refCount}${refCount === 1 ? '' : '×'}</span>
</a>`;
    }).join('');
    return `<article class="gx-letter" id="letter-${L}" data-letter="${L}">
  <header class="gx-letter-head">
    <div class="gx-letter-mark" aria-hidden="true">${L}</div>
    <div class="gx-letter-meta">
      <span class="gx-letter-count" data-letter-count="${L}">${byLetter.get(L).length}</span>
      <span class="gx-letter-label">terms</span>
    </div>
  </header>
  <div class="gx-letter-list">${items}</div>
</article>`;
  }).join('\n');

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <span class="current">Glossary</span>
  </div>
</section>

<section class="gx-hero">
  <div class="container">
    <div class="gx-hero-head">
      <div class="lp-section-eyebrow"><span class="eyebrow-square" aria-hidden="true"></span>Reference / Glossary</div>
      <h1 class="gx-h1">Every term,<br>in one place.</h1>
      <p class="gx-h1-sub">${terms.length} terms across 237 lessons. ${totalWithDef} carry a definition pulled verbatim from the lesson that first uses them. Click any term to land there.</p>
    </div>
    <form class="gx-filter" role="search" onsubmit="return false">
      <span class="gx-filter-icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <circle cx="9" cy="9" r="5.5"/>
          <path d="M13 13 L17 17"/>
        </svg>
      </span>
      <label class="gx-filter-label" for="gx-filter-input">Filter</label>
      <input id="gx-filter-input" class="gx-filter-input" type="search" placeholder="Type a term, an acronym, anything." autocomplete="off" spellcheck="false" />
      <span class="gx-filter-count"><span id="gx-filter-visible">${terms.length}</span><span class="gx-filter-count-sep"> / </span><span class="gx-filter-count-total">${terms.length}</span><span class="gx-filter-count-of"> matched</span></span>
    </form>
  </div>
  <div class="gx-letter-bar" aria-label="Jump to letter">
    <div class="container gx-letter-bar-inner">${letterNav}</div>
  </div>
</section>

<section class="gx-body">
  <div class="container">
    ${sections}
    <div class="gx-empty" id="gx-empty" hidden>
      <div class="gx-empty-mark">·</div>
      <p class="gx-empty-text">No term matches that filter.</p>
      <button class="btn btn-secondary" type="button" id="gx-empty-reset">Clear filter</button>
    </div>
  </div>
</section>

<script>
(function(){
  var input = document.getElementById('gx-filter-input');
  var countEl = document.getElementById('gx-filter-visible');
  var emptyEl = document.getElementById('gx-empty');
  var resetBtn = document.getElementById('gx-empty-reset');
  if (!input) return;

  var entries = Array.prototype.slice.call(document.querySelectorAll('.gx-entry'));
  var letters = Array.prototype.slice.call(document.querySelectorAll('.gx-letter'));
  var letterLinks = Array.prototype.slice.call(document.querySelectorAll('.gx-letter-link'));

  function apply(q) {
    q = (q || '').trim().toLowerCase();
    var total = 0;
    var perLetter = {};
    entries.forEach(function(a) {
      var term = a.dataset.term || '';
      var match = !q || term.indexOf(q) !== -1;
      a.hidden = !match;
      if (match) {
        total++;
        var L = (a.parentElement.parentElement.dataset.letter || '').toUpperCase();
        perLetter[L] = (perLetter[L] || 0) + 1;
      }
    });
    letters.forEach(function(sec){
      var L = sec.dataset.letter;
      var c = perLetter[L] || 0;
      sec.hidden = c === 0;
      var ce = sec.querySelector('[data-letter-count="' + L + '"]');
      if (ce) ce.textContent = c;
    });
    letterLinks.forEach(function(a){
      var L = a.dataset.letter;
      var hasMatches = perLetter[L] > 0;
      a.classList.toggle('is-empty', !hasMatches);
    });
    countEl.textContent = total;
    emptyEl.hidden = total !== 0;
  }
  input.addEventListener('input', function(){ apply(input.value); });
  if (resetBtn) resetBtn.addEventListener('click', function(){ input.value = ''; apply(''); input.focus(); });

  // Sticky letter bar — highlight current section
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(items){
      items.forEach(function(it){
        if (it.isIntersecting) {
          var L = it.target.dataset.letter;
          letterLinks.forEach(function(a){ a.classList.toggle('is-current', a.dataset.letter === L); });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    letters.forEach(function(sec){ io.observe(sec); });
  }
})();
</script>`;

  return pageHTML({
    title: 'Glossary / ZopDev University',
    description: `${terms.length} terms defined as ZopDev University uses them, each linked to the lessons that reference it.`,
    canonical: 'https://zop.dev/resources/university/glossary/',
    uniNav: 'glossary',
    body,
  });
}

const glossaryTermMap = buildGlossaryIndex();
writeFile(path.join(SITE_DIR, 'glossary', 'index.html'), renderGlossary(glossaryTermMap));
pageCount++;
// Per-term pages
for (const [term, entry] of glossaryTermMap.entries()) {
  writeFile(
    path.join(SITE_DIR, 'glossary', slugify(term), 'index.html'),
    renderGlossaryTermPage(term, entry)
  );
  pageCount++;
}

// =============================================================
// SEARCH PAGE
// =============================================================
function renderSearchPage() {
  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <span class="current">Search</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">Search / University</div>
    <h1>Find the lesson you need.</h1>
    <p class="track-hero-lead">Search across all ${allLessonsForSearch.length} lessons by title, outcome, or body content.</p>
    <div class="search-box">
      <input type="search" id="search-input" class="search-input" placeholder="Search lessons, e.g. \"rack rate\" or \"K8s scheduling\"" autofocus aria-label="Search lessons">
    </div>
    <div class="search-results" id="search-results"></div>
  </div>
</section>

<script>
const idx = ${JSON.stringify(allLessonsForSearch)};
const input = document.getElementById('search-input');
const results = document.getElementById('search-results');

function search(q) {
  if (!q || q.length < 2) {
    results.innerHTML = '<p style="color: var(--g-600); padding: 32px 0;">Type at least 2 characters to search.</p>';
    return;
  }
  const tokens = q.toLowerCase().split(/\\s+/).filter(t => t.length > 1);
  const matches = idx
    .map(item => {
      const haystack = (item.title + ' ' + item.outcome + ' ' + item.body).toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (item.title.toLowerCase().includes(t)) score += 10;
        if (item.outcome.toLowerCase().includes(t)) score += 5;
        if (haystack.includes(t)) score += 1;
      }
      return { ...item, score };
    })
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30);

  if (matches.length === 0) {
    results.innerHTML = '<p style="color: var(--g-600); padding: 32px 0;">No matches. Try fewer or different words.</p>';
    return;
  }

  results.innerHTML = matches.map(m => {
    const snippet = m.outcome.slice(0, 220) || m.body.slice(0, 220);
    return \`
<a href="\${m.url}" class="search-result">
  <div class="search-result-meta">\${m.track} · \${m.module}</div>
  <div class="search-result-title">\${m.title}</div>
  <div class="search-result-snippet">\${snippet}\${snippet.length >= 220 ? '…' : ''}</div>
</a>\`;
  }).join('');
}

input.addEventListener('input', e => search(e.target.value));

// URL query support
const urlQ = new URLSearchParams(location.search).get('q');
if (urlQ) {
  input.value = urlQ;
  search(urlQ);
} else {
  search('');
}
</script>`;

  return pageHTML({
    title: 'Search / ZopDev University',
    description: `Search ${allLessonsForSearch.length} lessons across all tracks.`,
    canonical: 'https://zop.dev/resources/university/search/',
    uniNav: 'search',
    body,
  });
}

writeFile(path.join(SITE_DIR, 'search', 'index.html'), renderSearchPage());
pageCount++;

// =============================================================
// 404
// =============================================================
function render404() {
  const body = `
<section class="section">
  <div class="container" style="text-align: center; padding: 80px 0;">
    <div class="track-hero-meta" style="justify-content: center;">Error · 404</div>
    <h1 style="font-size: clamp(48px, 8vw, 96px); font-weight: 600; letter-spacing: -0.04em; line-height: 1; margin: 32px 0; color: var(--ink);">Couldn't find that lesson.</h1>
    <p style="font-size: 18px; color: var(--g-600); max-width: 480px; margin: 0 auto 32px;">The link may have moved. Try searching, or jump back to the curriculum.</p>
    <div class="hero-cta" style="justify-content: center;">
      <a href="${BASE}/" class="btn btn-primary">Back to University <span class="arrow">→</span></a>
      <a href="${BASE}/search/" class="btn btn-secondary">Search lessons</a>
    </div>
  </div>
</section>`;
  return pageHTML({
    title: '404 · ZopDev University',
    description: 'Page not found.',
    canonical: 'https://zop.dev/resources/university/404/',
    body,
  });
}

writeFile(path.join(SITE_DIR, '404.html'), render404());
pageCount++;

// =============================================================
// SITEMAP
// =============================================================
const urls = [
  { loc: 'https://zop.dev/resources/university/', priority: '1.0' },
  { loc: 'https://zop.dev/resources/university/certifications/', priority: '0.9' },
  { loc: 'https://zop.dev/resources/university/certifications/verify/', priority: '0.8' },
  { loc: 'https://zop.dev/resources/university/certifications/operator/sample/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/certifications/engineer/sample/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/certifications/architect/sample/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/glossary/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/search/', priority: '0.6' },
];
for (const t of tracks) {
  urls.push({ loc: `https://zop.dev/resources/university/${t.slug}/`, priority: '0.9' });
  for (const m of t.modules) {
    urls.push({ loc: `https://zop.dev/resources/university/${t.slug}/${m.slug}/`, priority: '0.8' });
    for (const l of m.lessons) {
      urls.push({ loc: `https://zop.dev/resources/university/${t.slug}/${m.slug}/${l.slug}/`, priority: '0.7' });
    }
  }
}
// Glossary per-term pages
for (const term of glossaryTermMap.keys()) {
  urls.push({ loc: `https://zop.dev/resources/university/glossary/${slugify(term)}/`, priority: '0.5' });
}

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>2026-05-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
writeFile(path.join(SITE_DIR, 'sitemap.xml'), sitemap);

// =============================================================
// ROBOTS.TXT
// =============================================================
const robots = `User-agent: *
Allow: /

# LLM crawlers — explicitly allowed
User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: CCBot
Allow: /

Sitemap: https://zop.dev/resources/university/sitemap.xml
`;
writeFile(path.join(SITE_DIR, 'robots.txt'), robots);

// =============================================================
// FAVICON (inline SVG)
// =============================================================
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="#FAF7EC"/>
  <rect x="6" y="6" width="14" height="14" fill="#2A4494"/>
  <circle cx="16" cy="10" r="3" fill="#FAF7EC"/>
</svg>`;
writeFile(path.join(SITE_DIR, 'assets', 'favicon.svg'), favicon);

// =============================================================
// VERCEL CONFIG
// =============================================================
const vercelConfig = {
  "trailingSlash": true,
  "cleanUrls": true,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
};
writeFile(path.join(SITE_DIR, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));

// =============================================================
// DONE
// =============================================================
console.log(`✅ Generated ${pageCount} HTML pages`);
console.log(`✅ Sitemap: ${urls.length} URLs`);
console.log(`✅ Search index: ${allLessonsForSearch.length} lessons`);
console.log(`✅ robots.txt, vercel.json, favicon written`);
console.log(`\n📁 Output: ${SITE_DIR}`);
console.log(`\nDeploy:`);
console.log(`  cd "${SITE_DIR}"`);
console.log(`  vercel deploy --prod`);
