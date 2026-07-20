#!/usr/bin/env node
/**
 * ZopDev University — Static site generator
 * Reads all markdown lessons; generates static HTML under site/
 * Vercel-deployable. No framework.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const TRACKS_DIR = path.join(ROOT, 'tracks');
const SITE_DIR = path.join(ROOT, 'site');

// BASE_URL: production path prefix. Empty for local preview.
// Set BASE_URL=/resources/university for prod build:
//   BASE_URL=/resources/university node build.js
const BASE = process.env.BASE_URL || '';
const ABS_BASE = 'https://zop.dev/resources/university';

// Cache-busting asset versions. styles.css/foot-globe.js are served with a
// long "immutable" cache under a filename that never changes, so returning
// visitors would otherwise keep a stale stylesheet across deploys and the
// site could look broken. Append ?v=<content-hash> so every content change is
// a fresh URL that bypasses the cache; unchanged files keep the same URL.
function assetVer(relPath) {
  try {
    const buf = fs.readFileSync(path.join(SITE_DIR, relPath));
    return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
  } catch (e) { return ''; }
}
const CSS_VER = assetVer('assets/styles.css');
const JS_VER = assetVer('assets/foot-globe.js');
const CSS_HREF = `${BASE}/assets/styles.css${CSS_VER ? '?v=' + CSS_VER : ''}`;
const JS_SRC = `${BASE}/assets/foot-globe.js${JS_VER ? '?v=' + JS_VER : ''}`;
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
    title: 'ZopDev Certified: Operator',
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
    title: 'ZopDev Certified: Engineer',
    short: 'Engineer',
    eyebrow: 'Course / Engineer',
    tier: 'Engineer',
    desc: 'Read the 450+ rule library, reason about evidence, configure auto-remediation, schedule K8s and Databricks workloads, pre-scale for events, optimize Bedrock. The depth tier for engineers building cost-aware systems.',
    time: '10 hours',
    audience: 'Platform Engineer / SRE / ML Engineer',
  },
  {
    id: 'T3', code: 'T3', slug: 'architect',
    dir: 'T3_zopnight_architect',
    title: 'ZopDev Certified: Architect',
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
// ROLE-BASED LEARNING PATHS (mirrors paths/00_README.md table)
// =============================================================
const PATHS = [
  { slug: 'platform-engineer',  file: 'platform_engineer.md',  title: 'Platform / DevOps Engineer', audience: 'Hands-on platform engineering',      duration: '14 hours', cert: 'Operator, then Engineer' },
  { slug: 'finops-analyst',     file: 'finops_analyst.md',     title: 'FinOps Analyst',             audience: 'FinOps practitioners',              duration: '12 hours', cert: 'Operator, then Engineer' },
  { slug: 'engineering-leader', file: 'engineering_leader.md', title: 'Engineering Leader',         audience: 'Eng directors and VPs',             duration: '6 hours',  cert: 'No cert required' },
  { slug: 'finance-partner',    file: 'finance_partner.md',    title: 'Finance Partner',            audience: 'FP&A and procurement',              duration: '5 hours',  cert: 'No cert required' },
  { slug: 'security-compliance',file: 'security_compliance.md',title: 'Security / Compliance',      audience: 'Security architects and compliance',duration: '10 hours', cert: 'Architect track' },
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

// Resolve a markdown link target to the right destination HTML.
// Shared by the body renderer and the lesson meta-box so both handle
// glossary refs, sibling-lesson refs, escaped repo refs, and bare .md
// links consistently (no raw "[L1](L1_foo.md)" leaking to the page).
function resolveMdLink(txt, url) {
  const glossaryM = url.match(/reference\/glossary\/([^)\/]+?)\.md$/i);
  if (glossaryM) return `<a href="${BASE}/glossary/${slugify(glossaryM[1])}/">${txt}</a>`;
  // Escaped the repo (../../../../…): render as plain prose, no dead href.
  if (/^(?:\.\.\/){4,}/.test(url)) return txt;
  // Sibling lesson (L1_six_principles.md → ../six-principles/).
  const sib = url.match(/(?:^|\/)L\d+_(.+?)\.md$/i);
  if (sib) return `<a href="../${slugify(sib[1])}/">${txt}</a>`;
  // Any other unresolved .md target → plain prose (avoid a dead link).
  if (/\.md(?:#.*)?$/i.test(url)) return txt;
  const isExternal = /^https?:\/\//.test(url);
  const target = isExternal ? ' target="_blank" rel="noopener"' : '';
  return `<a href="${url}"${target}>${txt}</a>`;
}

// Render a lesson meta-box value: escape, tidy separators, then linkify
// any markdown links via the shared resolver.
function renderMetaVal(v) {
  let t = escapeHTML(String(v)).replace(/\s*[·]\s*/g, ' / ');
  return t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, txt, url) => resolveMdLink(txt, url));
}

// Render an authored ASCII "grouped dropdown" mock as a styled UI-mock
// component (the pattern from the lesson design prototype). The source .md is
// left byte-for-byte intact — only the rendered HTML upgrades from a raw
// <pre> to the dropdown chrome. Fires ONLY when the block's first non-empty
// line is a "[Label ▾]" bar AND it carries at least two "[ ]"/"[✓]" rows, so
// the many other ASCII diagrams that merely contain "▾" are never touched.
// Returns an HTML string, or null to fall back to <pre>.
function renderUiMock(rawLines) {
  const lines = rawLines.slice();
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  if (!lines.length) return null;
  const barM = lines[0].match(/^\s*\[(.+?)\s*▾\s*\]\s*(.*)$/);
  if (!barM) return null;
  const cbCount = lines.filter(l => /^\s*\[[ ✓xX]\]/.test(l)).length;
  if (cbCount < 2) return null;

  const barLabel = escapeHTML(barM[1].trim());
  const barRight = escapeHTML(barM[2].trim());
  const rows = [];
  for (let k = 1; k < lines.length; k++) {
    const raw = lines[k];
    if (raw.trim() === '') continue;
    // Skip a pure rule/separator line (box-drawing or dashes) — the styled
    // bar already carries its own divider.
    if (/^[\s─—–\-_=]+$/.test(raw)) continue;
    const indented = /^\s/.test(raw);
    const cbM = raw.match(/^(\s*)\[([^\]]*)\]\s*(.*)$/);
    if (cbM) {
      const on = /[✓xX]/.test(cbM[2]);
      const parts = cbM[3].split(/\s{2,}/);
      const nm = escapeHTML((parts.shift() || '').trim());
      const right = escapeHTML(parts.join(' ').trim());
      if (indented) {
        rows.push(`<div class="uimock-item${on ? ' on' : ''}"><span class="uimock-cb">${on ? '✓' : '☐'}</span><span class="uimock-nm">${nm}</span><span class="uimock-id">${right}</span></div>`);
      } else {
        rows.push(`<div class="uimock-grp"><span class="uimock-gname">${on ? '✓ ' : '☐ '}${nm}</span><span class="uimock-ct">${right}</span></div>`);
      }
    } else {
      // continuation marker (e.g. "...") — muted, no checkbox
      rows.push(`<div class="uimock-item uimock-cont"><span class="uimock-cb"></span><span class="uimock-nm">${escapeHTML(raw.trim())}</span></div>`);
    }
  }
  return `<div class="uimock" role="img" aria-label="${barLabel} dropdown">
  <div class="uimock-bar"><span>${barLabel} ▾</span><span class="uimock-sel">${barRight}</span></div>
  ${rows.join('\n  ')}
</div>\n`;
}

