'use strict';

const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Presenter notes: each section explains the Copilot Studio mechanism behind it. */
(function notes() {
  const box = $('#notes-on');
  if (!box) return;
  const apply = () => document.querySelectorAll('.pnote').forEach((p) => { p.hidden = !box.checked; });
  box.addEventListener('change', apply);
  apply();
})();

/* 01 · One advisor against the caseload. */
(function caseload() {
  const host = $('#caseload-dots');
  const TOTAL = 312;
  const frag = document.createDocumentFragment();
  for (let i = 0; i < TOTAL; i++) {
    const dot = document.createElement('i');
    if (i === 0) dot.className = 'is-advisor';
    frag.appendChild(dot);
  }
  host.appendChild(frag);
})();

(function meetingSplit() {
  const today = $('#split-today');
  const prepared = $('#split-prepared');
  const gather = $('#split-gather');
  const advise = $('#split-advise');

  const STATES = {
    today: { gather: 22, advise: 8 },
    prepared: { gather: 3, advise: 27 }
  };

  function show(which) {
    const s = STATES[which];
    gather.style.flexGrow = s.gather;
    advise.style.flexGrow = s.advise;
    gather.querySelector('b').textContent = s.gather;
    advise.querySelector('b').textContent = s.advise;
    today.setAttribute('aria-pressed', String(which === 'today'));
    prepared.setAttribute('aria-pressed', String(which === 'prepared'));
  }

  today.addEventListener('click', () => show('today'));
  prepared.addEventListener('click', () => show('prepared'));
  show('today');
})();

/* 02 · The systems an advisor opens before a meeting, and how the agent reaches each. */
(function sources() {
  const SYSTEMS = [
    ['Student information', 'Credits · holds · term', 'MCP server'],
    ['Degree audit', 'Requirements left', 'MCP server'],
    ['LMS', 'Activity this term', 'Connector'],
    ['Financial aid', 'Award conditions', 'Custom connector'],
    ['Tutoring', 'Sessions attended', 'Dataverse'],
    ['Career', 'Plans and placements', 'Connector'],
    ['Prior notes', 'What was agreed', 'Dataverse'],
    ['Campus life', 'Events and residence', 'SharePoint']
  ];

  const column = $('#source-column');
  const vias = [];
  SYSTEMS.forEach(([name, what, via]) => {
    const chip = document.createElement('div');
    chip.className = 'source-chip';
    /* Shell first, then text, so a system name can never inject markup. */
    chip.innerHTML = '<span></span><small><b class="what"></b><b class="via" hidden></b></small>';
    chip.querySelector('span').textContent = name;
    const what_ = chip.querySelector('.what');
    what_.textContent = what;
    what_.style.fontWeight = '500';
    const v = chip.querySelector('.via');
    v.textContent = '· ' + via;
    vias.push(v);
    column.appendChild(chip);
  });

  const wires = $('#source-wires');
  const H = 360;
  const step = H / SYSTEMS.length;
  const paths = SYSTEMS.map((_, i) => {
    const y = step * i + step / 2;
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.dataset.y = String(y);
    wires.appendChild(p);
    return p;
  });

  const card = $('#out-card');
  const kicker = $('#out-kicker');
  const title = $('#out-title');
  const sub = $('#out-sub');
  const todayBtn = $('#src-today');
  const wsBtn = $('#src-workspace');

  function draw(joined) {
    paths.forEach((p) => {
      const y = Number(p.dataset.y);
      /* Today each system ends on its own. Joined, they all meet the brief. */
      const endY = joined ? H / 2 : y;
      p.setAttribute('d', `M0 ${y} C 48 ${y}, 72 ${endY}, 120 ${endY}`);
      p.classList.toggle('is-joined', joined);
    });
  }

  function show(joined) {
    draw(joined);
    card.classList.toggle('is-joined', joined);
    vias.forEach((v) => { v.hidden = !joined; });
    kicker.textContent = joined ? 'One brief, in Teams' : 'Eight open tabs';
    title.textContent = joined ? 'Compiled by the agent before the meeting' : 'The advisor assembles it';
    sub.textContent = joined ? 'Early each morning, for every booking on the calendar' : 'Every meeting, from scratch';
    todayBtn.setAttribute('aria-pressed', String(!joined));
    wsBtn.setAttribute('aria-pressed', String(joined));
  }

  todayBtn.addEventListener('click', () => show(false));
  wsBtn.addEventListener('click', () => show(true));
  show(false);
})();

