'use strict';

const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const fmt = (n) => n.toLocaleString('en-US');

/* Presenter notes */
(function notes() {
  const box = $('notes-on');
  const apply = () => document.querySelectorAll('.pnote').forEach((p) => { p.hidden = !box.checked; });
  box.addEventListener('change', apply);
  apply();
})();

/* ================= 01 · reach ================= */
(function reach() {
  const STUDENTS = 11400;
  const PER_DOT = 10;
  const COUNSELED = 1940;
  const dots = $('reach-dots');
  const n = STUDENTS / PER_DOT;
  const counselDots = Math.round(COUNSELED / PER_DOT);
  const frag = document.createDocumentFragment();
  const all = [];
  for (let i = 0; i < n; i++) { const s = el('span'); all.push(s); frag.appendChild(s); }
  dots.appendChild(frag);

  /* Spread the counseled dots so the grid doesn't read as a block. */
  const counselSet = new Set();
  for (let k = 0; k < counselDots; k++) counselSet.add(Math.floor((k * n) / counselDots));

  const GAP = {
    today: [['Continuing-gen', 38], ['First-generation', 17], ['Transfer', 14]],
    agent: [['Continuing-gen', 74], ['First-generation', 69], ['Transfer', 66]]
  };
  const gapHost = $('gap-bars');
  const gapRows = GAP.today.map(([label]) => {
    const row = el('div', 'gaprow');
    row.appendChild(el('span', '', label));
    const t = el('div', 'track'); t.appendChild(el('i')); row.appendChild(t);
    row.appendChild(el('b'));
    gapHost.appendChild(row);
    return row;
  });

  function show(mode) {
    const agent = mode === 'agent';
    all.forEach((d, i) => {
      d.className = counselSet.has(i) ? 'd-counsel' : (agent ? 'd-agent' : '');
    });
    $('reach-on').textContent = agent ? fmt(STUDENTS) : fmt(COUNSELED);
    $('reach-on-label').textContent = agent ? 'can get prep, any hour' : 'got 1:1 prep this year';
    $('reach-off').textContent = agent ? fmt(COUNSELED) : fmt(STUDENTS - COUNSELED);
    $('reach-off-label').textContent = agent ? 'also saw a counselor' : 'did not';
    $('reach-off').parentElement.classList.toggle('is-good', agent);
    $('reach-alt').textContent = agent
      ? 'All 11,400 students can get first-pass prep from the agent; 1,940 also met a counselor.'
      : '1,940 of 11,400 students had a counselor appointment this year; 9,460 did not.';
    const leg = $('reach-legend');
    leg.textContent = '';
    const item = (color, text) => { const s = el('span'); const i = el('i'); i.style.background = color; s.appendChild(i); s.appendChild(document.createTextNode(text)); leg.appendChild(s); };
    item('#023347', '1:1 with a counselor');
    if (agent) item('#9fd4d8', 'prep from the agent'); else item('#dfe7e9', 'no prep before applying');
    $('reach-note').textContent = agent
      ? 'Counselor hours don\'t change. Who gets prepared does.'
      : 'Six counselors book out by week three. The rest of the term runs on a waitlist.';
    GAP[mode].forEach(([, v], i) => {
      gapRows[i].querySelector('i').style.width = v + '%';
      gapRows[i].querySelector('b').textContent = v + '%';
      gapRows[i].classList.toggle('is-low', v < 30);
    });
    document.querySelectorAll('[data-reach]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.reach === mode)));
  }
  document.querySelectorAll('[data-reach]').forEach((b) => b.addEventListener('click', () => show(b.dataset.reach)));
  show('today');
})();

/* ================= 02 · resume feedback ================= */
(function resume() {
  const DOC = [
    ['h3', null, 'Jonah Mbeki'],
    ['sub', null, 'Business Analytics, Class of 2028 · jmbeki@campus.example'],
    ['h4', null, 'EXPERIENCE'],
    ['role', null, 'Shift lead · Campus Dining, Riverside Café · 2025–present'],
    ['li', 'l1', 'Responsible for opening and closing the café'],
    ['li', 'l2', 'Trained new staff'],
    ['li', 'l3', 'Built a spreadsheet to track food waste'],
    ['h4', null, 'PROJECTS'],
    ['role', null, 'Bike-share demand · BUA 210 course project'],
    ['li', 'l4', 'Analyzed city bike-share trips in Python (pandas) and presented to class'],
    ['h4', null, 'SKILLS'],
    ['li', 'l5', 'Excel, Python, teamwork, hard-working, detail-oriented']
  ];
  const page = $('doc-page');
  let ul = null;
  DOC.forEach(([kind, id, text]) => {
    if (kind === 'li') {
      if (!ul) { ul = el('ul'); page.appendChild(ul); }
      const li = el('li', 'doc-line', text);
      li.id = 'doc-' + id;
      ul.appendChild(li);
      return;
    }
    ul = null;
    if (kind === 'h3') page.appendChild(el('h3', '', text));
    else if (kind === 'sub') page.appendChild(el('p', 'doc-sub', text));
    else if (kind === 'h4') page.appendChild(el('h4', '', text));
    else page.appendChild(el('p', 'role', text));
  });

  const RUBRIC = [
    ['Impact and results', 'dev'],
    ['Relevance to the target role', 'dev'],
    ['Evidence for skills', 'miss'],
    ['Clarity and concision', 'strong'],
    ['Readable by applicant systems', 'strong']
  ];
  const LEVEL = { strong: ['Strong', 3, 'l-strong'], dev: ['Developing', 2, 'l-dev'], miss: ['Missing', 1, 'l-miss'] };
  const rub = $('rubric');
  const rubRows = RUBRIC.map(([name]) => {
    const li = el('li');
    li.appendChild(el('span', '', name));
    li.appendChild(el('span', 'lvl', 'Not run'));
    const m = el('span', 'meter'); for (let i = 0; i < 3; i++) m.appendChild(el('i'));
    li.appendChild(m);
    rub.appendChild(li);
    return li;
  });

  const FEEDBACK = [
    { line: 'l3', crit: 'Impact and results', q: 'This is your strongest line for an analyst role, and it\'s buried third. What changed because of the tracker? If you have a number (kilograms, percent, dollars), lead with it.', p: 'Built [tool] to track [what], which [result] by [amount].' },
    { line: 'l1', crit: 'Impact and results', q: '“Responsible for” describes the job, not what you did in it. What would have gone wrong on a shift without you?', p: '[Action verb] [what you did] for [scale], [outcome].' },
    { line: 'l2', crit: 'Evidence for skills', q: 'How many people did you train, and did anything get faster or easier for them afterwards?', p: 'Trained [number] [who] on [what], [outcome].' },
    { line: 'l4', crit: 'Relevance to the target role', q: 'The posting asks for SQL and dashboards. Did the project answer a question someone cared about? Name the finding, the tools, and any chart you built.', p: 'Analyzed [data] with [tools] to find [insight]; [what you produced].' },
    { line: 'l5', crit: 'Evidence for skills', q: '“Teamwork” and “hard-working” are claims a reader can\'t check. Could the bullets above show them instead, so this line lists tools only?', p: null },
    { line: null, crit: 'Readable by applicant systems', q: 'Single column, standard headings, no tables or text boxes. Applicant tracking systems should read this cleanly. Keep it.', p: null, good: true }
  ];
  const MODES = {
    questions: 'The agent asks questions and points at lines. It never supplies wording.',
    patterns: 'Questions, plus a fill-in-the-blank pattern. The student supplies every word that goes on the page.',
    rewrite: 'Off at this institution. If a student asks, the agent says so and coaches instead.'
  };
  let mode = 'patterns';
  let ran = false;
  let timers = [];
  const list = $('feedback');
  const status = $('review-status');

  function focusLine(id, btn) {
    document.querySelectorAll('.doc-line.is-focus').forEach((n) => n.classList.remove('is-focus'));
    list.querySelectorAll('.fb').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    if (id) $('doc-' + id).classList.add('is-focus');
  }

  function renderFeedback(animate) {
    list.textContent = '';
    if (mode === 'rewrite') {
      const li = el('li');
      const r = el('div', 'refusal');
      r.appendChild(el('b', '', 'STUDENT ASKED: “JUST REWRITE IT FOR ME”'));
      r.appendChild(document.createTextNode('“I can\'t write your resume for you here; the career office keeps that with you. I can make it quick, though: answer the six questions below and paste your new bullets back, and I\'ll check them against the rubric.”'));
      li.appendChild(r);
      list.appendChild(li);
    }
    const items = FEEDBACK.map((f) => {
      const li = el('li');
      const b = el('button', 'fb' + (f.good ? ' is-good' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      const top = el('span', 'fb-top');
      top.appendChild(el('strong', '', f.good ? 'Keep' : (f.line ? 'Line ' + f.line.slice(1) : 'Whole page')));
      top.appendChild(el('span', 'src', f.crit));
      b.appendChild(top);
      b.appendChild(el('span', 'fb-q', f.q));
      if (f.p && mode === 'patterns') b.appendChild(el('span', 'fb-pattern', f.p));
      b.addEventListener('click', () => focusLine(f.line, b));
      li.appendChild(b);
      list.appendChild(li);
      return li;
    });
    const lis = Array.from(list.children);
    if (!animate || reduceMotion.matches) { lis.forEach((li) => li.classList.add('is-in')); return; }
    lis.forEach((li, i) => timers.push(setTimeout(() => li.classList.add('is-in'), 140 * i)));
    return items;
  }

  function setMode(m) {
    mode = m;
    document.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.mode === m)));
    $('policy-desc').textContent = MODES[m];
    if (ran) { timers.forEach(clearTimeout); timers = []; renderFeedback(false); }
  }
  document.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  setMode('patterns');

  $('run-review').addEventListener('click', () => {
    timers.forEach(clearTimeout);
    timers = [];
    ran = true;
    const btn = $('run-review');
    btn.disabled = true;
    status.textContent = 'Reading the PDF against the career office rubric…';
    document.querySelectorAll('.doc-line').forEach((n) => n.classList.remove('is-flag', 'is-focus'));
    list.textContent = '';
    const step = reduceMotion.matches ? 0 : 220;
    RUBRIC.forEach(([, lvl], i) => {
      timers.push(setTimeout(() => {
        const [label, filled, cls] = LEVEL[lvl];
        const tag = rubRows[i].querySelector('.lvl');
        tag.textContent = label;
        tag.className = 'lvl ' + cls;
        rubRows[i].querySelectorAll('.meter i').forEach((m, k) => m.classList.toggle('on', k < filled));
      }, step * (i + 1)));
    });
    timers.push(setTimeout(() => {
      FEEDBACK.forEach((f) => { if (f.line && !f.good) $('doc-' + f.line).classList.add('is-flag'); });
      renderFeedback(true);
      status.textContent = '6 notes, 5 lines flagged. Select a note to find its line. No words were changed.';
      btn.disabled = false;
      btn.textContent = 'Run it again';
    }, step * (RUBRIC.length + 1)));
  });
})();

