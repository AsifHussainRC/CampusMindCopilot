'use strict';

const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms) => new Promise((r) => setTimeout(r, reduceMotion.matches ? 0 : ms));

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function setPressed(group, btn) {
  group.querySelectorAll('button[aria-pressed]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
}

/* ---------- Presenter notes ---------- */
(function notes() {
  const box = $('notes-on');
  const apply = () => document.querySelectorAll('.pnote').forEach((p) => { p.hidden = !box.checked; });
  box.addEventListener('change', apply);
  apply();
})();

/* ---------- Section jump ---------- */
(function jump() {
  const sel = $('section-jump');
  sel.addEventListener('change', (e) => {
    history.pushState(null, '', '#' + e.target.value);
    document.getElementById(e.target.value).scrollIntoView();
  });
  let pending = false;
  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const line = document.querySelector('.section-nav').getBoundingClientRect().height + 60;
      let id = 'wait';
      document.querySelectorAll('main section').forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
      sel.value = id;
    });
  }, { passive: true });
})();

/* ================= Data (all fictional) ================= */

/* Home institution catalog. gen = general-education area; major = programs where the course is a major requirement. */
const HOME = {
  'WRIT 1010': { t: 'Composition I', gen: 'Writing' },
  'WRIT 1020': { t: 'Composition II', gen: 'Writing' },
  'MATH 1150': { t: 'College Algebra', gen: 'Math', major: ['bus'] },
  'MATH 1210': { t: 'Calculus I', gen: 'Math', major: ['cs'] },
  'STAT 2100': { t: 'Statistics', gen: 'Math', major: ['cs', 'psy', 'bus'] },
  'CSCI 1100': { t: 'Intro to Programming', major: ['cs'] },
  'CSCI 1200': { t: 'Programming II', major: ['cs'] },
  'PSYC 1100': { t: 'Intro to Psychology', gen: 'Social science', major: ['psy'] },
  'PSYC 2300': { t: 'Developmental Psychology', major: ['psy'] },
  'HIST 1120': { t: 'World History II', gen: 'Humanities' },
  'PHIL 2150': { t: 'Ethics', gen: 'Humanities' },
  'BIOL 1050': { t: 'Biology with Lab', gen: 'Science', major: ['psy'] },
  'CHEM 1010': { t: 'General Chemistry I', gen: 'Science' },
  'ARTS 1400': { t: 'Digital Imaging', gen: 'Arts' },
  'COMM 1200': { t: 'Public Speaking', gen: 'Communication', major: ['bus'] },
  'ECON 2010': { t: 'Macroeconomics', gen: 'Social science', major: ['bus'] },
  'ECON 2020': { t: 'Microeconomics', major: ['bus'] },
  'ACCT 2010': { t: 'Financial Accounting', major: ['bus'] },
  'BUSN 1010': { t: 'Intro to Business', major: ['bus'] },
  'ELEC 1XXX': { t: 'Elective credit' },
  'NONE': { t: 'No credit' }
};

const PROGRAMS = [
  { id: 'cs', name: 'B.S. Computer Science', major: 48, gen: 36, elec: 36 },
  { id: 'psy', name: 'B.A. Psychology', major: 39, gen: 36, elec: 45 },
  { id: 'bus', name: 'B.B.A. Business', major: 51, gen: 36, elec: 33 }
];