// Interactive multiple-choice "quick check". Lessons author these as:
//   ### Q1
//   <stem line(s)>
//   A. option
//   B. option
//   C. option
//   D. option
//   <details><summary>Show answer</summary>
//   **Correct: B.** explanation …
//   </details>
// Rendered as a clickable .check card (options grade green/red on click and
// reveal the explanation) — the pattern from the lesson-design prototype —
// instead of the run-on "A. … B. … C. …" paragraph + answer accordion.
// The source .md is untouched. Returns { html, next } or null (fall back to
// the normal heading/paragraph rendering) when the block does not match.
function tryParseMcq(lines, startIdx, renderInline) {
  if (!/^###\s+Q\d+\s*$/i.test(lines[startIdx])) return null;
  let j = startIdx + 1;
  while (j < lines.length && lines[j].trim() === '') j++;
  const stem = [];
  while (j < lines.length && lines[j].trim() !== '' && !/^[A-D]\.\s+/.test(lines[j])) {
    stem.push(lines[j].trim()); j++;
  }
  while (j < lines.length && lines[j].trim() === '') j++;
  const opts = [];
  while (j < lines.length) {
    const m = lines[j].match(/^([A-D])\.\s+(.+)$/);
    if (!m) break;
    opts.push({ letter: m[1], text: m[2].trim() });
    j++;
  }
  if (stem.length === 0 || opts.length < 2) return null;
  while (j < lines.length && lines[j].trim() === '') j++;
  const explainLines = [];
  if (j < lines.length && lines[j].trim().startsWith('<details>')) {
    j++;
    while (j < lines.length && !lines[j].trim().startsWith('</details>')) {
      const t = lines[j].trim();
      if (t === '' || t.startsWith('<summary') || t.startsWith('</summary')) { j++; continue; }
      explainLines.push(lines[j]); j++;
    }
    if (j < lines.length && lines[j].trim().startsWith('</details>')) j++;
  }
  const joined = explainLines.join(' ').trim();
  const cm = joined.match(/Correct:\s*([A-D])\b/i);
  if (!cm) return null; // no answer key parsed — leave the block as authored
  const correct = cm[1].toUpperCase();
  const optsHTML = opts.map(o =>
    `<button class="opt"${o.letter === correct ? ' data-correct="1"' : ''}><span class="letter">${o.letter}</span>${renderInline(o.text)}</button>`
  ).join('\n    ');
  const html = `<div class="check">
    <div class="check-tag"><span class="check-sq"></span>Quick check</div>
    <p class="check-q">${renderInline(stem.join(' '))}</p>
    ${optsHTML}
    <div class="explain">${renderInline(joined)}</div>
  </div>\n`;
  return { html, next: j };
}

// Minimal markdown → HTML renderer
let __dgmSeq = 0; // global sequence for namespacing inlined-diagram marker ids
function renderMarkdown(md, srcPath) {
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
    // Footer attribution line ("§ Authored by … · Lesson ID: …"): drop the
    // authoring § marker and render as a muted attribution block.
    if (/^§/.test(text)) {
      return `<p class="lesson-attribution">${renderInline(text.replace(/^§\s*/, ''))}</p>\n`;
    }
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
      // generated per-term page so the link actually resolves. The per-term
      // page is keyed by the slug of the DISPLAY text (see buildGlossaryIndex),
      // so slug the display text here — slugging the filename ("oauth.md")
      // instead produced /glossary/oauth/ while the page lived at
      // /glossary/oauth-2-0/, a 404. Guard against terms that never produced
      // a page (GLOSSARY_SLUGS) and fall back to plain prose.
      const glossaryM = url.match(/reference\/glossary\/([^)\/]+?)\.md$/i);
      if (glossaryM) {
        const textSlug = slugify(txt);
        const fileSlug = slugify(glossaryM[1]);
        if (typeof GLOSSARY_SLUGS === 'undefined') {
          return `<a href="${BASE}/glossary/${textSlug}/">${txt}</a>`;
        }
        if (GLOSSARY_SLUGS.has(textSlug)) return `<a href="${BASE}/glossary/${textSlug}/">${txt}</a>`;
        if (GLOSSARY_SLUGS.has(fileSlug)) return `<a href="${BASE}/glossary/${fileSlug}/">${txt}</a>`;
        return txt;
      }
      const isExternal = /^https?:\/\//.test(url);
      if (isExternal) return `<a href="${url}" target="_blank" rel="noopener">${txt}</a>`;
      if (/^(mailto:|tel:|#)/.test(url)) return `<a href="${url}">${txt}</a>`;
      // Cross-lesson / cross-module reference authored as a relative .md path
      // (../M3.3_.../L1_foo.md, ../../T4_.../00_README.md). Resolve it against
      // the lesson-source index to the generated page URL. Anything that does
      // not resolve — renamed modules, deleted lessons, cross-repo escapes
      // like ../../../../USE-CASES.md, quiz stubs that were never authored — is
      // rendered as plain prose so the site never emits a dead internal href.
      // The lesson source is left byte-for-byte intact.
      const mdM = url.match(/\.md(#.*)?$/i);
      if (mdM && typeof LESSON_URL_BY_SRC !== 'undefined' && srcPath) {
        const rel = url.replace(/#.*$/, '');
        const abs = path.normalize(path.join(path.dirname(srcPath), rel));
        const resolved = LESSON_URL_BY_SRC.get(abs);
        // Re-append any #section anchor so a resolved link lands on the section.
        if (resolved) return `<a href="${resolved}${mdM[1] || ''}">${txt}</a>`;
        return txt;
      }
      if (mdM) return txt; // .md link with no resolution context: never emit dead href
      // Cross-repo escapes (4+ levels up) render as plain prose, not a dead href.
      if (/^(?:\.\.\/){4,}/.test(url)) return txt;
      return `<a href="${url}">${txt}</a>`;
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
        const mock = renderUiMock(codeBuf);
        if (mock) out.push(mock);
        else out.push(`<pre><code${codeLang ? ` class="lang-${codeLang}"` : ''}>${escapeHTML(codeBuf.join('\n'))}</code></pre>\n`);
        codeBuf = [];
      }
      i++; continue;
    }
    if (inCode) { codeBuf.push(line); i++; continue; }

    // Diagram callout. Editorial placeholders for a planned diagram, authored
    // in a few phrasings: "(Asset: `assets/diagrams/X.svg`.)",
    // "(Asset: `X.svg` — caption.)", "(Asset to produce: <desc>. Path: `X.svg`.)"
    // and "(SVG to be produced — see `X.svg` once issued.)". Match any
    // standalone parenthesized callout that references an assets/diagrams SVG.
    // If the SVG exists it is inlined as a theme-aware <figure>; if not, the
    // placeholder is dropped entirely so it never leaks into published prose.
    const dgmTrim = line.trim();
    const isAssetCallout = dgmTrim.startsWith('(') && dgmTrim.endsWith(')') && (
      /`assets\/[A-Za-z0-9_.\/-]+`/.test(dgmTrim) ||
      /\b(Asset to produce|SVG to be produced|Annotated screenshot|Demo asset to produce)\b/i.test(dgmTrim)
    );
    const dgmRef = dgmTrim.match(/`(assets\/diagrams\/[A-Za-z0-9_.\/-]+\.svg)`/);
    if (isAssetCallout) {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      if (inList) { out.push(`</${listType}>\n`); inList = false; }
      // Screenshot placeholders and not-yet-produced diagrams are dropped
      // entirely; only an existing assets/diagrams SVG is inlined.
      const rel = dgmRef ? dgmRef[1] : null;
      if (!rel) { i++; continue; }
      // Reject path traversal — only files strictly under assets/diagrams/ are
      // ever read and inlined (the SVG is emitted unescaped, so an escape could
      // inline arbitrary local content).
      if (!rel.includes('..')) {
        const svgPath = path.join(ROOT, rel);
        if (fs.existsSync(svgPath)) {
          let svg = fs.readFileSync(svgPath, 'utf8').replace(/<\?xml[^>]*\?>\s*/i, '').trim();
          // Namespace the internal marker id per figure so two diagrams on one
          // page cannot collide on a duplicate id.
          const uid = 'd' + (__dgmSeq++);
          svg = svg.replace(/dgmArrow/g, 'dgmArrow_' + uid);
          // Caption: "Asset to produce: <cap>. Path:" or trailing "— <cap>.".
          let cap = '';
          const cm1 = dgmTrim.match(/Asset to produce:\s*(.+?)\.\s*Path:/i);
          const cm2 = dgmTrim.match(/\.svg`?\s*[—–-]\s*([^)]*?)\.?\)$/);
          if (cm1) cap = cm1[1]; else if (cm2) cap = cm2[1];
          cap = cap.trim().replace(/\.$/, '');
          const capHTML = cap ? `<figcaption>${escapeHTML(cap.charAt(0).toUpperCase() + cap.slice(1))}</figcaption>` : '';
          out.push(`<figure class="lesson-diagram">${svg}${capHTML}</figure>\n`);
        } else {
          console.warn(`⚠️  diagram referenced but missing: ${rel} (in ${srcPath ? path.relative(ROOT, srcPath) : 'unknown'})`);
        }
      }
      i++; continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
      if (inList) { out.push(`</${listType}>\n`); inList = false; }
      out.push('<hr>\n');
      i++; continue;
    }

    // Interactive MCQ quick-check (### Qn + options + answer details)
    if (/^###\s+Q\d+\s*$/i.test(line)) {
      const mcq = tryParseMcq(lines, i, renderInline);
      if (mcq) {
        if (paraBuf.length) { out.push(flushPara(paraBuf)); paraBuf = []; }
        if (inList) { out.push(`</${listType}>\n`); inList = false; }
        out.push(mcq.html);
        i = mcq.next; continue;
      }
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
// PARSE KNOWLEDGE-CHECK QUESTIONS
// =============================================================
// Lessons carry their self-check questions under a "## N. Knowledge
// check" section. Each question is a "### Qn" block: a stem, plain
// lettered options (A./B./C./D., one per line, NOT a markdown list),
// then a <details> answer block whose first bold token is
// "**Correct: X.**" followed by the explanation prose. The correct
// answer lives ONLY in that string today, so this is the single source
// of truth for the option key. Returns [{ stem, options:[{key,text}],
// correct, explanation }]. Malformed questions are skipped, not thrown.
function parseKnowledgeCheck(lines) {
  const questions = [];

  // Locate the knowledge-check section ("## Knowledge check" or
  // "## 4. Knowledge check" — the number varies by lesson).
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s+(?:\d+\.\s*)?knowledge check\b/i.test(lines[i].trim())) { start = i; break; }
  }
  if (start === -1) return questions;

  // Section ends at the next H2 (## ...) or EOF.
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s+/.test(lines[i].trim())) { end = i; break; }
  }

  // Question boundaries: each "### Qn" heading.
  const qStarts = [];
  for (let i = start + 1; i < end; i++) {
    if (/^###\s+Q\d+/i.test(lines[i].trim())) qStarts.push(i);
  }

  for (let qi = 0; qi < qStarts.length; qi++) {
    const s = qStarts[qi];
    const e = qi + 1 < qStarts.length ? qStarts[qi + 1] : end;
    const block = lines.slice(s + 1, e);

    const stemLines = [];
    const options = [];
    let correct = '';
    let explanation = '';
    let mode = 'stem'; // stem -> options -> details
    let inDetails = false;

    for (const line of block) {
      const t = line.trim();
      if (/^<details>/i.test(t)) { inDetails = true; mode = 'details'; continue; }
      if (/^<\/details>/i.test(t)) { inDetails = false; continue; }
      if (/^<summary>/i.test(t)) continue;

      if (inDetails) {
        const cm = t.match(/^\*\*Correct:\s*([A-D])\.?\*\*\s*(.*)$/i);
        if (cm) { correct = cm[1].toUpperCase(); if (cm[2]) explanation = cm[2].trim(); continue; }
        if (correct && t) explanation += (explanation ? ' ' : '') + t;
        continue;
      }

      const om = line.match(/^\s*([A-D])\.\s+(.+)$/);
      if (om) { options.push({ key: om[1].toUpperCase(), text: om[2].trim() }); mode = 'options'; continue; }

      // Continuation line for a wrapped option (indented, no letter).
      if (mode === 'options' && t && options.length) { options[options.length - 1].text += ' ' + t; continue; }

      // Everything before the first option is stem prose.
      if (mode === 'stem' && t) stemLines.push(t);
    }

    const stem = stemLines.join(' ').trim();
    if (stem && options.length >= 2 && correct && options.some(o => o.key === correct)) {
      questions.push({ stem, options, correct, explanation });
    }
  }

  return questions;
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

  const questions = parseKnowledgeCheck(lines);

  return { title, signature, meta, outcome, raw: md, questions };
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
      // Title-case the slug, but honor acronyms (SSO, RBAC, …) and keep
      // small joiner words lowercase so module titles read correctly.
      const ACRONYMS = { sso: 'SSO', rbac: 'RBAC', pat: 'PAT', iac: 'IaC', cdcr: 'CDCR', ml: 'ML', vm: 'VM', mcp: 'MCP', k8s: 'K8s', finops: 'FinOps' };
      const JOINERS = new Set(['and', 'or', 'vs']);
      const modTitle = modTitleSlug.split('_').map((w, i) => {
        if (ACRONYMS[w]) return ACRONYMS[w];
        if (i > 0 && JOINERS.has(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      }).join(' ');

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
      <svg class="uni-brand-mark" viewBox="0 0 100 100" aria-hidden="true"><use href="#mark-zopuni"/></svg>
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
        </div>
      </div>
      <a href="${BASE}/paths/" class="uni-link ${cls('paths')}">Paths</a>
      <div class="uni-dropdown" data-uni-dropdown>
        <button class="uni-link uni-dropdown-toggle ${cls('prepare')}" type="button"
                aria-expanded="false" aria-controls="uni-prepare-menu">
          Prepare &amp; verify
          <span class="uni-caret" aria-hidden="true"></span>
        </button>
        <div class="uni-dropdown-menu" id="uni-prepare-menu" role="menu">
          <div class="uni-dropdown-section" role="presentation">Preparation</div>
          <a href="${BASE}/certifications/operator/practice/" role="menuitem">Operator preparation</a>
          <a href="${BASE}/certifications/engineer/practice/" role="menuitem">Engineer preparation</a>
          <a href="${BASE}/certifications/architect/prep/" role="menuitem">Architect preparation</a>
          <div class="uni-dropdown-divider" role="separator"></div>
          <div class="uni-dropdown-section" role="presentation">Verify &amp; records</div>
          <a href="${BASE}/certifications/operator/sample/" role="menuitem">Sample certificate</a>
          <a href="${BASE}/certifications/verify/" role="menuitem">Verify a credential</a>
          <a href="${BASE}/certifications/registry/" role="menuitem">Public registry</a>
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
      <svg viewBox="27 105 3817 1365"><use href="#logo-zopdev"/></svg>
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
          <svg class="foot-globe-logo" viewBox="27 105 3817 1365" aria-hidden="true">
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
      <div class="foot-globe-right">
        <div class="foot-regions-v2" id="foot-regions-v2">
          <canvas id="foot-regions-map"></canvas>
        </div>
      </div>
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
      <svg viewBox="27 105 3817 1365"><use href="#logo-zopdev"/></svg>
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
  // Strip markdown before it reaches meta/OG/Twitter descriptions — lesson
  // outcomes carry **bold** emphasis that would otherwise render as literal
  // asterisks in search snippets and social cards. Trim to a sane length.
  let ogDesc = stripMd(description || 'Cloud cost optimization curriculum. 237 lessons across 7 courses. Operator, Engineer, Architect certifications.');
  if (ogDesc.length > 300) ogDesc = ogDesc.slice(0, 297).replace(/\s+\S*$/, '') + '…';
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
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="en_US">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@zopdev">
<meta name="twitter:title" content="${escapeHTML(title)}">
<meta name="twitter:description" content="${escapeHTML(ogDesc)}">
<meta name="twitter:image" content="${ogImage || 'https://zop.dev/resources/university/og/default.png'}">

${schema || ''}

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${CSS_HREF}">
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
    <symbol id="mark-zopdev" viewBox="0 0 100 100">
      <rect x="0"  y="0"  width="50" height="50" fill="#2A4494"/>
      <rect x="50" y="0"  width="50" height="50" fill="#F58549"/>
      <rect x="50" y="50" width="50" height="50" fill="#7FB236"/>
    </symbol>
    <symbol id="mark-zopuni" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="16" fill="#2A4494"/>
      <path d="M 38 27 Q -12 50 38 73 Q 16 50 38 27 Z" fill="#FFFFFF"/>
      <path d="M 62 27 Q 112 50 62 73 Q 84 50 62 27 Z" fill="#FFFFFF"/>
      <polygon points="50,30 52.47,42.39 61.76,33.82 56.47,45.3 69.02,43.82 58,50 69.02,56.18 56.47,54.7 61.76,66.18 52.47,57.61 50,70 47.53,57.61 38.24,66.18 43.53,54.7 30.98,56.18 42,50 30.98,43.82 43.53,45.3 38.24,33.82 47.53,42.39" fill="#FFFFFF"/>
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
    <symbol id="logo-zopdev" viewBox="27 105 3817 1365">
      <path d="M27.00054931640625 1250.0V1145.7156982421875L279.14434814453125 861.7127685546875H30.28631591796875V754.0H427.42791748046875V858.2843017578125L171.85565185546875 1142.2872314453125H432.42791748046875V1250.0Z M732.8571166992188 1262.0Q658.2857666015625 1262.0 598.2858581542969 1229.1428833007812Q538.2859497070312 1196.2857666015625 503.214599609375 1137.3572082519531Q468.14324951171875 1078.4286499023438 468.14324951171875 1001.9838279868072Q468.14324951171875 924.5713500976562 503.2860412597656 866.1427917480469Q538.4288330078125 807.7142333984375 598.9287414550781 774.8571166992188Q659.4286499023438 742.0 733.1310610014816 742.0Q807.8571166992188 742.0 867.7855834960938 774.8571166992188Q927.7140502929688 807.7142333984375 962.785400390625 866.1427917480469Q997.8567504882812 924.5713500976562 997.8567504882812 1001.9838279868072Q997.8567504882812 1078.4286499023438 962.7139587402344 1137.3572082519531Q927.5711669921875 1196.2857666015625 867.5712585449219 1229.1428833007812Q807.5713500976562 1262.0 732.8571166992188 1262.0ZM732.7415504026949 1149.7158813476562Q769.0003662109375 1149.7158813476562 798.8578491210938 1133.2156982421875Q828.71533203125 1116.7155151367188 846.4298400878906 1083.898556271115Q864.1443481445312 1051.081597405511 864.1443481445312 1002.4092539194468Q864.1443481445312 952.9994506835938 846.0727233886719 920.1419677734375Q828.0010986328125 887.2844848632812 798.5721740722656 870.7843017578125Q769.1432495117188 854.2841186523438 733.5714416503906 854.2841186523438Q697.9996337890625 854.2841186523438 667.9998198774524 870.9115803654033Q638.0000059658423 887.5390420784628 619.9278289106555 920.0549672062236Q601.8556518554688 952.5708923339844 601.8556518554688 1002.0837783239838Q601.8556518554688 1050.857666015625 619.5701599121094 1083.7865905761719Q637.28466796875 1116.7155151367188 667.2536891980118 1133.2156982421875Q697.2227104272736 1149.7158813476562 732.7415504026949 1149.7158813476562Z M1042.5720825195312 1470.0V754.0H1172.5702514648438V824.5718994140625Q1196.5702514648438 791.714599609375 1236.2133178710938 766.8572998046875Q1275.8563842773438 742.0 1338.142333984375 742.0Q1407.9996337890625 742.0 1462.9996337890625 776.0Q1517.9996337890625 810.0 1549.7853088378906 869.0Q1581.5709838867188 928.0 1581.5709838867188 1003.0Q1581.5709838867188 1077.1428833007812 1549.7853088378906 1136.0714416503906Q1517.9996337890625 1195.0 1462.9996337890625 1228.5Q1407.9996337890625 1262.0 1337.9994506835938 1262.0Q1281.8563842773438 1262.0 1240.2133178710938 1241.0712585449219Q1198.5702514648438 1220.1425170898438 1172.5702514648438 1182.57080078125V1470.0ZM1309.2859497070312 1148.7158813476562Q1350.2863159179688 1148.7158813476562 1382.1437072753906 1129.7156982421875Q1414.0010986328125 1110.7155151367188 1431.8583984375 1077.7865905761719Q1449.7156982421875 1044.857666015625 1449.7156982421875 1002.8571166992188Q1449.7156982421875 959.9994506835938 1431.8583984375 926.5705261230469Q1414.0010986328125 893.1416015625 1382.1437072753906 874.2128601074219Q1350.2863159179688 855.2841186523438 1309.2859497070312 855.2841186523438Q1268.428466796875 855.2841186523438 1236.9281921386719 874.2128601074219Q1205.4279174804688 893.1416015625 1187.5706176757812 926.1419677734375Q1169.7133178710938 959.142333984375 1169.7133178710938 1002.0Q1169.7133178710938 1044.857666015625 1187.5706176757812 1077.7865905761719Q1205.4279174804688 1110.7155151367188 1236.9281921386719 1129.7156982421875Q1268.428466796875 1148.7158813476562 1309.2859497070312 1148.7158813476562Z M1848.7147827148438 1262.0Q1778.8574829101562 1262.0 1723.4289245605469 1228.0Q1668.0003662109375 1194.0 1636.2146911621094 1134.5714416503906Q1604.4290161132812 1075.1428833007812 1604.4290161132812 1001.0Q1604.4290161132812 926.0 1636.2146911621094 867.5Q1668.0003662109375 809.0 1723.5003662109375 775.5Q1779.0003662109375 742.0 1848.857666015625 742.0Q1905.000732421875 742.0 1946.7152404785156 762.9287414550781Q1988.4297485351562 783.8574829101562 2013.4297485351562 821.42919921875V530.0H2143.4279174804688V1250.0H2013.4297485351562V1179.4281005859375Q1990.286865234375 1212.1425170898438 1950.7152404785156 1237.0712585449219Q1911.1436157226562 1262.0 1848.7147827148438 1262.0ZM1876.7140502929688 1148.7158813476562Q1917.7144165039062 1148.7158813476562 1949.1432495117188 1129.7156982421875Q1980.5720825195312 1110.7155151367188 1998.4293823242188 1077.3580322265625Q2016.2866821289062 1044.0005493164062 2016.2866821289062 1002.0Q2016.2866821289062 959.142333984375 1998.4293823242188 926.1419677734375Q1980.5720825195312 893.1416015625 1949.1432495117188 874.2128601074219Q1917.7144165039062 855.2841186523438 1876.7140502929688 855.2841186523438Q1836.7136840820312 855.2841186523438 1804.7848510742188 874.2128601074219Q1772.8560180664062 893.1416015625 1754.9987182617188 925.7134094238281Q1737.1414184570312 958.2852172851562 1737.1414184570312 1001.1428833007812Q1737.1414184570312 1044.0005493164062 1754.9987182617188 1077.3580322265625Q1772.8560180664062 1110.7155151367188 1804.7848510742188 1129.7156982421875Q1836.7136840820312 1148.7158813476562 1876.7140502929688 1148.7158813476562Z M2446.1427001953125 1262.0Q2370.1428833007812 1262.0 2311.8572998046875 1229.5Q2253.5717163085938 1197.0 2220.8574829101562 1139.3571166992188Q2188.1432495117188 1081.7142333984375 2188.1432495117188 1006.1427001953125Q2188.1432495117188 928.85693359375 2220.3574829101562 869.1427001953125Q2252.5717163085938 809.428466796875 2311.0001831054688 775.7142333984375Q2369.4286499023438 742.0 2446.428466796875 742.0Q2520.1427001953125 742.0 2576.285400390625 774.0714416503906Q2632.4281005859375 806.1428833007812 2663.7136840820312 861.1427917480469Q2694.999267578125 916.1427001953125 2694.999267578125 985.5709838867188Q2694.999267578125 995.5709838867188 2694.999267578125 1007.8566589355469Q2694.999267578125 1020.142333984375 2693.1421508789062 1033.2852172851562H2281.5706176757812V952.7144165039062H2563.5726318359375Q2560.5726318359375 904.57080078125 2527.857940673828 875.9989929199219Q2495.1432495117188 847.4271850585938 2446.85693359375 847.4271850585938Q2411.2852172851562 847.4271850585938 2381.284942626953 863.1416015625Q2351.28466796875 878.8560180664062 2333.7130432128906 910.4990844726562Q2316.1414184570312 942.1421508789062 2316.1414184570312 990.5709838867188V1019.2852172851562Q2316.1414184570312 1061.4288330078125 2332.998809814453 1092.2149658203125Q2349.856201171875 1123.0010986328125 2379.07080078125 1139.3583984375Q2408.285400390625 1155.7156982421875 2445.2855834960938 1155.7156982421875Q2483.2861328125 1155.7156982421875 2509.2864990234375 1138.7154235839844Q2535.286865234375 1121.7151489257812 2548.7155151367188 1093.714599609375H2680.999267578125Q2667.2850341796875 1141.2859497070312 2634.428009033203 1179.4287414550781Q2601.5709838867188 1217.571533203125 2553.7139587402344 1239.7857666015625Q2505.85693359375 1262.0 2446.1427001953125 1262.0Z M2899.5726318359375 1250.0 2717.2866821289062 754.0H2853.7133178710938L2979.0 1127.14453125L3103.4295654296875 754.0H3238.856201171875L3056.5702514648438 1250.0Z" fill="currentColor"/>
      <rect x="2994.0" y="105.0" width="425.0" height="425.0" fill="#2A4494"/>
      <rect x="3419.0" y="105.0" width="425.0" height="425.0" fill="#F58549"/>
      <rect x="3419.0" y="530.0" width="425.0" height="425.0" fill="#7FB236"/>
    </symbol>
  </defs>
</svg>

${nav()}
${hideUniNav ? '' : universityNav({ active: uniNav })}
<main id="main">
${body}
</main>
${footer()}
<script defer src="${JS_SRC}"></script>
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
    {"@type": "EducationalOccupationalCredential", "name": "ZopDev Certified: Operator", "credentialCategory": "certification"},
    {"@type": "EducationalOccupationalCredential", "name": "ZopDev Certified: Engineer", "credentialCategory": "certification"},
    {"@type": "EducationalOccupationalCredential", "name": "ZopDev Certified: Architect", "credentialCategory": "certification"}
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
  "description": stripMd(lesson.outcome || lesson.title),
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
        <h3 class="lp-cert-name">ZopDev Certified: Operator</h3>
        <p class="lp-cert-blurb">Run ZopNight in production. Connect, schedule, route, audit.</p>
        <div class="lp-cert-stats"><span>30-min exam</span><span>80% to pass</span></div>
      </a>
      <a href="${BASE}/certifications/#engineer" class="lp-cert-card">
        <div class="lp-cert-seal-wrap">${certSeal('engineer', { size: 'large' })}</div>
        <div class="lp-cert-tier">Tier II</div>
        <h3 class="lp-cert-name">ZopDev Certified: Engineer</h3>
        <p class="lp-cert-blurb">Shape the cost surface. Rules, K8s scheduling, ML inference.</p>
        <div class="lp-cert-stats"><span>45-min exam</span><span>80% to pass</span></div>
      </a>
      <a href="${BASE}/certifications/#architect" class="lp-cert-card">
        <div class="lp-cert-seal-wrap">${certSeal('architect', { size: 'large' })}</div>
        <div class="lp-cert-tier">Tier III</div>
        <h3 class="lp-cert-name">ZopDev Certified: Architect</h3>
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

  // Each module is an expandable accordion: the summary is the module row,
  // opening it reveals that module's lessons inline so a reader can jump
  // straight to any lesson from the track page (track → lesson, one click)
  // and scan the whole syllabus on one screen. Native <details>, no JS.
  // The first module opens by default so the pattern is self-evident.
  const moduleList = track.modules.map((m, idx) => {
    const titleCased = m.title.replace(/^\w/, c => c.toUpperCase());
    const desc = stripMarkdown(m.desc || (m.lessons[0]?.outcome || '')).slice(0, 200);
    const mins = m.lessons.length * 9;
    const lessons = m.lessons.map(l => `      <a class="ml-row" href="${BASE}/${track.slug}/${m.slug}/${l.slug}/">
        <span class="ml-code">${escapeHTML(l.code)}</span>
        <span class="ml-name">${escapeHTML(l.title)}</span>
        <span class="ml-time">~9 min</span>
      </a>`).join('\n');
    return `<details class="m-acc"${idx === 0 ? ' open' : ''} data-mod="${idx + 1}">
  <summary class="m-row">
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
    <span class="m-row-chevron" aria-hidden="true">›</span>
  </summary>
  <div class="m-lessons">
${lessons}
    <a class="ml-open" href="${BASE}/${track.slug}/${m.slug}/">Open module overview <span class="arrow">→</span></a>
  </div>
</details>`;
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
    <p class="track-hero-lead">${escapeHTML(stripMarkdown(track.desc))}</p>
    <div class="track-meta-row">
      <div class="item"><strong>Tier</strong>${escapeHTML(track.tier)}</div>
      <div class="item"><strong>Audience</strong>${escapeHTML(track.audience)}</div>
      <div class="item"><strong>Modules</strong>${track.modules.length}</div>
      <div class="item"><strong>Lessons</strong>${totalLessons}</div>
      <div class="item"><strong>Time</strong>${escapeHTML(track.time)}</div>
    </div>
    <div class="track-progress" data-track="${track.slug}" data-total="${totalLessons}" hidden>
      <div class="track-progress-bar"><div class="track-progress-fill"></div></div>
      <span class="track-progress-label"></span>
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

<script>
// Progress: show this track's completion from localStorage (this device).
(function(){
  var KEY='zopuni:progress:v1';
  var el=document.querySelector('.track-progress');
  if(!el) return;
  var slug=el.getAttribute('data-track');
  var total=parseInt(el.getAttribute('data-total'),10)||0;
  var store; try{ store=JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ store={}; }
  var done=Object.keys(store).filter(function(k){ return k.indexOf(slug+'/')===0; }).length;
  if(done>total) done=total;
  var fill=el.querySelector('.track-progress-fill');
  var label=el.querySelector('.track-progress-label');
  if(fill) fill.style.transform='scaleX('+(total?done/total:0)+')';
  if(label) label.textContent=done+' of '+total+' lessons complete';
  el.hidden=false;
})();
</script>`;

  return pageHTML({
    title: `${track.title} / ZopDev University`,
    description: track.desc,
    canonical: `https://zop.dev/resources/university/${track.slug}/`,
    schema: trackSchema(track),
    body,
  });
}

// Render the "big picture" prose from a module's 00_README.md — chiefly its
// concept diagram — as an overview section on the module page. The full README
// is not rendered: the header block, the "## Lessons" table (the page already
// lists lessons as cards), the "## Module outcome" (it is the hero lead / desc),
// the "## Module knowledge check" (internal chip mechanics) and the forward
// "## What's next" section are all skipped, leaving the diagram and any framing
// prose. Returns '' when nothing substantive remains.
function renderModuleOverview(track, mod) {
  const readmePath = path.join(TRACKS_DIR, track.dir, mod.dir, '00_README.md');
  if (!fs.existsSync(readmePath)) return '';
  const lines = fs.readFileSync(readmePath, 'utf8').split('\n');
  // Allowlist, not denylist: module READMEs across tracks use wildly different
  // headings (T6's recipe library uses "## The 15 recipes", "## Recipe pattern"
  // with an internal reference table + authoring template). Keep ONLY sections
  // this feature is designed to surface — reader-facing framing prose and the
  // concept diagram — so anything an author didn't anticipate defaults to
  // dropped rather than dumped onto the page.
  const ALLOW = /^##\s+(module diagram|diagram|the big picture|big picture|overview|the idea|mental model|why this module|how it fits)\b/i;
  // Split into sections keyed by their ## heading.
  const sections = [];
  let cur = null;
  for (const line of lines) {
    if (/^##\s+/.test(line)) { cur = { head: line.trim(), body: [] }; sections.push(cur); continue; }
    if (cur) cur.body.push(line);
  }
  const kept = [];
  for (const s of sections) {
    const allowed = ALLOW.test(s.head);
    const hasDiagram = s.body.some(l => /`assets\/diagrams\/[^`]+\.svg`/.test(l));
    if (!allowed && !hasDiagram) continue;
    for (const l of s.body) {
      if (l.trim() === '---') continue;      // drop hr separators
      if (/^§/.test(l.trim())) continue;      // never leak signature / provenance lines
      kept.push(l);
    }
  }
  const bodyMd = kept.join('\n').trim();
  if (!bodyMd) return '';
  const html = renderMarkdown(bodyMd, readmePath).trim();
  // Nothing but a stray heading? Treat as empty (avoids an empty section box).
  if (!/<(p|figure|ul|ol|table|pre|blockquote)\b/.test(html)) return '';
  return `
<section class="section">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">The big picture</div>
      <div>
        <h2>How this module fits together.</h2>
        <p class="sub">The concept before the click-through.</p>
      </div>
    </div>
    <div class="module-overview lesson-body">
      ${html}
    </div>
  </div>
</section>`;
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
    <p class="track-hero-lead">${escapeHTML(stripMarkdown(mod.desc) || `${mod.lessons.length} lessons covering the practical patterns for ${mod.title.toLowerCase()}.`)}</p>
    <div class="track-meta-row">
      <div class="item"><strong>Module</strong>${escapeHTML(mod.code)}</div>
      <div class="item"><strong>Lessons</strong>${mod.lessons.length}</div>
      <div class="item"><strong>Time</strong>~${mod.lessons.length * 9} minutes</div>
    </div>
  </div>
</section>
${renderModuleOverview(track, mod)}
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
  const contentHTML = renderMarkdown(lesson.raw, lesson.path);

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
<dd>${renderMetaVal(v)}</dd>`).join('');

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

      <div class="lesson-complete" data-lesson-id="${track.slug}/${mod.slug}/${lesson.slug}">
        <label class="lesson-complete-toggle">
          <input type="checkbox" id="lesson-complete-cb">
          <span class="lesson-complete-box" aria-hidden="true"></span>
          <span class="lesson-complete-label">Mark this lesson complete</span>
        </label>
        <span class="lesson-complete-hint">Saved on this device only.</span>
      </div>

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
// Interactive quick-check MCQs: click an option to grade it (correct/wrong),
// lock the choices, and reveal the explanation. Pure client-side.
document.querySelectorAll('.check').forEach(function (box) {
  var opts = box.querySelectorAll('.opt');
  var explain = box.querySelector('.explain');
  opts.forEach(function (opt) {
    opt.addEventListener('click', function () {
      if (box.dataset.answered) return;
      box.dataset.answered = '1';
      var correct = opt.dataset.correct === '1';
      opt.classList.add(correct ? 'correct' : 'wrong');
      if (!correct) opts.forEach(function (o) { if (o.dataset.correct === '1') o.classList.add('correct'); });
      opts.forEach(function (o) { o.disabled = true; });
      if (explain) explain.classList.add('show');
    });
  });
});
</script>
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
</script>
<script>
// Progress: mark-complete checkbox persisted in localStorage (this device).
(function(){
  var KEY='zopuni:progress:v1';
  var box=document.querySelector('.lesson-complete');
  var cb=document.getElementById('lesson-complete-cb');
  if(!box||!cb) return;
  var id=box.getAttribute('data-lesson-id');
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } }
  function write(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }
  var store=read();
  cb.checked=!!store[id];
  if(cb.checked) box.classList.add('done');
  cb.addEventListener('change', function(){
    var s=read();
    if(cb.checked){ s[id]=1; box.classList.add('done'); } else { delete s[id]; box.classList.remove('done'); }
    write(s);
  });
})();
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

// Source-path -> generated-URL index, so inline cross-lesson/cross-module .md
// links in lesson prose resolve to the real page instead of a dead .md href.
// Keyed by normalized absolute path of the lesson file (and each module's
// 00_README.md). Declared with var so renderMarkdown's typeof guards behave if
// it is ever invoked before this point.
var LESSON_URL_BY_SRC = new Map();
for (const track of tracks) {
  const trackReadme = path.normalize(path.join(TRACKS_DIR, track.dir, '00_README.md'));
  LESSON_URL_BY_SRC.set(trackReadme, `${BASE}/${track.slug}/`);
  for (const mod of track.modules) {
    const modReadme = path.normalize(path.join(TRACKS_DIR, track.dir, mod.dir, '00_README.md'));
    LESSON_URL_BY_SRC.set(modReadme, `${BASE}/${track.slug}/${mod.slug}/`);
    for (const lesson of mod.lessons) {
      LESSON_URL_BY_SRC.set(path.normalize(lesson.path), `${BASE}/${track.slug}/${mod.slug}/${lesson.slug}/`);
    }
  }
}

// Set of glossary slugs that will actually get a generated per-term page.
// buildGlossaryIndex keys pages by slug(display-text) of every
// [term](../../../reference/glossary/*.md) link, so mirror that here and let
// renderInline drop links to terms that never produce a page.
var GLOSSARY_SLUGS = new Set();
for (const a of allLessons) {
  for (const m of a.lesson.raw.matchAll(/\[([^\]]+)\]\(\.\.\/\.\.\/\.\.\/reference\/glossary\/[^)]+\.md\)/g)) {
    GLOSSARY_SLUGS.add(slugify(m[1].trim()));
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

// Shield credential badge (V2). Real ZopDev mark (three-square blue/orange/
// green). Orange reserved for the Architect pinnacle. Self-contained inline SVG
// that scales to its container; the same artwork is written to
// /assets/badges/<tier>.svg for download.
function certBadgeSVG(tier) {
  const T = {
    operator:  { name: 'Operator',  num: 'I',   blurb: 'Operate the platform',     accent: '#7FB236' }, // green
    engineer:  { name: 'Engineer',  num: 'II',  blurb: 'Build cost-aware systems',  accent: '#2A4494' }, // blue
    architect: { name: 'Architect', num: 'III', blurb: 'Design the practice',       accent: '#F58549' }, // orange (pinnacle)
  };
  const d = T[tier] || T.operator;
  const PAPER = '#FAF7EC', BLUE = '#2A4494', ORANGE = '#F58549', GREEN = '#7FB236', INK = '#0A0A0A';
  const FH = "'Space Grotesk','Helvetica Neue',Arial,sans-serif";
  const FM = "'JetBrains Mono','SF Mono',Menlo,monospace";
  const W = 340, H = 440, sx = 40, sw = W - 80, cx = W / 2;
  const shieldPath = `M${sx},70 L${sx + sw},70 L${sx + sw},300 Q${sx + sw},360 ${cx},400 Q${sx},360 ${sx},300 Z`;
  const nameSize = d.name.length > 8 ? 34 : 40;
  // ZopDev University mark: the "eye" (two crescents + starburst pupil on a
  // blue rounded square) — the canonical University emblem used in the site
  // header lockup and favicon. Shown on a cream chip so the blue square reads
  // on any tier-colored band (including the blue Engineer band).
  const emblem = 30, pad = 5, chipW = emblem + 2 * pad, chipH = chipW;
  const chipX = cx - chipW / 2, chipY = 70 + (48 - chipH) / 2;
  const ex = chipX + pad, ey = chipY + pad, es = emblem / 100;
  const chip = `<rect x="${chipX}" y="${chipY}" width="${chipW}" height="${chipH}" rx="7" fill="${PAPER}"/>` +
    `<g transform="translate(${ex},${ey}) scale(${es})">` +
    `<rect width="100" height="100" rx="16" fill="${BLUE}"/>` +
    `<path d="M 38 27 Q -12 50 38 73 Q 16 50 38 27 Z" fill="#FFFFFF"/>` +
    `<path d="M 62 27 Q 112 50 62 73 Q 84 50 62 27 Z" fill="#FFFFFF"/>` +
    `<polygon points="50,30 52.47,42.39 61.76,33.82 56.47,45.3 69.02,43.82 58,50 69.02,56.18 56.47,54.7 61.76,66.18 52.47,57.61 50,70 47.53,57.61 38.24,66.18 43.53,54.7 30.98,56.18 42,50 30.98,43.82 43.53,45.3 38.24,33.82 47.53,42.39" fill="#FFFFFF"/></g>`;
  return `<svg class="cert-badge-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="ZopDev Certified: ${d.name} badge" xmlns="http://www.w3.org/2000/svg">
  <path d="${shieldPath}" fill="${PAPER}" stroke="${d.accent}" stroke-width="2.5"/>
  <path d="M${sx},70 L${sx + sw},70 L${sx + sw},118 L${sx},118 Z" fill="${d.accent}"/>
  ${chip}
  <text x="${cx}" y="150" text-anchor="middle" font-family="${FH}" font-size="16" font-weight="700" fill="${INK}">zopdev <tspan font-family="${FM}" font-size="10" font-weight="400" letter-spacing="1.5" fill="${INK}" fill-opacity="0.55">UNIVERSITY</tspan></text>
  <text x="${cx}" y="206" text-anchor="middle" font-family="${FH}" font-size="${nameSize}" font-weight="700" fill="${INK}">${d.name}</text>
  <text x="${cx}" y="234" text-anchor="middle" font-family="${FM}" font-size="11" letter-spacing="1" fill="${INK}" fill-opacity="0.55">CERTIFIED · TIER ${d.num}</text>
  <line x1="${cx - 40}" y1="256" x2="${cx + 40}" y2="256" stroke="${d.accent}" stroke-width="3"/>
  <text x="${cx}" y="296" text-anchor="middle" font-family="${FH}" font-size="13" fill="${INK}" fill-opacity="0.6">${d.blurb}</text>
  <text x="${cx}" y="356" text-anchor="middle" font-family="${FH}" font-size="34" font-weight="700" fill="${d.accent}" fill-opacity="0.16">${d.num}</text>
</svg>`;
}

function certSeal(tier, opts = {}) {
  const { size = 'medium' } = opts;
  const labels = { operator: 'Operator', engineer: 'Engineer', architect: 'Architect' };
  const label = labels[tier] || 'Operator';
  return `<div class="cert-badge cert-badge-${size}" role="img" aria-label="ZopDev Certified: ${label} badge">${certBadgeSVG(tier)}</div>`;
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
      tier, tierLabel: 'Operator', tierTitle: 'ZopDev Certified: Operator',
      title: 'Tier I / ZopDev Certified: Operator',
      blurb: 'has demonstrated the ability to operate ZopNight in production: connect clouds, discover resources, build schedules, route notifications, and audit every action.',
      coverage: 'Cloud Cost Foundations (T0) + ZopDev Certified: Operator (T1)',
      examLength: '30 minutes',
      questions: '20 questions',
      passScore: '80%',
      name: 'Alex Russo',
      role: 'Platform Engineer, Linarc Health',
      date: 'March 14, 2026',
      issuer: 'ZopDev University Editorial Board',
    },
    engineer: {
      tier, tierLabel: 'Engineer', tierTitle: 'ZopDev Certified: Engineer',
      title: 'Tier II / ZopDev Certified: Engineer',
      blurb: 'has demonstrated the ability to build cost-aware systems on ZopNight: read the 450+ rule library, configure auto-remediation, schedule K8s and Databricks workloads, pre-scale for events, and optimize Bedrock inference.',
      coverage: 'ZopDev Certified: Engineer (T2) + FinOps Mastery (T4) + DevOps Cost Discipline (T5) + AI-Powered Cloud Ops (T6)',
      examLength: '60 minutes',
      questions: '40 questions',
      passScore: '75%',
      name: 'Priya Menon',
      role: 'Senior Platform Engineer, Flexflow',
      date: 'April 22, 2026',
      issuer: 'ZopDev University Editorial Board',
    },
    architect: {
      tier, tierLabel: 'Architect', tierTitle: 'ZopDev Certified: Architect',
      title: 'Tier III / ZopDev Certified: Architect',
      blurb: 'has demonstrated the ability to own the cost-discipline practice for a multi-cloud organization: multi-org RBAC, audit log architecture, SOC 2 / ISO 27001 posture, FinOps Foundation framework, forecasting, commitments, and AI-powered ops via MCP.',
      coverage: 'ZopDev Certified: Architect (T3) + FinOps Mastery (T4) + AI-Powered Cloud Ops (T6)',
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
        <div class="credential-award">has earned the credential</div>
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
    uniNav: 'prepare',
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
    uniNav: 'prepare',
    body,
  });
}

// =============================================================
// ROLE-BASED LEARNING PATHS
// =============================================================
// Parse a paths/*.md file into { title, outcome, bodyMd }. bodyMd is
// everything from "## Sequence" onward, minus the trailing signature,
// so the hero can own the title + outcome and the body renders the rest.
// Strip the trailing "--- / § ... Last reviewed" signature from a slice of
// markdown lines, including any blank lines and the "---" rule before it.
// (A simple one-line-back check misses the blank line authors leave between
// the rule and the signature, which then renders as a stray <hr>.)
function stripTrailingSignatureBlock(lines) {
  const sigIdx = lines.findIndex(l => l.trim().startsWith('§') && /Last reviewed/i.test(l));
  if (sigIdx < 0) return lines;
  let cut = sigIdx;
  for (let i = sigIdx - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (t === '') { cut = i; continue; }
    if (t === '---') { cut = i; break; }
    break;
  }
  return lines.slice(0, cut);
}

function parsePathFile(filePath) {
  let md;
  try { md = fs.readFileSync(filePath, 'utf8'); }
  catch (e) { console.error(`✗ parsePathFile: cannot read ${filePath} — ${e.message}`); process.exit(1); }
  const lines = md.split('\n');

  let title = '';
  for (const l of lines) { const m = l.match(/^#\s+(.+)$/); if (m) { title = m[1].trim(); break; } }

  let outcome = '';
  const oi = lines.findIndex(l => /^##\s+outcome\s*$/i.test(l.trim()));
  if (oi >= 0) {
    for (let j = oi + 1; j < lines.length; j++) {
      const t = lines[j].trim();
      if (!t) continue;
      if (t.startsWith('#')) break;
      outcome = t; break;
    }
  }

  const si = lines.findIndex(l => /^##\s+Sequence/i.test(l.trim()));
  if (si < 0) console.warn(`⚠️  parsePathFile: no "## Sequence" heading in ${filePath}; rendering full body`);
  let bodyLines = si >= 0 ? lines.slice(si) : lines;
  bodyLines = stripTrailingSignatureBlock(bodyLines);
  return { title, outcome, bodyMd: bodyLines.join('\n') };
}

function renderPathsIndex() {
  const cards = PATHS.map(p => `
      <a class="path-card" href="${BASE}/paths/${p.slug}/">
        <div class="path-card-head">
          <span class="path-card-dur">${escapeHTML(p.duration)}</span>
          <span class="path-card-cert">${escapeHTML(p.cert)}</span>
        </div>
        <h3 class="path-card-title">${escapeHTML(p.title)}</h3>
        <p class="path-card-aud">${escapeHTML(p.audience)}</p>
        <span class="path-card-foot">Open path <span class="arrow" aria-hidden="true">→</span></span>
      </a>`).join('');

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <span class="current">Paths</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">Learning paths / Pick by role</div>
    <h1>Where are you?</h1>
    <p class="track-hero-lead">The curriculum is 237 lessons. You do not need all of them. Pick the path that matches your role and follow it in order. Each path threads lessons from across the tracks and pairs with the right certification.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">Five paths</div>
      <div>
        <h2>Pick the description that fits you.</h2>
        <p class="sub">Each is a curated sequence. Skip lessons you have already taken; every lesson stands alone.</p>
      </div>
    </div>
    <div class="learning-path-grid">${cards}
    </div>
  </div>
</section>

<section class="cta-strip">
  <div class="container">
    <h2>Not sure yet? Start with the bill.</h2>
    <p>Foundations is free and role-agnostic. Nine minutes to the first lesson.</p>
    <div class="hero-cta">
      <a href="${BASE}/foundations/" class="btn btn-primary">Read Foundations <span class="arrow">→</span></a>
      <a href="${BASE}/certifications/" class="btn-ghost">See the certifications</a>
    </div>
  </div>
</section>`;

  return pageHTML({
    title: 'Learning paths / ZopDev University',
    description: 'Five role-based paths through the ZopDev University curriculum: Platform Engineer, FinOps Analyst, Engineering Leader, Finance Partner, Security & Compliance.',
    canonical: 'https://zop.dev/resources/university/paths/',
    uniNav: 'paths',
    body,
  });
}

function renderPath(p) {
  const pathSrc = path.join(ROOT, 'paths', p.file);
  const parsed = parsePathFile(pathSrc);
  const bodyHTML = renderMarkdown(parsed.bodyMd, pathSrc);

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <a href="${BASE}/paths/">Paths</a><span class="sep">›</span>
    <span class="current">${escapeHTML(p.title)}</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">Learning path</div>
    <h1>${escapeHTML(p.title)}</h1>
    ${parsed.outcome ? `<p class="track-hero-lead">${escapeHTML(stripMarkdown(parsed.outcome))}</p>` : ''}
    <div class="track-meta-row">
      <div class="item"><strong>Audience</strong>${escapeHTML(p.audience)}</div>
      <div class="item"><strong>Duration</strong>${escapeHTML(p.duration)}</div>
      <div class="item"><strong>Certification</strong>${escapeHTML(p.cert)}</div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <article class="lesson-content path-body">
      ${bodyHTML}
    </article>
  </div>
</section>

<section class="cta-strip">
  <div class="container">
    <h2>Start the path.</h2>
    <p>Follow the sequence in order, or jump to the certification when you are ready.</p>
    <div class="hero-cta">
      <a href="${BASE}/" class="btn btn-primary">Browse all courses <span class="arrow">→</span></a>
      <a href="${BASE}/paths/" class="btn-ghost">All paths</a>
    </div>
  </div>
</section>`;

  return pageHTML({
    title: `${p.title} path / ZopDev University`,
    description: parsed.outcome || `A role-based path through ZopDev University for ${p.audience}.`,
    canonical: `https://zop.dev/resources/university/paths/${p.slug}/`,
    uniNav: 'paths',
    body,
  });
}

// =============================================================
// PUBLIC CREDENTIAL REGISTRY (opt-in)
// =============================================================
// A public, opt-in list of credentialled people. Sourced from the same
// sample-credential data as the verifier; each row deep-links into the
// verify page. When real issuance ships (eng / GoFr module) this reads
// from the credential store instead of the sample set.
function renderRegistry() {
  const tiers = ['operator', 'engineer', 'architect'];
  const tierNum = { operator: 'I', engineer: 'II', architect: 'III' };
  const rows = tiers.map(tier => {
    const d = sampleCredentialData(tier);
    const id = sampleCredentialId(tier);
    return `<tr>
      <td class="reg-name">${escapeHTML(d.name)}</td>
      <td>${escapeHTML(d.role)}</td>
      <td><span class="reg-tier reg-tier-${tier}">Tier ${tierNum[tier]} / ${escapeHTML(d.tierLabel)}</span></td>
      <td class="reg-id"><a href="${BASE}/certifications/verify/?id=${encodeURIComponent(id)}">${escapeHTML(id)}</a></td>
      <td class="reg-date">${escapeHTML(d.date)}</td>
    </tr>`;
  }).join('');

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <a href="${BASE}/certifications/">Certifications</a><span class="sep">›</span>
    <span class="current">Registry</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">Public registry / Opt-in</div>
    <h1>Credentialled practitioners.</h1>
    <p class="track-hero-lead">A public, opt-in list of people who hold a ZopDev University credential. Every entry links to the public verifier, which shows name, tier, issue date, and coverage. Listing is opt-in, so not every credential holder appears here.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="registry-wrap">
      <table class="registry-table">
        <thead><tr><th>Name</th><th>Role</th><th>Credential</th><th>Credential ID</th><th>Issued</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <p class="registry-note">These are sample entries. When credential issuance goes live, this registry lists real opt-in holders drawn from the credential store.</p>
  </div>
</section>

<section class="cta-strip">
  <div class="container">
    <h2>Have a credential ID to check?</h2>
    <p>Verify any ZopDev University credential in two clicks, no login.</p>
    <div class="hero-cta">
      <a href="${BASE}/certifications/verify/" class="btn btn-primary">Verify a credential <span class="arrow">→</span></a>
      <a href="${BASE}/certifications/" class="btn-ghost">See the certifications</a>
    </div>
  </div>
</section>`;

  return pageHTML({
    title: 'Credential registry / ZopDev University',
    description: 'Public, opt-in registry of ZopDev University credential holders. Each entry links to the public verifier.',
    canonical: 'https://zop.dev/resources/university/certifications/registry/',
    uniNav: 'prepare',
    body,
  });
}

// =============================================================
// PRACTICE EXAM (client-side, self-scored)
// =============================================================
// A practice exam draws from the knowledge-check questions already
// authored in the lessons that back each cert. The draw is weighted to
// match the published exam blueprint. This is a self-scored study aid,
// NOT the proctored credential exam (that stays server-side / eng-owned).
const EXAM_BLUEPRINTS = {
  operator: {
    tierTitle: 'Operator',
    trackCodes: ['T0', 'T1'],
    total: 20,
    passRatio: 0.8,       // 16 / 20
    minutes: 30,
    blueprint: [
      { topic: 'foundation', label: 'Cloud Cost Foundations (Track 0)', count: 8 },
      { topic: 'schedules',  label: 'Schedules and groups',            count: 5 },
      { topic: 'connect',    label: 'Connect and discover',            count: 3 },
      { topic: 'overrides',  label: 'Overrides',                       count: 2 },
      { topic: 'history',    label: 'History and audit',               count: 2 },
    ],
    // Map a (trackCode, moduleCode) pair to a blueprint topic bucket.
    moduleTopic: (trackCode, modCode) => {
      if (trackCode === 'T0') return 'foundation';
      if (/^M1\.1\b/.test(modCode) || /^M1\.2\b/.test(modCode)) return 'connect';
      if (/^M1\.3\b/.test(modCode) || /^M1\.4\b/.test(modCode)) return 'schedules';
      if (/^M1\.5\b/.test(modCode)) return 'overrides';
      if (/^M1\.6\b/.test(modCode)) return 'history';
      console.warn(`⚠️  practice: module ${modCode} (${trackCode}) has no blueprint topic; bucketed as foundation`);
      return 'foundation';
    },
  },
  engineer: {
    tierTitle: 'Engineer',
    trackCodes: ['T2', 'T4', 'T5', 'T6'],
    total: 40,
    passRatio: 0.75,      // 30 / 40
    minutes: 60,
    note: 'This practice covers the 40-question multiple-choice portion. The real Engineer exam also includes a graded, hands-on sandbox lab.',
    blueprint: [
      { topic: 'T2', label: 'ZopDev Certified: Engineer (Track 2)',      count: 20 },
      { topic: 'T4', label: 'FinOps Mastery (Track 4)',         count: 11 },
      { topic: 'T5', label: 'DevOps Cost Discipline (Track 5)', count: 6 },
      { topic: 'T6', label: 'AI-Powered Cloud Ops (Track 6)',   count: 3 },
    ],
    // Engineer questions are bucketed by track (the blueprint is per-track).
    moduleTopic: (trackCode) => trackCode,
  },
  // Architect is intentionally absent: its credential is application +
  // take-home + interview (no MCQ), so an MCQ practice exam would
  // misrepresent it. See certifications/architect/00_README.md.
};

// Gather every parsed knowledge-check question from the tracks that back
// a tier, tagged with its blueprint topic and a link back to the source
// lesson. Returns a flat pool the client draws from.
function collectExamPool(tracks, tierKey) {
  const cfg = EXAM_BLUEPRINTS[tierKey];
  const pool = [];
  for (const track of tracks) {
    if (!cfg.trackCodes.includes(track.code)) continue;
    for (const mod of track.modules) {
      const topic = cfg.moduleTopic(track.code, mod.code);
      for (const lesson of mod.lessons) {
        (lesson.questions || []).forEach((q, n) => {
          pool.push({
            id: `${track.code}.${mod.code}.${lesson.code}.Q${n + 1}`,
            topic,
            stem: q.stem,
            options: q.options,
            correct: q.correct,
            explanation: q.explanation,
            lessonUrl: `${BASE}/${track.slug}/${mod.slug}/${lesson.slug}/`,
            lessonLabel: `${track.code} · ${mod.code} · ${lesson.title}`,
          });
        });
      }
    }
  }
  return pool;
}

function renderPractice(tierKey, tracks) {
  const cfg = EXAM_BLUEPRINTS[tierKey];
  const pool = collectExamPool(tracks, tierKey);
  const tierSlug = tierKey;
  const TL = tierKey.charAt(0).toUpperCase() + tierKey.slice(1);

  const blueprintRows = cfg.blueprint
    .map(b => `<tr><td>${escapeHTML(b.label)}</td><td class="exam-bp-count">${b.count}</td></tr>`)
    .join('');

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <a href="${BASE}/certifications/">Certifications</a><span class="sep">›</span>
    <span class="current">${TL} preparation</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">Exam preparation / Self-scored, no login</div>
    <h1>Prepare for the ${TL} credential.</h1>
    <p class="track-hero-lead">${cfg.total} questions drawn from the lessons that back the ${escapeHTML(cfg.tierTitle)} certification, weighted to match the real exam blueprint. Score instantly, read the explanation on every question, retake as many times as you like. This is a study aid, not the proctored credential exam.</p>
    ${cfg.note ? `<p class="track-hero-lead exam-note">${escapeHTML(cfg.note)}</p>` : ''}
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">Exam blueprint</div>
      <div>
        <h2>What the exam covers.</h2>
        <p class="sub">Published openly. The practice draw uses these same weightings as the proctored ${escapeHTML(cfg.tierTitle)} exam.</p>
      </div>
    </div>
    <div class="exam-blueprint">
      <table class="exam-bp-table">
        <thead><tr><th>Area</th><th class="exam-bp-count">Questions</th></tr></thead>
        <tbody>${blueprintRows}</tbody>
        <tfoot><tr><td>Total</td><td class="exam-bp-count">${cfg.total}</td></tr></tfoot>
      </table>
      <ul class="exam-bp-facts">
        <li><span class="exam-bp-k">Format</span> ${cfg.total} multiple-choice, open-book</li>
        <li><span class="exam-bp-k">Time</span> ${cfg.minutes} minutes on the real exam</li>
        <li><span class="exam-bp-k">Pass mark</span> ${Math.round(cfg.passRatio * 100)}% (${Math.round(cfg.total * cfg.passRatio)} / ${cfg.total})</li>
        <li><span class="exam-bp-k">Credential</span> <a href="${BASE}/certifications/#${tierSlug}">${escapeHTML(cfg.tierTitle)} certification</a></li>
      </ul>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <div class="verify-shell exam-shell">
      <div class="exam-bar">
        <div class="exam-progress" aria-hidden="true"><div class="exam-progress-fill" id="exam-progress-fill"></div></div>
        <span class="exam-count" id="exam-count" aria-live="polite">0 / ${cfg.total} answered</span>
      </div>
      <form id="exam-form">
        <div id="exam-questions"></div>
        <noscript><p class="exam-submit-note">This practice exam needs JavaScript enabled.</p></noscript>
        <div class="exam-submit-row">
          <button type="submit" class="btn btn-primary" id="exam-submit">Submit exam <span class="arrow">→</span></button>
          <span class="exam-submit-note">Unanswered questions count as incorrect.</span>
        </div>
      </form>
      <div class="verify-result exam-result" id="exam-result" aria-live="polite" hidden></div>
    </div>
  </div>
</section>

<section class="cta-strip">
  <div class="container">
    <h2>The practice run is free. So is the credential.</h2>
    <p>When you can pass this comfortably, take the proctored ${escapeHTML(cfg.tierTitle)} exam and earn a publicly verifiable badge.</p>
    <div class="hero-cta">
      <a href="${BASE}/certifications/#${tierSlug}" class="btn btn-primary">See the certification <span class="arrow">→</span></a>
      <a href="${BASE}/${tierSlug}/" class="btn-ghost">Study the ${escapeHTML(cfg.tierTitle)} course</a>
    </div>
  </div>
</section>

<script>
(function(){
  var POOL = ${JSON.stringify(pool).replace(/<\/script>/gi, '<\\/script>')};
  var BLUEPRINT = ${JSON.stringify(cfg.blueprint).replace(/<\/script>/gi, '<\\/script>')};
  var TOTAL = ${cfg.total};
  var PASS_RATIO = ${cfg.passRatio};
  var CERT_URL = ${JSON.stringify(BASE + '/certifications/#' + tierSlug)};
  var TOTAL_EFF = Math.min(TOTAL, POOL.length);

  var form = document.getElementById('exam-form');
  var qWrap = document.getElementById('exam-questions');
  var resultBox = document.getElementById('exam-result');
  var countEl = document.getElementById('exam-count');
  var fillEl = document.getElementById('exam-progress-fill');
  var submitBtn = document.getElementById('exam-submit');
  var current = [];
  var graded = false;
  var LETTERS = ['A','B','C','D','E','F'];

  function shuffle(a){ for (var i=a.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

  // Re-shuffle and re-letter each question's options so the correct
  // answer is not always in the same position. The authored lessons
  // skew heavily toward "B" as the correct key; this removes that tell.
  function prepQuestion(q){
    // If the explanation names option letters (e.g. "A is wrong", "(C)",
    // "C and D"), shuffling would leave those references pointing at the
    // wrong option. Keep such questions in their authored order + letters.
    if (/\\([A-D]\\)|\\b[A-D] and [A-D]\\b|\\b[A-D] is\\b/.test(q.explanation || '')) return q;
    var opts = shuffle(q.options.slice());
    var newCorrect = q.correct;
    var relabeled = opts.map(function(o, idx){
      var key = LETTERS[idx];
      if (o.key === q.correct) newCorrect = key;
      return { key: key, text: o.text };
    });
    var out = {}; for (var k in q) out[k] = q[k];
    out.options = relabeled; out.correct = newCorrect;
    return out;
  }

  function fmt(s){
    s = String(s == null ? '' : s).replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; });
    s = s.replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1');
    s = s.replace(/\`([^\`]+)\`/g, '<code>$1</code>');
    s = s.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>');
    return s;
  }

  // Escape a value for use inside a double-quoted HTML attribute. The
  // pool is build-time authored, but grade() concatenates lessonUrl into
  // innerHTML, so escape defensively to keep the contract closed.
  function attr(s){ return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  function draw(){
    var byTopic = {};
    POOL.forEach(function(q){ (byTopic[q.topic] = byTopic[q.topic] || []).push(q); });
    var picked = []; var used = {};
    BLUEPRINT.forEach(function(b){
      var p = shuffle((byTopic[b.topic] || []).slice());
      p.slice(0, b.count).forEach(function(q){ picked.push(q); used[q.id] = 1; });
    });
    if (picked.length < TOTAL_EFF){
      var rest = shuffle(POOL.filter(function(q){ return !used[q.id]; }));
      for (var i=0;i<rest.length && picked.length<TOTAL_EFF;i++){ picked.push(rest[i]); used[rest[i].id]=1; }
    }
    // Final shuffle intermixes topics so questions are not grouped by area.
    return shuffle(picked).slice(0, TOTAL_EFF);
  }

  function renderExam(){
    graded = false;
    current = draw().map(prepQuestion);
    resultBox.hidden = true;
    resultBox.innerHTML = '';
    var html = '';
    current.forEach(function(q, i){
      html += '<fieldset class="exam-q" id="exam-q-'+i+'">';
      html += '<legend class="exam-q-code">Question '+(i+1)+'</legend>';
      html += '<p class="exam-q-stem">'+fmt(q.stem)+'</p>';
      html += '<div class="exam-opts">';
      q.options.forEach(function(o){
        var id = 'q'+i+'-'+o.key;
        html += '<label class="exam-opt" for="'+id+'">'
          + '<input type="radio" id="'+id+'" name="q'+i+'" value="'+o.key+'">'
          + '<span class="exam-opt-key">'+o.key+'</span>'
          + '<span class="exam-opt-text">'+fmt(o.text)+'</span>'
          + '</label>';
      });
      html += '</div>';
      html += '<div class="exam-explain" id="exam-explain-'+i+'" hidden></div>';
      html += '</fieldset>';
    });
    qWrap.innerHTML = html;
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Submit exam <span class="arrow">→</span>';
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function answeredCount(){
    var n = 0;
    for (var i=0;i<current.length;i++){ if (form.querySelector('input[name="q'+i+'"]:checked')) n++; }
    return n;
  }
  function updateProgress(){
    var n = answeredCount();
    countEl.textContent = n + ' / ' + current.length + ' answered';
    fillEl.style.transform = 'scaleX(' + (current.length ? n/current.length : 0) + ')';
  }

  form.addEventListener('change', function(){ if (!graded) updateProgress(); });
  form.addEventListener('submit', function(e){ e.preventDefault(); if (!graded) grade(); });

  function grade(){
    graded = true;
    var correct = 0;
    current.forEach(function(q, i){
      var chosen = form.querySelector('input[name="q'+i+'"]:checked');
      var val = chosen ? chosen.value : null;
      var isRight = val === q.correct;
      if (isRight) correct++;
      var fs = document.getElementById('exam-q-'+i);
      fs.querySelectorAll('.exam-opt').forEach(function(lab){
        var input = lab.querySelector('input');
        input.disabled = true;
        var k = input.value;
        if (k === q.correct) lab.classList.add('correct');
        if (k === val && !isRight) lab.classList.add('incorrect');
      });
      fs.classList.add(isRight ? 'q-right' : 'q-wrong');
      var ex = document.getElementById('exam-explain-'+i);
      var verdict = isRight ? 'Correct' : (val ? 'Not quite' : 'Unanswered');
      ex.className = 'exam-explain ' + (isRight ? 'is-right' : 'is-wrong');
      ex.innerHTML = '<span class="exam-explain-label">'+verdict+' · answer '+q.correct+'</span>'
        + (q.explanation ? '<p>'+fmt(q.explanation)+'</p>' : '')
        + '<a class="exam-explain-src" href="'+attr(q.lessonUrl)+'">Review: '+fmt(q.lessonLabel)+'</a>';
      ex.hidden = false;
    });

    var pct = current.length ? Math.round(correct/current.length*100) : 0;
    var passMark = Math.ceil(current.length * PASS_RATIO);
    var passed = correct >= passMark;
    countEl.textContent = current.length + ' / ' + current.length + ' answered';
    fillEl.style.transform = 'scaleX(1)';

    // Reveal the aria-live region before populating it so screen readers
    // announce the result (some ignore mutations to hidden elements).
    resultBox.hidden = false;
    resultBox.innerHTML =
      '<div class="verify-status '+(passed?'':'verify-status-bad')+'">'
      + '<span class="'+(passed?'verify-check':'verify-x')+'" aria-hidden="true"></span>'
      + '<span class="verify-status-text">'+(passed?'You passed the practice exam':'Not yet — keep studying')+'</span>'
      + '</div>'
      + '<div class="verify-table">'
      + '<div class="verify-row-r"><div class="verify-k">Score</div><div class="verify-v verify-v-mono">'+correct+' / '+current.length+' ('+pct+'%)</div></div>'
      + '<div class="verify-row-r"><div class="verify-k">Passing mark</div><div class="verify-v verify-v-mono">'+passMark+' / '+current.length+'</div></div>'
      + '<div class="verify-row-r"><div class="verify-k">Result</div><div class="verify-v">'+(passed?'Pass':'Below passing mark')+'</div></div>'
      + '</div>'
      + '<p class="exam-result-note">'+(passed
          ? 'This is a self-scored practice run, not the official credential. When you are ready, take the proctored exam to earn a verifiable badge.'
          : 'Read the explanation under each question, revisit the linked lessons, then retake. The real exam passes at '+Math.round(PASS_RATIO*100)+'%.')+'</p>'
      + '<div class="exam-result-cta">'
      + '<button type="button" class="btn btn-primary" id="exam-retake">Retake with new questions <span class="arrow">→</span></button>'
      + '<a class="btn-ghost" href="'+CERT_URL+'">See the certification</a>'
      + '</div>';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitted';
    document.getElementById('exam-retake').addEventListener('click', renderExam);
    resultBox.scrollIntoView({ behavior:'smooth', block:'start' });
  }

  renderExam();
})();
</script>`;

  return pageHTML({
    title: `${TL} exam preparation / ZopDev University`,
    description: `Free, self-scored ${cfg.tierTitle} practice exam. ${cfg.total} questions weighted to the real exam blueprint, instant scoring, an explanation on every question. No login.`,
    canonical: `https://zop.dev/resources/university/certifications/${tierSlug}/practice/`,
    uniNav: 'prepare',
    body,
  });
}

// The Architect credential is application + take-home + interview (no MCQ),
// so instead of a practice exam it gets a prep guide rendered from the
// authored certifications/architect/00_README.md.
function renderArchitectPrep() {
  const raw = fs.readFileSync(path.join(ROOT, 'certifications', 'architect', '00_README.md'), 'utf8');
  const lines = raw.split('\n');

  let outcome = '';
  const oi = lines.findIndex(l => /^##\s+outcome\s*$/i.test(l.trim()));
  if (oi >= 0) {
    for (let j = oi + 1; j < lines.length; j++) {
      const t = lines[j].trim();
      if (!t) continue;
      if (t.startsWith('#')) break;
      outcome = t; break;
    }
  }

  // Body: from the first "## " after Outcome, minus the trailing signature.
  if (oi < 0) console.warn('⚠️  renderArchitectPrep: no "## Outcome" heading in architect/00_README.md; hero lead omitted');
  const startIdx = lines.findIndex((l, i) => i > oi && /^##\s+/.test(l.trim()) && !/^##\s+outcome/i.test(l.trim()));
  let bodyLines = startIdx >= 0 ? lines.slice(startIdx) : lines;
  bodyLines = stripTrailingSignatureBlock(bodyLines);
  const bodyHTML = renderMarkdown(bodyLines.join('\n'), path.join(ROOT, 'certifications', 'architect', '00_README.md'));

  const body = `
<section class="breadcrumb">
  <div class="container">
    <a href="/">ZopDev</a><span class="sep">›</span>
    <a href="/resources/">Resources</a><span class="sep">›</span>
    <a href="${BASE}/">University</a><span class="sep">›</span>
    <a href="${BASE}/certifications/">Certifications</a><span class="sep">›</span>
    <span class="current">Architect preparation</span>
  </div>
</section>

<section class="track-hero">
  <div class="container">
    <div class="track-hero-meta">Certification preparation / Application-based</div>
    <h1>How to prepare for the Architect credential.</h1>
    ${outcome ? `<p class="track-hero-lead">${escapeHTML(stripMarkdown(outcome))}</p>` : ''}
    <p class="track-hero-lead exam-note">The Architect credential is not a multiple-choice exam. It is an application, a one-week take-home design exercise, and a 45-minute review interview with the editorial board. This page is the preparation guide, drawn from the certification brief.</p>
  </div>
</section>

<section class="section">
  <div class="container">
    <article class="lesson-content path-body">
      ${bodyHTML}
    </article>
  </div>
</section>

<section class="cta-strip">
  <div class="container">
    <h2>Build toward it.</h2>
    <p>The Architect credential expects Engineer certification plus production experience at scale. Start with the Architect track and FinOps Mastery.</p>
    <div class="hero-cta">
      <a href="${BASE}/architect/" class="btn btn-primary">Study the Architect track <span class="arrow">→</span></a>
      <a href="${BASE}/certifications/#architect" class="btn-ghost">See the certification</a>
    </div>
  </div>
</section>`;

  return pageHTML({
    title: 'Architect certification preparation / ZopDev University',
    description: 'How to prepare for the ZopDev University Architect credential: the application, the take-home design exercise, and the review interview.',
    canonical: 'https://zop.dev/resources/university/certifications/architect/prep/',
    uniNav: 'prepare',
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
        <h2>ZopDev Certified: Operator</h2>
        <p class="sub">For whoever runs ZopNight day to day.</p>
      </div>
    </div>
    <article class="cert-card cert-card-with-seal cert-card-operator">
      <aside class="cert-card-seal">
        ${certSeal('operator', { size: 'medium' })}
        <a class="cert-badge-dl" href="${BASE}/assets/badges/operator.svg" download>Download badge (SVG) ↓</a>
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
        <h2>ZopDev Certified: Engineer</h2>
        <p class="sub">For engineers building cost-aware systems.</p>
      </div>
    </div>
    <article class="cert-card cert-card-with-seal cert-card-engineer">
      <aside class="cert-card-seal">
        ${certSeal('engineer', { size: 'medium' })}
        <a class="cert-badge-dl" href="${BASE}/assets/badges/engineer.svg" download>Download badge (SVG) ↓</a>
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
            <li>Reads the 450+ rule library, configures auto-remediation</li>
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
        <h2>ZopDev Certified: Architect</h2>
        <p class="sub">For platform leads owning the cost-discipline practice.</p>
      </div>
    </div>
    <article class="cert-card cert-card-with-seal cert-card-architect">
      <aside class="cert-card-seal">
        ${certSeal('architect', { size: 'medium' })}
        <a class="cert-badge-dl" href="${BASE}/assets/badges/architect.svg" download>Download badge (SVG) ↓</a>
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

// Public credential registry (opt-in)
writeFile(path.join(SITE_DIR, 'certifications', 'registry', 'index.html'), renderRegistry());
pageCount++;

// Practice exam pages (client-side, self-scored). Operator only for now;
// Engineer + Architect follow once their pools are validated.
for (const tier of ['operator', 'engineer']) {
  const pool = collectExamPool(tracks, tier);
  const need = EXAM_BLUEPRINTS[tier].total;
  if (pool.length < need) {
    // Do NOT write a page the blueprint would misstate (it advertises
    // `need` questions and a scaled pass mark). Fail the build instead.
    console.error(`✗ ${tier} practice pool has only ${pool.length}/${need} questions — skipping page write`);
    process.exitCode = 1;
    continue;
  }
  console.log(`✅ ${tier} practice pool: ${pool.length} questions`);
  writeFile(path.join(SITE_DIR, 'certifications', tier, 'practice', 'index.html'), renderPractice(tier, tracks));
  pageCount++;
}

// Architect preparation guide (this tier is application-based, no MCQ exam)
writeFile(path.join(SITE_DIR, 'certifications', 'architect', 'prep', 'index.html'), renderArchitectPrep());
pageCount++;

// Role-based learning paths
writeFile(path.join(SITE_DIR, 'paths', 'index.html'), renderPathsIndex());
pageCount++;
for (const p of PATHS) {
  writeFile(path.join(SITE_DIR, 'paths', p.slug, 'index.html'), renderPath(p));
  pageCount++;
}

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
    // Never source a definition from the Outcome block (lesson objectives)
    // or the Knowledge check block (question stems + answer keys).
    if (/\boutcome\b/.test(sec)) continue;
    if (/knowledge check/i.test(sec)) continue;
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

    // Reject fragments that must never become a definition:
    //  - quiz answer-key / <details> leaks ("Correct: B", "Show answer")
    //  - lesson objectives ("By the end of this lesson ...")
    //  - numbered-list fragments ("3. Moved bytes ...") and quiz options ("B. ...")
    if (/Correct:\s*[A-D]\b|<\/?summary>|<\/?details>|Show answer/i.test(para)) continue;
    if (/^\**by the end of this lesson/i.test(para)) continue;
    if (/^\**\d+\.\s/.test(para)) continue;
    if (/^[A-D]\.\s/.test(para)) continue;

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

// Parse the hand-authored glossary (reference/glossary/00_README.md) into a
// term -> definition map. Format: "- **Term** <sep> definition [See|Compare
// [ref](url).]" where <sep> is an em-dash, en-dash, or hyphen.
// These are curated, canonical definitions; prefer them over the sentence
// auto-extracted from lesson prose. Returns lowercased-term keys.
function parseAuthoredGlossary() {
  const p = path.join(ROOT, 'reference', 'glossary', '00_README.md');
  const map = new Map();
  if (!fs.existsSync(p)) return map;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^-\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (!m) continue;
    const term = m[1].trim();
    // Drop a trailing "See [ref](url)." pointer, then strip markdown.
    let def = m[2].trim().replace(/\s*(?:See(?:\s+also)?|Compare|Cf\.?)\s+\[[^\]]*\]\([^)]*\)\.?\s*$/i, '').trim();
    def = stripMd(def);
    if (term && def) map.set(term.toLowerCase(), def);
  }
  return map;
}

function buildGlossaryIndex() {
  // termName -> { refs: [{track, mod, lesson}], definition: string }
  const termMap = new Map();
  const authored = parseAuthoredGlossary();
  // Terms are keyed by their generated slug, not the raw display string, so
  // case-only variants ("Azure Reservation" vs "Azure reservation") collapse
  // to a single canonical entry. Without this, colliding slugs write the same
  // term page twice and emit a duplicate <loc> in the sitemap.
  const slugToKey = new Map();
  for (const a of allLessons) {
    const matches = a.lesson.raw.matchAll(/\[([^\]]+)\]\(\.\.\/\.\.\/\.\.\/reference\/glossary\/[^)]+\.md\)/g);
    const seen = new Set();
    for (const m of matches) {
      const term = m[1].trim();
      const slug = slugify(term);
      // Canonical key per slug: first display string seen wins.
      const key = slugToKey.get(slug) || term;
      if (!slugToKey.has(slug)) slugToKey.set(slug, key);
      // Dedup lesson references at the canonical-key level (a lesson that
      // uses two case-variants of one term still counts once).
      if (seen.has(key)) continue;
      seen.add(key);
      if (!termMap.has(key)) {
        termMap.set(key, { refs: [], definition: '' });
      }
      const entry = termMap.get(key);
      entry.refs.push({ track: a.track, mod: a.mod, lesson: a.lesson });
      // Capture the definition from the first lesson (in processing order)
      // that yields one: the authored glossary entry is preferred, else the
      // defining paragraph extracted from this lesson's prose. For terms that
      // merged from case-variant slugs, this may be a later lesson than the
      // canonical first mention, whichever first produces a usable definition.
      if (!entry.definition) {
        const authoredDef = authored.get(term.toLowerCase());
        if (authoredDef) {
          entry.definition = authoredDef;
        } else {
          const para = extractTermDefinitionFromLesson(a.lesson.raw, term);
          if (para) entry.definition = stripMd(para);
        }
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
// HOMEPAGE OVERRIDE — port the hand-authored bento+isometric homepage
// from preview/index.html over the build-generated site/index.html so
// Vercel deploys it as `/`. Path rewrites:
//   - assets/styles.css       → /assets/styles.css   (relative → absolute)
//   - lesson-t3-m3-1-l1.html  → /architect/rbac/policy-table/  (real lesson path)
// =============================================================
{
  const previewIndexPath = path.join(ROOT, 'preview', 'index.html');
  if (fs.existsSync(previewIndexPath)) {
    let html = fs.readFileSync(previewIndexPath, 'utf8');
    html = html.replace(/href="assets\/styles\.css"/g, `href="${CSS_HREF}"`);
    html = html.replace(/src="assets\/foot-globe\.js"/g, `src="${JS_SRC}"`);
    html = html.replace(/href="lesson-t3-m3-1-l1\.html"/g, 'href="/architect/rbac/policy-table/"');
    writeFile(path.join(SITE_DIR, 'index.html'), html);
    console.log('✅ Homepage replaced with preview/index.html (bento + isometric)');
  } else {
    console.warn('⚠️  preview/index.html not found — site/index.html is the build-generated landing');
  }
}

// =============================================================
// SITEMAP
// =============================================================
const urls = [
  { loc: 'https://zop.dev/resources/university/', priority: '1.0' },
  { loc: 'https://zop.dev/resources/university/certifications/', priority: '0.9' },
  { loc: 'https://zop.dev/resources/university/certifications/verify/', priority: '0.8' },
  { loc: 'https://zop.dev/resources/university/certifications/registry/', priority: '0.6' },
  { loc: 'https://zop.dev/resources/university/certifications/operator/practice/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/certifications/engineer/practice/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/certifications/architect/prep/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/certifications/operator/sample/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/certifications/engineer/sample/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/certifications/architect/sample/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/glossary/', priority: '0.7' },
  { loc: 'https://zop.dev/resources/university/search/', priority: '0.6' },
  { loc: 'https://zop.dev/resources/university/paths/', priority: '0.8' },
];
for (const p of PATHS) {
  urls.push({ loc: `https://zop.dev/resources/university/paths/${p.slug}/`, priority: '0.6' });
}
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
// ZopDev University mark — white "eye" (two crescents + starburst pupil)
// on the blue brand square.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="16" fill="#2A4494"/>
  <path d="M 38 27 Q -12 50 38 73 Q 16 50 38 27 Z" fill="#FFFFFF"/>
  <path d="M 62 27 Q 112 50 62 73 Q 84 50 62 27 Z" fill="#FFFFFF"/>
  <polygon points="50,30 52.47,42.39 61.76,33.82 56.47,45.3 69.02,43.82 58,50 69.02,56.18 56.47,54.7 61.76,66.18 52.47,57.61 50,70 47.53,57.61 38.24,66.18 43.53,54.7 30.98,56.18 42,50 30.98,43.82 43.53,45.3 38.24,33.82 47.53,42.39" fill="#FFFFFF"/>
</svg>`;
writeFile(path.join(SITE_DIR, 'assets', 'favicon.svg'), favicon);

// Downloadable credential badges — same artwork as the inline shields
// (certBadgeSVG is the single source), written with an XML prolog so they are
// valid standalone .svg files.
for (const tier of ['operator', 'engineer', 'architect']) {
  writeFile(path.join(SITE_DIR, 'assets', 'badges', `${tier}.svg`),
    `<?xml version="1.0" encoding="UTF-8"?>\n${certBadgeSVG(tier).replace('<svg ', '<svg width="340" height="440" ')}`);
}

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