/* ================= 03 · interview practice ================= */
(function interview() {
  const SCRIPTS = {
    analyst: [
      ['ai', 'Campus Copilot · interview coach', 'Let\'s practise for the data analyst internship. I\'ll ask four questions, one at a time. First: tell me about a time you used data to change a decision.'],
      ['you', 'Jonah', 'At the café I tracked what we threw away each night in a spreadsheet. I showed my manager and we started baking fewer muffins on Mondays.'],
      ['fb', 'Feedback · structure', 'Good example, and you have the result. Two things: say the size of the change (how much less waste?) and what you did to persuade your manager. Situation, task, action, result: your action is the thinnest part.'],
      ['you', 'Jonah', 'I compared four weeks of waste by day, saw Mondays were double, and made a one-page chart. Waste dropped about a third.'],
      ['fb', 'Feedback · specifics', 'Much stronger: method, evidence, outcome, in three sentences. That is also the bullet your resume is missing.'],
      ['ai', 'Campus Copilot · interview coach', 'Next question: what would you do if the data you were given had obvious errors and the deadline was tomorrow?'],
      ['sum', 'Practice summary', null]
    ],
    nonprofit: [
      ['ai', 'Campus Copilot · interview coach', 'Practising for a program assistant role at a community nonprofit. First question: why this organisation, and why now?'],
      ['you', 'Jonah', 'I want to help people and I think nonprofits do important work.'],
      ['fb', 'Feedback · specifics', 'Every candidate can say that. Name something this organisation does that you\'ve seen or read about, and connect it to something you\'ve done. What made you click “apply”?'],
      ['you', 'Jonah', 'Your food-access program. I cut waste at our campus café and I want to work on the other end of the problem, getting food to people.'],
      ['fb', 'Feedback · structure', 'That is specific and memorable, and it links your experience to their mission. Keep it under 45 seconds when you say it aloud.'],
      ['ai', 'Campus Copilot · interview coach', 'Next: tell me about a time you worked with someone whose approach was very different from yours.'],
      ['sum', 'Practice summary', null]
    ]
  };
  const SUMMARY = {
    analyst: ['Lead with the number: “waste dropped about a third”.', 'Name your method before your result.', 'Prepare one answer about messy data.'],
    nonprofit: ['Open with their program, not “helping people”.', 'Your café story works on both resumes. Use it.', 'Prepare a teamwork example with a disagreement in it.']
  };
  let role = 'analyst';
  let timers = [];
  const thread = $('interview-thread');

  function bubble([kind, who, text]) {
    const m = el('div', 'msg ' + ({ ai: 'is-ai', you: 'is-you', fb: 'is-fb', sum: 'is-sum' })[kind]);
    m.appendChild(el('span', 'msg-who', who.toUpperCase()));
    if (kind === 'sum') {
      m.appendChild(el('p', 'msg-body', 'Three things to practise before the real one:'));
      const ul = el('ul');
      SUMMARY[role].forEach((s) => ul.appendChild(el('li', '', s)));
      m.appendChild(ul);
      m.appendChild(el('p', 'msg-body', 'Save these notes to your career record? Only you, and a counselor if you choose, can see them.'));
      const row = el('div', 'controls');
      row.style.margin = '8px 0 0';
      ['Save notes', 'Don\'t save'].forEach((label, i) => {
        const b = el('button', i ? 'ghost-button' : 'primary-button', label);
        b.type = 'button';
        b.addEventListener('click', () => {
          $('interview-turn').textContent = i ? 'Nothing saved' : 'Saved to Dataverse · private to Jonah';
          row.querySelectorAll('button').forEach((x) => { x.disabled = true; });
        });
        row.appendChild(b);
      });
      m.appendChild(row);
    } else {
      m.appendChild(el('p', 'msg-body', text));
    }
    return m;
  }

  function play() {
    timers.forEach(clearTimeout);
    timers = [];
    thread.textContent = '';
    const script = SCRIPTS[role];
    const btn = $('play-interview');
    btn.disabled = true;
    $('interview-turn').textContent = 'Text role-play';
    const gap = reduceMotion.matches ? 0 : 900;
    script.forEach((line, i) => {
      timers.push(setTimeout(() => {
        thread.appendChild(bubble(line));
        if (i === script.length - 1) { btn.disabled = false; btn.textContent = '▶ Play again'; }
      }, gap * i));
    });
  }

  document.querySelectorAll('[data-role]').forEach((b) => b.addEventListener('click', () => {
    role = b.dataset.role;
    document.querySelectorAll('[data-role]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    timers.forEach(clearTimeout);
    timers = [];
    thread.textContent = '';
    $('play-interview').disabled = false;
    $('play-interview').textContent = '▶ Play the practice';
  }));
  $('play-interview').addEventListener('click', play);
})();

/* ================= 04 · jobs and events ================= */
(function opportunities() {
  const tabs = [$('tab-jobs'), $('tab-events')];
  function select(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t, false));
    t.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); select(tabs[1 - i], true); }
    });
  });

  const JOBS = [
    { t: 'Data analyst intern, summer', org: 'Harbor Regional Health', type: 'Internship', local: true, pay: '$22/hr', fit: ['Python', 'Excel', 'Local, no relocation'], gap: 'SQL listed as preferred', src: 'Career job board' },
    { t: 'Operations analytics intern', org: 'Northgate Logistics', type: 'Internship', local: true, pay: '$20/hr', fit: ['Waste-tracking project', 'Spreadsheet modelling'], gap: null, src: 'Career job board' },
    { t: 'Student data assistant', org: 'Office of Institutional Research', type: 'Part-time', local: true, pay: '$17/hr', fit: ['On campus', 'Python (pandas)'], gap: 'Starts in January', src: 'Career job board' },
    { t: 'Marketing analytics intern', org: 'Lumen & Co.', type: 'Internship', local: false, pay: '$21/hr', fit: ['Presentation experience'], gap: 'Requires relocation', src: 'Employer listing' },
    { t: 'Student trainee, data science', org: 'Federal statistical agency', type: 'Internship', local: true, pay: 'GS-04', fit: ['Statistics coursework', 'Local field office'], gap: 'US citizenship required', src: 'USAJOBS connector', fed: true }
  ];
  let filter = 'all';
  const host = $('jobs');
  const status = $('jobs-status');

  function render() {
    host.textContent = '';
    const fed = $('fed-toggle').checked;
    const rows = JOBS.filter((j) => (fed || !j.fed) && (filter === 'all' || (filter === 'remote' ? j.local : j.type === filter)));
    if (!rows.length) { host.appendChild(el('li', 'empty', 'No listings match. The agent says so rather than stretching the match.')); return; }
    rows.forEach((j) => {
      const li = el('li', 'job' + (j.fed ? ' is-fed' : ''));
      const top = el('div', 'job-top');
      const left = el('div');
      left.appendChild(el('strong', '', j.t));
      left.appendChild(el('span', 'org', j.org + ' · ' + j.type + ' · ' + j.pay));
      top.appendChild(left);
      top.appendChild(el('span', 'src', j.src));
      li.appendChild(top);
      const fit = el('div', 'fit');
      j.fit.forEach((f) => fit.appendChild(el('span', '', '✓ ' + f)));
      if (j.gap) fit.appendChild(el('span', 'gap', '△ ' + j.gap));
      li.appendChild(fit);
      const act = el('div', 'job-actions');
      const save = el('button', '', 'Save');
      save.type = 'button';
      save.setAttribute('aria-pressed', 'false');
      save.addEventListener('click', () => {
        const on = save.getAttribute('aria-pressed') !== 'true';
        save.setAttribute('aria-pressed', String(on));
        save.textContent = on ? 'Saved' : 'Save';
        status.textContent = on ? 'Saved to Jonah\'s list in Dataverse. Deadline reminder set for 7 days before close.' : 'Removed from saved listings.';
      });
      const open = el('button', '', 'Apply on the posting ↗');
      open.type = 'button';
      open.addEventListener('click', () => {
        status.textContent = 'Opens the original posting. Jonah applies there; the agent never submits an application.';
      });
      act.appendChild(save);
      act.appendChild(open);
      li.appendChild(act);
      host.appendChild(li);
    });
  }
  document.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => {
    filter = b.dataset.f;
    document.querySelectorAll('[data-f]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    render();
  }));
  $('fed-toggle').addEventListener('change', () => {
    status.textContent = $('fed-toggle').checked ? 'Federal listings added from the USAJOBS connector (preview).' : '';
    render();
  });
  render();

  const EVENTS = [
    { d: '16', m: 'NOV', t: 'Analytics careers panel', w: 'Harbor Regional Health, Northgate Logistics · Student Centre', tags: ['analytics'] },
    { d: '17', m: 'NOV', t: 'Federal jobs: how USAJOBS applications work', w: 'Virtual · Teams webinar', tags: ['public'] },
    { d: '18', m: 'NOV', t: 'Resume drop-in, no appointment needed', w: 'Career Centre · 12–3 pm', tags: ['any'] },
    { d: '19', m: 'NOV', t: 'City Hall data & policy info session', w: 'Library room 2B', tags: ['public', 'analytics'] },
    { d: '20', m: 'NOV', t: 'Spring internship fair', w: 'Gymnasium · 40 employers', tags: ['any', 'analytics', 'public'] }
  ];
  let evf = 'all';
  const evHost = $('events');
  function renderEvents() {
    evHost.textContent = '';
    EVENTS.filter((e) => evf === 'all' || e.tags.includes(evf)).forEach((e) => {
      const li = el('li', 'event');
      const d = el('div', 'date'); d.appendChild(el('b', '', e.d)); d.appendChild(el('span', '', e.m));
      li.appendChild(d);
      const mid = el('div'); mid.appendChild(el('strong', '', e.t)); mid.appendChild(el('em', '', e.w));
      li.appendChild(mid);
      const b = el('button', '', 'Add to calendar');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        const on = b.getAttribute('aria-pressed') !== 'true';
        b.setAttribute('aria-pressed', String(on));
        b.textContent = on ? 'Added' : 'Add to calendar';
        $('events-status').textContent = on ? 'Added to Jonah\'s Outlook calendar after he selected it on the card.' : 'Removed from the calendar.';
      });
      li.appendChild(b);
      evHost.appendChild(li);
    });
  }
  document.querySelectorAll('[data-ev]').forEach((b) => b.addEventListener('click', () => {
    evf = b.dataset.ev;
    document.querySelectorAll('[data-ev]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    renderEvents();
  }));
  renderEvents();
})();