/* s = status the flow returns before any evaluator decision: exact | likely | review | nocredit */
const SAMPLES = [
  {
    id: 'kb', short: 'KBCC', school: 'Kestrel Bay Community College', kind: 'Associate of Arts · 2 years',
    student: 'Mateo Lindgren', file: 'kestrel-bay-transcript.pdf', scan: false, ask: 'Computer Science',
    courses: [
      ['ENG 101', 'Composition I', 3, 'A', 0.98, 'exact', 'WRIT 1010'],
      ['ENG 102', 'Composition II', 3, 'B+', 0.97, 'exact', 'WRIT 1020'],
      ['MAT 151', 'College Algebra', 4, 'B', 0.97, 'exact', 'MATH 1150'],
      ['MAT 221', 'Calculus I', 4, 'B-', 0.96, 'exact', 'MATH 1210'],
      ['CSC 110', 'Intro to Programming', 4, 'A-', 0.97, 'exact', 'CSCI 1100'],
      ['CSC 115', 'Programming II (Java)', 4, 'B', 0.95, 'likely', 'CSCI 1200', 0.84, 'Catalog description matches; no approved rule yet'],
      ['PSY 101', 'Intro to Psychology', 3, 'A', 0.98, 'exact', 'PSYC 1100'],
      ['HIS 112', 'World Civilizations II', 3, 'B', 0.94, 'exact', 'HIST 1120'],
      ['BIO 105', 'Biology with Lab', 4, 'C+', 0.93, 'exact', 'BIOL 1050'],
      ['ART 140', 'Digital Imaging', 3, 'A', 0.96, 'likely', 'ARTS 1400', 0.72, 'Similar title and outcomes; software differs'],
      ['COM 120', 'Public Speaking', 3, 'A-', 0.97, 'exact', 'COMM 1200'],
      ['GAM 150', 'Game Design Studio', 3, 'A', 0.95, 'review', null, 0, 'No equivalent course in the catalog']
    ]
  },
  {
    id: 'ag', short: 'ASC', school: 'Ashgrove State College', kind: 'Bachelor’s, partial · 1 year',
    student: 'Aiyana Brooks', file: 'ashgrove-transcript.pdf', scan: false, ask: 'Business',
    courses: [
      ['WRT 110', 'Academic Writing', 3, 'B', 0.97, 'exact', 'WRIT 1010'],
      ['STA 205', 'Intro Statistics', 3, 'A-', 0.96, 'exact', 'STAT 2100'],
      ['ECN 201', 'Macroeconomics', 3, 'B', 0.97, 'exact', 'ECON 2010'],
      ['ECN 202', 'Microeconomics', 3, 'C', 0.95, 'exact', 'ECON 2020'],
      ['ACC 210', 'Financial Accounting', 3, 'D+', 0.96, 'nocredit', 'ACCT 2010', 0, 'Grade below C- (transfer policy)'],
      ['PSY 230', 'Lifespan Development', 3, 'B+', 0.94, 'likely', 'PSYC 2300', 0.78, 'Covers the same span; one unit differs'],
      ['PHI 215', 'Ethics and Technology', 3, 'A', 0.95, 'review', 'PHIL 2150', 0.41, 'Partial overlap with PHIL 2150; needs a decision'],
      ['BUS 101', 'Intro to Business', 3, 'A', 0.97, 'likely', 'BUSN 1010', 0.81, 'Same title and level; no rule for this college'],
      ['CHM 101', 'General Chemistry I + Lab', 4, 'B', 0.93, 'exact', 'CHEM 1010']
    ]
  },
  {
    id: 'tr', short: 'TRTC', school: 'Tillman Ridge Technical College', kind: 'Applied associate · scanned copy',
    student: 'Tess Okafor-Hale', file: 'tillman-ridge-scan.pdf', scan: true, ask: 'Computer Science',
    courses: [
      ['ENG 111', 'Writing and Inquiry', 3, 'B', 0.91, 'exact', 'WRIT 1010'],
      ['MTH 121', 'Technical Math', 3, 'B', 0.68, 'review', 'MATH 1150', 0.38, 'Applied math; may not equal College Algebra'],
      ['NET 110', 'Networking Fundamentals', 4, 'A', 0.9, 'review', null, 0, 'No lower-division networking course'],
      ['CIS 115', 'Programming and Logic', 3, 'A-', 0.88, 'likely', 'CSCI 1100', 0.64, '3 credits against a 4-credit course'],
      ['ITS 140', 'Help Desk Support', 3, 'A', 0.87, 'review', null, 0, 'Technical course; elective at most'],
      ['COM 110', 'Speech Communication', 3, 'B+', 0.9, 'exact', 'COMM 1200'],
      ['PSY 150', 'General Psychology', 3, 'B', 0.71, 'exact', 'PSYC 1100'],
      ['WBL 111', 'Work-Based Learning', 1, 'S', 0.86, 'nocredit', null, 0, 'Work experience is not transferable (policy)']
    ]
  }
];

const state = {
  sample: SAMPLES[0],
  program: PROGRAMS[0],
  extracted: false,
  matched: false,
  learned: {},          /* "KBCC|CSC 115" -> { home, nocredit } written by evaluator decisions */
  justLearned: null,
  busy: false
};

function course(row) {
  const [code, title, cr, grade, read, s, home, conf, why] = row;
  return { code, title, cr, grade, read, s, home, conf, why };
}

/* What the equivalency table + flow say about a course right now. */
function resolve(c) {
  const key = state.sample.short + '|' + c.code;
  const l = state.learned[key];
  if (l) {
    if (l.home === 'NONE') return { s: 'nocredit', home: null, conf: 1, why: 'No credit · evaluator decision' };
    return { s: 'exact', home: l.home, conf: 1, why: 'Approved by an evaluator just now', learned: true };
  }
  const conf = c.s === 'exact' ? 0.99 : c.conf;
  return { s: c.s, home: c.home, conf, why: c.why || 'Approved rule in the equivalency table' };
}