/* 03 · The brief, sorted by what needs saying. */
(function brief() {
  const LANES = {
    raise: [
      ['Dropping ECO-415 would cost more than it looks', 'Degree audit'],
      ['Spring is planned at 9 credits, below full time', 'Registration'],
      ['The major is one elective short, and STA-470 only runs in spring', 'Degree audit'],
      ['Two lab reports show no grade, and one field visit is still open', 'LMS']
    ],
    know: [
      ['Three deadlines land the week of 16 November', 'Academic calendar'],
      ['Dr. Abara raised attendance in ECO-415', 'Early alert'],
      ['You still owe Maya the spring electives list', 'Prior notes']
    ],
    track: [
      ['The minor finishes this fall if ECO-415 is passed', 'Degree audit'],
      ['Tutoring has started, four sessions so far', 'Tutoring'],
      ['Internship application submitted', 'Career']
    ]
  };

  Object.keys(LANES).forEach((key) => {
    const panel = document.getElementById('panel-' + key);
    LANES[key].forEach(([text, src]) => {
      const row = document.createElement('div');
      row.className = 'lane-item lane-' + key;
      row.innerHTML = '<span class="lane-dot"></span><p></p><span class="lane-src"></span>';
      row.querySelector('p').textContent = text;
      row.querySelector('.lane-src').textContent = src;
      panel.appendChild(row);
    });
  });

  const tabs = Array.from(document.querySelectorAll('.lane-tabs [role="tab"]'));

  function select(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab, false));
    tab.addEventListener('keydown', (e) => {
      const last = tabs.length - 1;
      let next = null;
      if (e.key === 'ArrowRight') next = tabs[i === last ? 0 : i + 1];
      else if (e.key === 'ArrowLeft') next = tabs[i === 0 ? last : i - 1];
      else if (e.key === 'Home') next = tabs[0];
      else if (e.key === 'End') next = tabs[last];
      if (next) { e.preventDefault(); select(next, true); }
    });
  });
})();

/* 04 · One question, answered across four systems by several tool calls. */
(function whatIf() {
  const TOOLS = [
    'sis-mcp · get_registration',
    'sis-mcp · run_degree_audit',
    'Financial aid · Get award terms',
    'Knowledge · Academic calendar'
  ];

  const CHECKS = [
    ['Full-time status', 'Falls to 9 credits for spring', 'Registration', true],
    ['Institutional aid', 'Award requires 12 credits a term', 'Financial aid', true],
    ['Major and graduation', 'ECO-415 runs in fall only, so May becomes December', 'Degree audit', true],
    ['Withdrawal deadline', 'Last day with a W is 20 November, no refund after', 'Academic calendar', true],
    ['Visa and athletics eligibility', 'Not on a visa or a team roster, so no change', 'Registration', false]
  ];

  const list = $('#whatif-results');
  const trace = $('#tool-trace');
  const btn = $('#run-check');
  const status = $('#check-status');
  const DONE = '4 of 5 checks need raising with Maya. Nothing was changed in registration.';
  let timers = [];

  function render() {
    list.textContent = '';
    trace.textContent = '';
    const tools = TOOLS.map((t) => {
      const li = document.createElement('li');
      li.textContent = t;
      li.hidden = true;
      trace.appendChild(li);
      return li;
    });
    const rows = CHECKS.map(([label, detail, src, flag]) => {
      const li = document.createElement('li');
      if (flag) li.className = 'is-flag';
      li.innerHTML = '<div><strong></strong><em></em></div><span class="lane-src"></span>';
      li.querySelector('strong').textContent = label;
      li.querySelector('em').textContent = detail;
      li.querySelector('.lane-src').textContent = src;
      list.appendChild(li);
      return li;
    });
    return { tools, rows };
  }

  function finish() {
    status.textContent = DONE;
    btn.disabled = false;
    btn.textContent = 'Run it again';
  }

  btn.addEventListener('click', () => {
    timers.forEach(clearTimeout);
    timers = [];
    btn.disabled = true;
    status.textContent = 'Planning: four tools, called in one turn…';
    const { tools, rows } = render();

    if (reduceMotion.matches) {
      tools.forEach((t) => { t.hidden = false; });
      rows.forEach((r) => r.classList.add('is-in'));
      finish();
      return;
    }

    tools.forEach((t, i) => {
      timers.push(setTimeout(() => { t.hidden = false; }, 160 * (i + 1)));
    });
    const base = 160 * (tools.length + 1);
    rows.forEach((row, i) => {
      timers.push(setTimeout(() => {
        row.classList.add('is-in');
        if (i === rows.length - 1) finish();
      }, base + 170 * (i + 1)));
    });
  });
})();