/* ================= 05 · booking ================= */
(function booking() {
  ['An offer or salary to negotiate', 'Changing major or career direction', 'Visa or work authorisation', 'Stress or distress (to counselling services)', 'The student asks for a person'].forEach((t) => {
    $('handover-chips').appendChild(el('span', 'gchip', t));
  });
  const STEPS = [
    ['Student', 'w-student', 'Jonah asks for help with an offer', 'He has an offer from Northgate and a deadline Friday.', '“Should I ask for more? I don\'t want them to take it back.”'],
    ['Agent', '', 'The agent hands over to a person', 'Offers and negotiation are on the handover list, so it doesn\'t advise on the number. It shares the counselor team\'s Bookings page.', '“This is worth 30 minutes with a counselor. Pick a time here: Book with Career Services ↗. Can I share your resume review and practice notes with them?” · Jonah: “Yes.”'],
    ['Microsoft Bookings', 'w-ms', 'Jonah books Wednesday, 2:00 pm', 'On the Bookings page, with Rosa Delgado. The agent doesn\'t create the appointment.', null],
    ['Cloud flow', '', 'When an appointment is created', 'The Bookings trigger fires. The flow finds Jonah in Dataverse and checks his sharing consent.', null],
    ['Cloud flow', '', 'Prep pack to the counselor, checklist to Jonah', 'Rosa gets a Teams card: resume rubric, practice notes, the offer question. Jonah gets: bring the offer letter, know your number.', null],
    ['Counselor', 'w-person', 'Rosa runs the meeting and writes the note', 'Any note on the record is hers, and she confirms it before it is saved.', null]
  ];
  const host = $('book-steps');
  const rows = STEPS.map(([who, cls, title, body, quote], i) => {
    const li = el('li', 'step');
    li.appendChild(el('span', 'step-n', String(i + 1)));
    const d = el('div');
    const top = el('div', 'step-top');
    top.appendChild(el('strong', '', title));
    top.appendChild(el('span', 'who ' + cls, who));
    d.appendChild(top);
    d.appendChild(el('p', '', body));
    if (quote) d.appendChild(el('p', 'quote', quote));
    li.appendChild(d);
    host.appendChild(li);
    return li;
  });
  let at = -1;
  let timer = null;
  const status = $('book-status');
  function go(i) {
    at = i;
    rows.forEach((r, k) => { r.classList.toggle('is-done', k < i); r.classList.toggle('is-now', k === i); });
    status.textContent = i >= rows.length - 1 ? 'Six steps. The agent shared a link; the booking, the brief and the record stayed with people and their tools.' : 'Step ' + (i + 1) + ' of ' + rows.length;
    $('book-next').textContent = i >= rows.length - 1 ? 'Start over' : 'Next step';
  }
  $('book-next').addEventListener('click', () => {
    clearInterval(timer);
    go(at >= rows.length - 1 ? 0 : at + 1);
  });
  $('book-play').addEventListener('click', () => {
    clearInterval(timer);
    if (reduceMotion.matches) { go(rows.length - 1); return; }
    go(0);
    timer = setInterval(() => {
      if (at >= rows.length - 1) { clearInterval(timer); return; }
      go(at + 1);
    }, 1300);
  });
})();