const LABEL = { exact: 'Approved rule', likely: 'Likely', review: 'Needs evaluator review', nocredit: 'Not transferable' };

/* ================= 01 · The wait ================= */
(function waitSection() {
  const grid = $('course-grid');
  const cells = [];
  for (let i = 0; i < 100; i++) { const c = el('i'); grid.appendChild(c); cells.push(c); }
  const legend = $('course-legend');
  const tl = $('wait-timeline');
  const note = $('wait-note');
  const alt = $('course-grid-alt');

  const VIEWS = {
    today: {
      counts: [['manual', 100, 'Looked up by hand, one by one']],
      steps: [
        ['Transcript arrives and is indexed', 5, '5 days'],
        ['Waits in the evaluation queue', 21, '21 days', 'is-staff'],
        ['Evaluator looks up every course', 7, '7 days', 'is-staff'],
        ['Decision letter sent', 3, '3 days']
      ],
      note: '36 days before the student hears anything, even about courses with a rule already on file.'
    },
    agent: {
      counts: [['exact', 74, 'Approved rule applied'], ['likely', 12, 'Likely, evaluator confirms'], ['review', 14, 'No rule, evaluator decides']],
      steps: [
        ['Upload in chat, courses extracted', 0.02, '≈ 1 min', 'is-fast'],
        ['Approved rules applied', 0.01, 'seconds', 'is-fast'],
        ['Unofficial estimate shown', 0.02, '≈ 2 min', 'is-fast'],
        ['Evaluator decides the 26 open courses', 5, '5 days', 'is-staff']
      ],
      note: 'An unofficial estimate the same day. Evaluators spend their time on the 26 courses that need a person.'
    }
  };

  function show(which) {
    const v = VIEWS[which];
    let i = 0;
    v.counts.forEach(([cls, n]) => { for (let k = 0; k < n; k++) cells[i++].className = 'c-' + cls; });
    legend.textContent = '';
    v.counts.forEach(([cls, n, label]) => {
      const li = el('li');
      li.appendChild(el('i', 'sw sw-' + cls));
      li.appendChild(document.createTextNode(n + ' · ' + label));
      legend.appendChild(li);
    });
    alt.textContent = v.counts.map(([, n, label]) => n + ' of 100: ' + label).join('; ');
    tl.textContent = '';
    v.steps.forEach(([label, days, txt, cls]) => {
      const li = el('li', cls || '');
      li.appendChild(el('span', null, label));
      li.appendChild(el('b', null, txt));
      const bar = el('i');
      bar.style.width = Math.max(2, (days / 21) * 100) + '%';
      li.appendChild(bar);
      tl.appendChild(li);
    });
    note.textContent = v.note;
  }

  const group = document.querySelector('[data-wait]').parentElement;
  group.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { setPressed(group, b); show(b.dataset.wait); }));
  show('today');
})();