/* 05 · What was promised, kept. The advisor approves before anything leaves. */
(function loop() {
  const STEPS = [
    ['Rough note', 'Typed into the Teams chat, or the meeting transcript', 'Advisor'],
    ['Organized note', 'Summary, decisions, actions. The advisor edits it', 'Agent drafts'],
    ['Email to Maya', 'What you agreed, sent after the advisor confirms', 'Agent flow'],
    ['Follow-up booked', 'Before spring registration, promise logged with a date', 'Agent flow']
  ];

  const host = $('#loop');
  STEPS.forEach(([title, sub, who], i) => {
    const li = document.createElement('li');
    li.innerHTML = '<span class="step"></span><strong></strong><span class="sub"></span><span class="who"></span>';
    li.querySelector('.step').textContent = '0' + (i + 1);
    li.querySelector('strong').textContent = title;
    li.querySelector('.sub').textContent = sub;
    const w = li.querySelector('.who');
    w.textContent = who;
    if (who === 'Advisor') w.classList.add('is-advisor');
    host.appendChild(li);
  });
})();

/* 06 · The same record, counted. */
(function leadership() {
  function bars(hostId, rows) {
    const host = document.getElementById(hostId);
    const max = Math.max.apply(null, rows.map((r) => r[1]));
    rows.forEach(([label, value]) => {
      const row = document.createElement('div');
      row.innerHTML = '<span></span><i></i><b></b>';
      row.querySelector('span').textContent = label;
      row.querySelector('i').style.width = Math.round((value / max) * 100) + '%';
      row.querySelector('b').textContent = value;
      host.appendChild(row);
    });
  }

  bars('bars-school', [
    ['Business', 214],
    ['Sciences', 186],
    ['Humanities', 131],
    ['Education', 97]
  ]);

  bars('bars-holds', [
    ['Advising', 148],
    ['Financial', 92],
    ['Immunization', 41],
    ['Conduct', 12]
  ]);

  const WEEKS = [
    ['W1', 48], ['W2', 72], ['W3', 96], ['W4', 134],
    ['W5', 188], ['W6', 241], ['W7', 203], ['W8', 97]
  ];
  const weekHost = document.getElementById('bars-week');
  const weekMax = Math.max.apply(null, WEEKS.map((w) => w[1]));
  WEEKS.forEach(([label, value]) => {
    const col = document.createElement('div');
    col.innerHTML = '<i></i><span></span>';
    col.querySelector('i').style.height = Math.round((value / weekMax) * 100) + '%';
    col.querySelector('span').textContent = label;
    col.title = label + ' · ' + value + ' meetings';
    weekHost.appendChild(col);
  });

  const READY = [
    ['Cleared to register', 441],
    ['Hold to resolve', 188],
    ['Not yet advised', 93]
  ];
  const readyHost = document.getElementById('readiness');
  const readyTotal = READY.reduce((sum, r) => sum + r[1], 0);
  READY.forEach(([label, value]) => {
    const pct = Math.round((value / readyTotal) * 100);
    const block = document.createElement('div');
    block.innerHTML = '<div class="row"><span></span><b></b></div><div class="track"><i></i></div>';
    block.querySelector('span').textContent = label;
    block.querySelector('b').textContent = value + ' · ' + pct + '%';
    block.querySelector('.track i').style.width = pct + '%';
    readyHost.appendChild(block);
  });
})();