/* ================= 06 · how it's built ================= */
(function built() {
  const NODES = [
    { k: 'Copilot Studio agent', s: 'Career Services', core: true, d: 'Instructions set the tone and the handover list. Generative orchestration picks the topic, child agent or tool for each turn. Topics: Resume review, Book a counselor, Event preferences.' },
    { k: 'Microsoft Teams + website', s: 'Channels', d: 'Published to Teams and to the career centre website with Microsoft Entra ID sign-in. File upload works in both; it doesn\'t work in the SharePoint channel.' },
    { k: 'Interview coach', s: 'Child agent', d: 'A child agent with its own instructions for one-question-at-a-time role-play and structured feedback. Text only.' },
    { k: 'Rubric prompt', s: 'Agent flow · Run a prompt', d: 'The office\'s rubric and coaching mode live in the prompt instructions; the prompt returns JSON. Called from an agent flow because document input isn\'t yet supported for prompts added directly as tools.' },
    { k: 'Job board', s: 'Custom connector or MCP', d: 'If the job-board vendor offers an API, a custom connector (OpenAPI) or an MCP server exposes search to the agent. No certified connector for common campus job boards was found in the connector reference.' },
    { k: 'USAJOBS', s: 'Connector', preview: true, d: 'USAJOBS (Independent Publisher) connector with a Search for jobs action, for federal listings. Independent Publisher connectors are community-maintained.' },
    { k: 'Microsoft Bookings', s: 'Connector · triggers', d: 'Triggers on appointment created, updated or cancelled, plus one admin listing action. It can\'t book for a student, so the agent shares the Bookings page link.' },
    { k: 'Microsoft Teams', s: 'Connector', d: '“Post adaptive card in a chat or channel” sends the weekly events digest and the counselor\'s prep pack from cloud flows.' },
    { k: 'Dataverse', s: 'Data', d: 'Saved listings, event interests, practice notes and sharing consent, with row-level security so each student sees only their own rows.' },
    { k: 'Fabric data agent', s: 'Connected agent', preview: true, d: 'Answers staff questions over first-destination data in OneLake. Connected-agent support is in preview and validated only in Microsoft Teams. Uses user authentication.' },
    { k: 'SharePoint', s: 'Knowledge', d: 'Career guides, the rubric explained for students, office hours and the Bookings page link, answered with citations.' }
  ];
  const map = $('stackmap');
  const detail = $('stack-detail');
  const btns = NODES.map((n) => {
    const b = el('button', 'node' + (n.core ? ' is-core' : '') + (n.preview ? ' is-preview' : ''));
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.appendChild(el('strong', '', n.k));
    b.appendChild(el('span', '', n.s));
    b.addEventListener('click', () => show(n, b));
    map.appendChild(b);
    return b;
  });
  function show(n, b) {
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    detail.textContent = '';
    detail.appendChild(el('strong', '', n.k + (n.preview ? ' · preview' : '')));
    detail.appendChild(el('p', '', n.d));
  }
  show(NODES[0], btns[0]);

  const DECIDE = [
    ['Action', 'Agent', 'Person'],
    ['Resume wording', 'Asks, points, offers patterns', 'Student writes every word'],
    ['Job applications', 'Finds and explains fit', 'Student applies on the posting'],
    ['Saving notes or sharing', 'Asks first, every time', 'Student says yes or no'],
    ['Counselor appointment', 'Shares the Bookings link', 'Student books; counselor runs it'],
    ['Notes on the record', 'Drafts if asked', 'Counselor confirms before saving'],
    ['Offers, visas, distress', 'Hands over', 'Counselor or counselling services']
  ];
  const dh = $('decide');
  DECIDE.forEach((r, i) => {
    const row = el('div', 'drow');
    row.appendChild(el(i ? 'strong' : 'span', '', r[0]));
    row.appendChild(el('span', i ? 'ag' : '', r[1]));
    row.appendChild(el('span', i ? 'pp' : '', r[2]));
    dh.appendChild(row);
  });
})();