/* ================= 02 · Upload and extract ================= */
const extract = (function extractSection() {
  const picker = $('sample-picker');
  const thread = $('extract-thread');
  const lines = $('paper-lines');
  const body = $('extract-body');
  const status = $('extract-status');
  const play = $('extract-play');

  SAMPLES.forEach((s, i) => {
    const b = el('button');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(i === 0));
    b.appendChild(el('span', null, s.school));
    b.appendChild(el('small', null, s.kind));
    b.addEventListener('click', () => {
      if (state.busy) return;
      setPressed(picker, b);
      state.sample = s;
      state.extracted = false;
      state.matched = false;
      state.justLearned = null;
      render();
      matchApi.render();
      refreshDownstream();
    });
    picker.appendChild(b);
  });

  function msg(kind, who, text, attach) {
    const m = el('div', 'msg is-' + kind);
    m.appendChild(el('span', 'msg-who', who));
    m.appendChild(el('p', 'msg-body', text));
    if (attach) m.appendChild(el('span', 'attach', attach));
    thread.appendChild(m);
    return m;
  }

  function confCell(read) {
    const d = el('div', 'conf' + (read < 0.8 ? ' is-low' : ''));
    const bar = el('i');
    bar.style.setProperty('--w', Math.round(read * 100) + '%');
    d.appendChild(bar);
    d.appendChild(el('span', null, Math.round(read * 100) + '%'));
    if (read < 0.8) d.appendChild(el('em', null, 'check'));
    return d;
  }

  function addRow(c) {
    const tr = el('tr');
    const td1 = el('td');
    td1.appendChild(el('b', null, c.code));
    td1.appendChild(el('span', null, c.title));
    tr.appendChild(td1);
    tr.appendChild(el('td', null, String(c.cr)));
    tr.appendChild(el('td', null, c.grade));
    const td4 = el('td');
    td4.appendChild(confCell(c.read));
    tr.appendChild(td4);
    body.appendChild(tr);
  }

  function render() {
    const s = state.sample;
    $('paper').classList.toggle('is-scan', s.scan);
    $('paper-school').textContent = s.school.toUpperCase();
    $('paper-sub').textContent = 'Official transcript · ' + s.student + ' · ' + s.kind;
    lines.textContent = '';
    s.courses.map(course).forEach((c) => {
      const li = el('li');
      [c.code, c.title, String(c.cr), c.grade].forEach((t) => li.appendChild(el('span', null, t)));
      lines.appendChild(li);
    });
    thread.textContent = '';
    msg('you', s.student.toUpperCase() + ' · APPLICANT', 'Here’s my transcript. Will these count toward ' + s.ask + '?', s.file);
    body.textContent = '';
    const tr = el('tr', 'xempty');
    const td = el('td', null, 'Press “Upload and extract” to read the PDF.');
    td.colSpan = 4;
    tr.appendChild(td);
    body.appendChild(tr);
    status.textContent = '';
    play.textContent = '▶ Upload and extract';
  }

  async function run() {
    if (state.busy) return;
    state.busy = true;
    play.disabled = true;
    render();
    const s = state.sample;
    const cs = s.courses.map(course);
    await wait(350);
    msg('sys', 'TOPIC → AGENT FLOW', 'Evaluate my transcript → “Extract transcript courses” · Process documents (AI Builder)');
    await wait(400);
    body.textContent = '';
    const lis = Array.from(lines.children);
    for (let i = 0; i < cs.length; i++) {
      lis[i].classList.add('is-reading');
      await wait(190);
      lis[i].classList.remove('is-reading');
      lis[i].classList.add('is-read');
      addRow(cs[i]);
    }
    const credits = cs.reduce((a, c) => a + c.cr, 0);
    const low = cs.filter((c) => c.read < 0.8);
    await wait(300);
    if (low.length) {
      msg('ai', 'CAMPUS COPILOT', 'I read ' + cs.length + ' courses (' + credits + ' credits) from ' + s.school + '. The scan is faint on ' +
        low.map((c) => c.code).join(' and ') + ' — can you confirm those lines are right?');
      await wait(650);
      msg('you', s.student.toUpperCase(), 'Yes, both are right.');
    } else {
      msg('ai', 'CAMPUS COPILOT', 'I read ' + cs.length + ' courses (' + credits + ' credits) from ' + s.school + '. Every line read cleanly. Next I’ll check them against the equivalency table.');
    }
    status.textContent = cs.length + ' courses extracted · ' + (low.length ? low.length + ' confirmed by the student' : 'no low-confidence lines');
    state.extracted = true;
    play.disabled = false;
    play.textContent = '↻ Play again';
    state.busy = false;
  }

  play.addEventListener('click', run);
  render();
  return { render };
})();

/* ================= 03 · Match ================= */
const matchApi = (function matchSection() {
  const list = $('match-list');
  const trace = $('match-trace');
  const status = $('match-status');
  const play = $('match-play');
  const filterGroup = $('match-filter');
  let filter = 'all';

  filterGroup.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
    setPressed(filterGroup, b);
    filter = b.dataset.filter;
    applyFilter();
  }));

  function applyFilter() {
    list.querySelectorAll('.match-row').forEach((r) => {
      r.hidden = filter !== 'all' && (!state.matched || r.dataset.s !== filter);
    });
  }

  function row(c, r, revealed) {
    const li = el('li', 'match-row');
    li.dataset.s = r.s;
    const src = el('div', 'm-src');
    src.appendChild(el('b', null, c.code + ' · ' + c.cr + ' cr'));
    src.appendChild(el('span', null, c.title + ' · grade ' + c.grade));
    li.appendChild(src);
    li.appendChild(el('span', 'm-arrow', '→'));
    const dst = el('div', 'm-dst');
    const tag = el('div', 'm-tag');
    if (!revealed) {
      li.classList.add('is-pending');
      dst.appendChild(el('b', null, '—'));
      dst.appendChild(el('span', null, 'Not matched yet'));
      tag.appendChild(el('span', 'chip chip-wait', 'Waiting'));
    } else {
      li.classList.add('s-' + r.s);
      const h = r.home ? HOME[r.home] : null;
      dst.appendChild(el('b', null, r.home ? r.home + ' · ' + h.t : (r.s === 'review' ? 'No suggestion' : 'No credit')));
      dst.appendChild(el('span', null, r.why));
      tag.appendChild(el('span', 'chip chip-' + r.s, LABEL[r.s]));
      if (r.s === 'exact' || r.s === 'likely') tag.appendChild(el('span', 'm-conf', 'match ' + Math.round(r.conf * 100) + '%'));
      if (r.learned && state.justLearned === state.sample.short + '|' + c.code) li.classList.add('is-new');
    }
    li.appendChild(dst);
    li.appendChild(tag);
    return li;
  }

  function counts() {
    const n = { all: 0, exact: 0, likely: 0, review: 0, nocredit: 0 };
    state.sample.courses.map(course).forEach((c) => { n.all++; n[resolve(c).s]++; });
    Object.keys(n).forEach((k) => { $('n-' + k).textContent = state.matched || k === 'all' ? n[k] : '–'; });
    return n;
  }

  function summary(n) {
    status.textContent = n.exact + ' by approved rule · ' + n.likely + ' likely · ' + n.review + ' to an evaluator · ' + n.nocredit + ' not transferable';
  }

  function render() {
    list.textContent = '';
    state.sample.courses.map(course).forEach((c) => list.appendChild(row(c, resolve(c), state.matched)));
    const n = counts();
    if (state.matched) summary(n); else { status.textContent = ''; trace.textContent = ''; }
    play.textContent = state.matched ? '↻ Match again' : '▶ Match courses';
    const learnedHere = Object.keys(state.learned).length;
    const lc = $('learned-count');
    lc.hidden = learnedHere === 0;
    lc.textContent = learnedHere + ' new rule' + (learnedHere === 1 ? '' : 's') + ' learned from evaluator decisions';
    applyFilter();
  }

  async function run() {
    if (state.busy) return;
    state.busy = true;
    play.disabled = true;
    state.matched = false;
    render();
    const s = state.sample;
    const TOOLS = [
      'Dataverse · List rows · Transfer equivalency where institution = ' + s.short,
      'Condition · minimum grade C- · pass/fail policy',
      'Run a prompt · compare catalog descriptions for courses with no rule',
      'Dataverse · Add a new row · Evaluation request (likely + review)'
    ];
    for (const t of TOOLS) { trace.appendChild(el('li', null, t)); await wait(220); }
    const rows = Array.from(list.children);
    const cs = s.courses.map(course);
    for (let i = 0; i < cs.length; i++) {
      const fresh = row(cs[i], resolve(cs[i]), true);
      list.replaceChild(fresh, rows[i]);
      await wait(150);
    }
    state.matched = true;
    summary(counts());
    applyFilter();
    play.textContent = '↻ Match again';
    play.disabled = false;
    state.busy = false;
  }

  play.addEventListener('click', run);
  render();
  return { render };
})();