/* ================= 07 · outcomes ================= */
(function outcomes() {
  const Q = [
    {
      q: 'First-destination outcomes, class of 2026, by school',
      a: 'Knowledge rate 71% (2,018 of 2,842 graduates). Outcomes among graduates with a known destination:',
      chart: 'stacked',
      rows: [['Business', 72, 12, 4, 12], ['Sciences', 51, 31, 5, 13], ['Humanities', 54, 19, 9, 18], ['Education', 81, 9, 3, 7]],
      src: 'Source: grad_outcomes.first_destination (OneLake) · six months after graduation'
    },
    {
      q: 'Did students who used resume review before applying do differently?',
      a: 'Students who used resume review before their first application reported an internship more often. This is a comparison, not proof the review caused it.',
      chart: 'pair',
      rows: [['Used resume review', 58], ['Did not', 41]],
      caveat: 'Students chose whether to use it, so the groups may differ in other ways. A fair test would need a comparison designed for it.',
      src: 'Source: career_engagement + internship_survey · class of 2027 · n = 1,964'
    },
    {
      q: 'Resume feedback before a first application, by student group',
      a: 'This term, by group. Last year the widest gap was 24 points (38% against 14%); this term it is 8.',
      chart: 'pair',
      rows: [['Continuing-gen', 74], ['First-generation', 69], ['Transfer', 66]],
      src: 'Source: career_engagement (Dataverse via Link to Fabric) · fall term to date'
    }
  ];
  const row = $('q-row');
  const ans = $('answer');
  const btns = Q.map((item) => {
    const b = el('button', 'qbtn', item.q);
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => show(item, b));
    row.appendChild(b);
    return b;
  });
  function show(item, b) {
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    ans.textContent = '';
    ans.appendChild(el('p', 'ans-text', item.a));
    if (item.chart === 'stacked') {
      const box = el('div', 'stacked');
      item.rows.forEach(([label, emp, grad, svc, seek]) => {
        const r = el('div', 'srow');
        r.appendChild(el('span', '', label));
        const bar = el('div', 'sbar');
        bar.title = label + ': employed ' + emp + '%, further study ' + grad + '%, service ' + svc + '%, still seeking ' + seek + '%';
        [[emp, 'c-emp'], [grad, 'c-grad'], [svc, 'c-svc'], [seek, 'c-seek']].forEach(([v, c]) => { const i = el('i', c); i.style.width = v + '%'; bar.appendChild(i); });
        r.appendChild(bar);
        r.appendChild(el('b', '', (emp + grad + svc) + '%'));
        box.appendChild(r);
      });
      ans.appendChild(box);
      const leg = el('div', 'legend');
      [['#023347', 'Employed'], ['#087985', 'Further study'], ['#9fd4d8', 'Service'], ['#a67312', 'Still seeking']].forEach(([c, t]) => {
        const s = el('span'); const i = el('i'); i.style.background = c; s.appendChild(i); s.appendChild(document.createTextNode(t)); leg.appendChild(s);
      });
      ans.appendChild(leg);
    } else {
      const box = el('div', 'pairbars');
      item.rows.forEach(([label, v], i) => {
        const r = el('div', 'prow' + (item.rows.length === 2 && i === 1 ? ' is-alt' : ''));
        r.appendChild(el('span', '', label));
        const t = el('div', 'track'); const bar = el('i'); bar.style.width = v + '%'; t.appendChild(bar); r.appendChild(t);
        r.appendChild(el('b', '', v + '%'));
        box.appendChild(r);
      });
      ans.appendChild(box);
    }
    if (item.caveat) ans.appendChild(el('p', 'caveat', item.caveat));
    ans.appendChild(el('p', 'ans-src', item.src + ' · Illustrative figures · not product output'));
  }
  show(Q[0], btns[0]);
})();

/* ================= section nav ================= */
$('section-jump').addEventListener('change', (e) => {
  history.pushState(null, '', '#' + e.target.value);
  $(e.target.value).scrollIntoView();
});
let pending = false;
window.addEventListener('scroll', () => {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    const line = document.querySelector('.section-nav').getBoundingClientRect().height + 60;
    let id = 'reach';
    document.querySelectorAll('main section').forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    $('section-jump').value = id;
  });
}, { passive: true });