/* ================= 04 · Progress ================= */
const progressApi = (function progressSection() {
  const picker = $('program-picker');
  PROGRAMS.forEach((p, i) => {
    const b = el('button', null, p.name);
    b.type = 'button';
    b.setAttribute('aria-pressed', String(i === 0));
    b.addEventListener('click', () => { setPressed(picker, b); state.program = p; render(); });
    picker.appendChild(b);
  });

  function render() {
    const p = state.program;
    const B = { major: { label: 'Major requirements', target: p.major, items: [] }, gen: { label: 'General education', target: p.gen, items: [] }, elec: { label: 'Electives', target: p.elec, items: [] } };
    const tot = { exact: 0, likely: 0, review: 0 };
    let genUsed = 0;
    state.sample.courses.map(course).forEach((c) => {
      const r = resolve(c);
      if (r.s === 'nocredit') return;
      const h = r.home ? HOME[r.home] : null;
      let bucket = 'elec';
      if (h && h.major && h.major.includes(p.id)) bucket = 'major';
      else if (h && h.gen && genUsed + c.cr <= p.gen) { bucket = 'gen'; genUsed += c.cr; }
      B[bucket].items.push({ label: r.home && r.home !== 'ELEC 1XXX' ? r.home : c.code + ' (elective)', cr: c.cr, s: r.s });
      tot[r.s] += c.cr;
    });

    const pct = (n) => (n / 120) * 100 + '%';
    $('seg-exact').style.width = pct(tot.exact);
    $('seg-likely').style.width = pct(tot.likely);
    $('seg-review').style.width = pct(tot.review);
    $('prog-applied').textContent = tot.exact + tot.likely;
    $('prog-pending').textContent = tot.review;
    $('degree-alt').textContent = 'Of 120 credits for ' + p.name + ': ' + tot.exact + ' by approved rule, ' + tot.likely + ' likely, ' + tot.review + ' pending evaluator review.';

    const host = $('buckets');
    host.textContent = '';
    Object.values(B).forEach((b) => {
      const box = el('div', 'bucket');
      const head = el('div', 'bucket-head');
      const sum = (s) => b.items.filter((x) => x.s === s).reduce((a, x) => a + x.cr, 0);
      const got = sum('exact') + sum('likely');
      head.appendChild(el('span', null, b.label));
      head.appendChild(el('b', null, Math.min(got, b.target) + ' / ' + b.target));
      box.appendChild(head);
      const bar = el('div', 'bar');
      [['exact', 'seg-exact'], ['likely', 'seg-likely'], ['review', 'seg-review']].forEach(([s, cls]) => {
        const seg = el('i', cls);
        seg.style.width = Math.min(100, (sum(s) / b.target) * 100) + '%';
        bar.appendChild(seg);
      });
      box.appendChild(bar);
      const ul = el('ul');
      if (!b.items.length) ul.appendChild(el('li', 'is-none', 'Nothing yet from this transcript'));
      b.items.forEach((x) => ul.appendChild(el('li', x.s === 'exact' ? '' : 'b-' + x.s, x.label + ' · ' + x.cr)));
      box.appendChild(ul);
      host.appendChild(box);
    });

    const majorGot = B.major.items.filter((x) => x.s !== 'review').reduce((a, x) => a + x.cr, 0);
    $('progress-note').textContent = 'For ' + p.name + ', ' + majorGot + ' credits land in the major and ' +
      Math.max(0, 120 - tot.exact - tot.likely - tot.review) + ' remain after everything pending is decided.';
  }

  render();
  return { render };
})();

/* ================= 05 · Evaluator review ================= */
const reviewApi = (function reviewSection() {
  const list = $('queue-list');
  const empty = $('queue-empty');
  const steps = Array.from($('loop-steps').children);
  const loopStatus = $('loop-status');

  const OPTIONS = Object.keys(HOME).filter((k) => k !== 'NONE');

  async function decide(c, home) {
    const key = state.sample.short + '|' + c.code;
    state.learned[key] = { home };
    state.justLearned = key;
    steps.forEach((s) => s.classList.remove('is-lit'));
    const label = home === 'NONE' ? 'No credit' : home + ' · ' + HOME[home].t;
    loopStatus.textContent = 'Decision recorded: ' + state.sample.short + ' ' + c.code + ' → ' + label;
    render();
    matchApi.render();
    progressApi.render();
    for (let i = 0; i < steps.length; i++) {
      steps[i].classList.add('is-lit');
      await wait(380);
    }
    loopStatus.textContent = 'Rule written to the equivalency table (Approved). The next ' + state.sample.short + ' transcript with ' + c.code + ' matches instantly.';
  }

  function item(c, r) {
    const li = el('li', 'q-item');
    const top = el('div', 'q-top');
    top.appendChild(el('b', null, state.sample.short + ' ' + c.code + ' · ' + c.title));
    top.appendChild(el('span', null, state.sample.student + ' · ' + c.cr + ' cr · ' + c.grade));
    li.appendChild(top);
    const sug = r.home ? r.home + ' · ' + HOME[r.home].t : 'none';
    li.appendChild(el('p', 'q-why', LABEL[r.s] + ' · Suggested: ' + sug + ' · ' + r.why));
    const actions = el('div', 'q-actions');
    if (r.home) {
      const ok = el('button', 'is-approve', 'Approve ' + r.home);
      ok.type = 'button';
      ok.addEventListener('click', () => decide(c, r.home));
      actions.appendChild(ok);
    }
    const sel = el('select');
    sel.setAttribute('aria-label', 'Override ' + c.code + ' to');
    const ph = el('option', null, r.home ? 'Override to…' : 'Decide…');
    ph.value = '';
    sel.appendChild(ph);
    OPTIONS.forEach((k) => {
      if (k === r.home) return;
      const o = el('option', null, k + ' · ' + HOME[k].t);
      o.value = k;
      sel.appendChild(o);
    });
    const none = el('option', null, 'No credit');
    none.value = 'NONE';
    sel.appendChild(none);
    const save = el('button', null, 'Save');
    save.type = 'button';
    save.disabled = true;
    sel.addEventListener('change', () => { save.disabled = !sel.value; });
    save.addEventListener('click', () => { if (sel.value) decide(c, sel.value); });
    actions.appendChild(sel);
    actions.appendChild(save);
    li.appendChild(actions);
    return li;
  }

  function render() {
    list.textContent = '';
    const open = state.sample.courses.map(course).filter((c) => {
      const s = resolve(c).s;
      return s === 'likely' || s === 'review';
    });
    open.forEach((c) => list.appendChild(item(c, resolve(c))));
    $('queue-count').textContent = open.length + ' open · ' + state.sample.short;
    empty.hidden = open.length > 0;
  }

  /* Evaluator asks a connected Fabric data agent. */
  const fthread = $('fabric-thread');
  const fplay = $('fabric-play');
  fplay.addEventListener('click', async () => {
    fplay.disabled = true;
    fthread.textContent = '';
    const q = el('div', 'msg is-you');
    q.appendChild(el('span', 'msg-who', 'EVALUATOR · TEAMS'));
    q.appendChild(el('p', 'msg-body', 'Which incoming courses went to review most often this year?'));
    fthread.appendChild(q);
    await wait(500);
    const sys = el('div', 'msg is-sys');
    sys.appendChild(el('span', 'msg-who', 'CONNECTED AGENT'));
    sys.appendChild(el('p', 'msg-body', 'Fabric data agent · Evaluation requests (OneLake) · your permissions'));
    fthread.appendChild(sys);
    await wait(600);
    const a = el('div', 'msg is-ai');
    a.appendChild(el('span', 'msg-who', 'TRANSFER DATA'));
    a.appendChild(el('p', 'msg-body', 'Top five by review count. Approving the first two would remove about a fifth of next term’s queue.'));
    const bars = el('div', 'fab-bars');
    [['TRTC NET 110', 31], ['KBCC GAM 150', 24], ['ASC PHI 215', 17], ['TRTC ITS 140', 15], ['TRTC MTH 121', 12]].forEach(([k, v]) => {
      const d = el('div');
      d.appendChild(el('span', null, k));
      const i = el('i');
      i.style.width = (v / 31) * 100 + '%';
      d.appendChild(i);
      d.appendChild(el('b', null, String(v)));
      bars.appendChild(d);
    });
    a.appendChild(bars);
    fthread.appendChild(a);
    fplay.disabled = false;
    fplay.textContent = '↻ Ask again';
  });

  render();
  return { render };
})();

function refreshDownstream() {
  progressApi.render();
  reviewApi.render();
  $('loop-status').textContent = '';
  document.querySelectorAll('#loop-steps li').forEach((s) => s.classList.remove('is-lit'));
}

/* ================= 06 · How it's built ================= */
(function stack() {
  const COLS = [
    ['Channels', [
      ['Website chat', 'Applicants · signed in', 'Published to a custom website (web chat / Direct Line) with sign-in. File upload works on this channel and in Teams, but not on the SharePoint channel.', 'GA'],
      ['Microsoft Teams', 'Admitted students · evaluators', 'Admitted students with campus accounts chat in Teams. Evaluators use their own agent there, the only channel where Microsoft validates the connected Fabric data agent.', 'GA']
    ]],
    ['Copilot Studio agents', [
      ['Transfer Credit agent', 'Student-facing', 'Generative orchestration, instructions that require the “Unofficial estimate” label, a topic that collects the transcript, and SharePoint knowledge for the transfer policy so policy answers are cited.', 'Agent', true],
      ['Evaluator agent', 'Staff-facing · Teams', 'Shared only with the evaluator security group in Entra ID. It shows the queue, explains each proposed match and answers questions about trends through a connected Fabric data agent.', 'Agent', true]
    ]],
    ['Tools', [
      ['Topic · Evaluate my transcript', 'Question node → File', 'Gets the PDF from a Question node (identify: File) or First(System.Activity.Attachments) and passes contentBytes and name to the extraction flow.', 'GA'],
      ['Agent flow · Extract courses', 'Process documents · Run a prompt', 'AI Builder Process documents with a custom document processing model returns course fields with confidence scores. A Run a prompt node (document input, JSON output) covers layouts you haven’t trained. Azure AI Document Intelligence (form recognizer) is the pro-code option.', 'GA'],
      ['Agent flow · Match and estimate', 'Dataverse · prompt · conditions', 'Looks up each course in the equivalency table, applies grade policy, asks a prompt for a likely equivalent when there’s no rule, and creates evaluation requests for anything not already approved.', 'GA'],
      ['SIS / degree audit MCP server', 'What-if by program', 'Your own or your SIS vendor’s MCP server, added as a tool. Runs a what-if audit for the selected program. Without one, the flow sums credits against a Dataverse requirements table.', 'Your build'],
      ['Fabric data agent', 'Connected agent', 'Answers evaluators’ questions over the evaluation and equivalency data in OneLake with user authentication, so each person sees only what they’re permitted to. Validated only in Teams.', 'Preview']
    ]],
    ['Data and decisions', [
      ['Dataverse · Equivalency table', 'The rules, and the learning loop', 'Sending institution, course, home course, credits, minimum grade, status, approved by, effective term. Only an evaluator decision creates or changes an Approved row.', 'GA'],
      ['Dataverse · Evaluation requests', 'The queue', 'One row per course that needs a person. Evaluators work it in a model-driven app or the Teams agent. A Dataverse-triggered flow writes the rule back when a decision is saved.', 'GA'],
      ['Standard approvals', 'Optional approval card', 'A cloud flow can send “Start and wait for an approval” to the evaluator group in Teams. Multistage and AI approvals in agent flows are preview.', 'GA'],
      ['Entra ID and sign-in', 'Who sees what', 'Authenticate with Microsoft for campus accounts, or Authenticate manually (Generic OAuth 2) against the applicant portal. Students see only their own requests.', 'GA'],
      ['OneLake · Link to Microsoft Fabric', 'Reporting', 'Dataverse tables linked into OneLake for the Fabric data agent and Power BI.', 'GA']
    ]]
  ];

  const map = $('stack-map');
  const title = $('stack-detail-title');
  const bodyEl = $('stack-detail-body');
  const tag = $('stack-detail-tag');
  const buttons = [];

  function select(b, n) {
    buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    title.textContent = n[0];
    bodyEl.textContent = n[2];
    tag.textContent = n[3];
  }

  COLS.forEach(([name, nodes]) => {
    const col = el('div', 'stack-col');
    col.appendChild(el('p', null, name));
    nodes.forEach((n) => {
      const b = el('button', 'node' + (n[4] ? ' is-agent' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(el('span', null, n[0]));
      b.appendChild(el('small', null, n[1]));
      b.addEventListener('click', () => select(b, n));
      buttons.push(b);
      col.appendChild(b);
    });
    map.appendChild(col);
  });
  select(buttons[2], COLS[1][1][0]);
})();

/* ================= 07 · Control and outcome ================= */
(function control() {
  const ROLES = {
    student: {
      can: ['Upload their own transcript after signing in', 'See an unofficial estimate for any program', 'Ask about transfer policy, with citations', 'See when each pending course gets a decision'],
      cannot: ['See anyone else’s transcript or requests', 'Get official credit from the agent', 'Change the equivalency table']
    },
    evaluator: {
      can: ['Approve or override every likely or unknown match', 'See why the flow proposed each match', 'Ask the Fabric data agent about trends they’re permitted to see', 'Add a note and an effective term to each rule'],
      cannot: ['Post credit to the student record from the agent', 'Make a decision without it being logged with name and time']
    },
    admin: {
      can: ['Manage the evaluator group in Entra ID', 'Set environments and DLP in the Power Platform admin center', 'Audit agent activity with Microsoft Purview', 'Set transcript retention under the records policy', 'Watch usage and outcomes in Copilot Studio analytics'],
      cannot: ['Have the flow turn a “Likely” match into a rule by itself: it only writes after a recorded decision']
    }
  };
  const group = $('role-picker');
  const can = $('role-can');
  const cannot = $('role-cannot');
  function show(r) {
    can.textContent = '';
    cannot.textContent = '';
    ROLES[r].can.forEach((t) => can.appendChild(el('li', null, t)));
    ROLES[r].cannot.forEach((t) => cannot.appendChild(el('li', null, t)));
  }
  group.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { setPressed(group, b); show(b.dataset.role); }));
  show('student');

  const MONTHS = [['Sep', 74], ['Oct', 76], ['Nov', 79], ['Dec', 81], ['Jan', 83], ['Feb', 85], ['Mar', 87], ['Apr', 88]];
  const host = $('month-bars');
  MONTHS.forEach(([m, v]) => {
    const d = el('div');
    d.title = m + ' · ' + v + '%';
    d.appendChild(el('b', null, v + '%'));
    const i = el('i');
    i.style.height = v * 0.75 + '%';
    d.appendChild(i);
    d.appendChild(el('span', null, m));
    host.appendChild(d);
  });
})();
