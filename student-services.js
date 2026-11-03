'use strict';

const $ = (sel) => document.querySelector(sel);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const SVG = 'http://www.w3.org/2000/svg';

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function svg(tag, attrs, parent) {
  const n = document.createElementNS(SVG, tag);
  Object.keys(attrs || {}).forEach((k) => n.setAttribute(k, attrs[k]));
  if (parent) parent.appendChild(n);
  return n;
}
function press(buttons, on) {
  buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === on)));
}

/* Chat bubbles: text is always set with textContent so content never becomes markup. */
function bubble(host, m) {
  const b = el('div', 'msg ' + m.who);
  if (m.who !== 'system') b.appendChild(el('span', 'who', m.name));
  b.appendChild(document.createTextNode(m.text));
  if (m.list) {
    const ul = el('ul');
    m.list.forEach((t) => ul.appendChild(el('li', null, t)));
    b.appendChild(ul);
  }
  if (m.card) {
    const c = el('div', 'card');
    m.card.forEach(([k, v]) => {
      const row = el('div');
      row.appendChild(el('b', null, k + ' '));
      row.appendChild(document.createTextNode(v));
      c.appendChild(row);
    });
    b.appendChild(c);
  }
  if (m.cta) b.appendChild(el('span', 'cta', m.cta));
  if (m.cite) b.appendChild(el('span', 'cite', m.cite));
  host.appendChild(b);
  return b;
}

/* Presenter notes. */
(function notes() {
  const box = $('#notes-on');
  const apply = () => document.querySelectorAll('.pnote').forEach((p) => { p.hidden = !box.checked; });
  box.addEventListener('change', apply);
  apply();
})();

/* Sticky section jump. */
(function sectionJump() {
  const select = $('#section-jump');
  select.addEventListener('change', () => {
    const target = document.getElementById(select.value);
    history.replaceState(null, '', '#' + select.value);
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });
  let pending = false;
  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const line = $('.section-nav').getBoundingClientRect().height + 80;
      let id = 'runaround';
      document.querySelectorAll('main section').forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
      select.value = id;
    });
  }, { passive: true });
})();

/* 01 · The runaround. */
(function runaround() {
  const NODES = {
    student: [62, 150],
    reg: [200, 52],
    bur: [430, 52],
    aid: [430, 248],
    it: [200, 248],
    door: [262, 150]
  };
  const LABELS = { reg: 'Registrar', bur: 'Bursar', aid: 'Financial aid', it: 'IT help desk', door: 'Campus Copilot' };

  const TODAY = {
    path: ['reg', 'bur', 'aid', 'it', 'bur'],
    log: [
      ['Mon', 'Registrar', 'Portal says “hold”. Registrar: not our hold, ask the bursar.'],
      ['Tue', 'Bursar', 'Unpaid balance of $412. Your aid should cover it, ask financial aid.'],
      ['Thu', 'Financial aid', 'Aid is waiting on a verification form you haven’t sent.'],
      ['Fri', 'IT help desk', 'Upload page rejects the file. Password reset, try again Monday.'],
      ['Wed', 'Bursar', 'Aid posted. Hold released on request. Registration opens.']
    ],
    totals: ['4', '5', '9'],
    door: false
  };
  const DOOR = {
    path: ['reg', 'bur', 'aid'],
    log: [
      ['2:04', 'Campus Copilot', 'Jonah asks once, in Teams, signed in.'],
      ['2:04', 'Registrar agent', 'The hold is a bursar hold, placed 3 November.'],
      ['2:04', 'Bursar agent', 'Balance $412. Spring aid would cover it once it posts.'],
      ['2:05', 'Financial aid agent', 'Aid waits on one verification form. Here is the upload link.'],
      ['Next day', 'Bursar staff', 'Case on the queue: release the hold when aid posts. A person does it.']
    ],
    totals: ['1', '0', '<1'],
    door: true
  };

  const map = $('#run-map');
  const log = $('#run-log');
  const totals = $('#run-totals');
  const todayBtn = $('#run-today');
  const doorBtn = $('#run-door');
  const play = $('#run-play');
  let mode = TODAY;
  let timers = [];

  const hopLayer = svg('g', {}, map);
  const nodeEls = {};
  Object.keys(LABELS).forEach((key) => {
    const [x, y] = NODES[key];
    const g = svg('g', { class: 'node' + (key === 'door' ? ' is-door' : '') }, map);
    const w = key === 'door' ? 128 : 116;
    svg('rect', { x: x - w / 2, y: y - 19, width: w, height: 38, rx: 10 }, g);
    const t = svg('text', { x, y: y + 4.5 }, g);
    t.textContent = LABELS[key];
    nodeEls[key] = g;
  });
  const student = svg('g', { class: 'student' }, map);
  svg('circle', { cx: 0, cy: 0, r: 17 }, student);
  const st = svg('text', { x: 0, y: 4 }, student);
  st.textContent = 'JW';

  function moveStudent(key) {
    const [x, y] = NODES[key];
    const dx = key === 'student' ? 0 : -6;
    const dy = key === 'student' ? 0 : -26;
    student.setAttribute('transform', `translate(${x + dx} ${y + dy})`);
  }

  function curve(a, b, bend) {
    const [x1, y1] = NODES[a];
    const [x2, y2] = NODES[b];
    const mx = (x1 + x2) / 2 + bend;
    const my = (y1 + y2) / 2 - bend;
    return `M${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
  }

  function drawStep(i) {
    if (mode.door) {
      if (i === 0) svg('path', { class: 'hop is-door', d: curve('student', 'door', 0) }, hopLayer);
      else if (i <= mode.path.length) {
        const key = mode.path[i - 1];
        svg('path', { class: 'hop is-door', d: curve('door', key, 0) }, hopLayer);
        nodeEls[key].classList.add('is-ok');
      } else nodeEls.bur.classList.add('is-ok');
      moveStudent('student');
      return;
    }
    const key = mode.path[i];
    const from = i === 0 ? 'student' : mode.path[i - 1];
    svg('path', { class: 'hop', d: curve(from, key, i % 2 ? 26 : -18) }, hopLayer);
    const [x1, y1] = NODES[from];
    const [x2, y2] = NODES[key];
    const num = svg('text', { class: 'hop-num', x: (x1 + x2) / 2 + 6, y: (y1 + y2) / 2 - 6 }, hopLayer);
    num.textContent = String(i + 1);
    nodeEls[key].classList.add('is-hit');
    moveStudent(key);
  }

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    hopLayer.textContent = '';
    Object.values(nodeEls).forEach((g) => g.classList.remove('is-hit', 'is-ok'));
    nodeEls.door.style.display = mode.door ? '' : 'none';
    moveStudent('student');
    log.textContent = '';
    log.classList.toggle('is-door', mode.door);
    totals.classList.toggle('is-door', mode.door);
    ['#tot-offices', '#tot-retold', '#tot-days'].forEach((s, i) => { $(s).textContent = mode.totals[i]; });
    return mode.log.map(([when, who, what]) => {
      const li = el('li');
      li.appendChild(el('b', null, when));
      const d = el('div');
      d.appendChild(el('strong', null, who));
      d.appendChild(el('em', null, what));
      li.appendChild(d);
      log.appendChild(li);
      return li;
    });
  }

  function showAll() {
    const items = reset();
    items.forEach((li, i) => { li.classList.add('is-in'); drawStep(i); });
  }

  function setMode(next) {
    mode = next;
    press([todayBtn, doorBtn], next === TODAY ? todayBtn : doorBtn);
    play.textContent = next === TODAY ? "Play the student's week" : 'Play the conversation';
    play.disabled = false;
    showAll();
  }

  play.addEventListener('click', () => {
    const items = reset();
    if (reduceMotion.matches) { items.forEach((li, i) => { li.classList.add('is-in'); drawStep(i); }); return; }
    play.disabled = true;
    items.forEach((li, i) => {
      timers.push(setTimeout(() => {
        li.classList.add('is-in');
        drawStep(i);
        if (i === items.length - 1) play.disabled = false;
      }, 650 * i + 250));
    });
  });
  todayBtn.addEventListener('click', () => setMode(TODAY));
  doorBtn.addEventListener('click', () => setMode(DOOR));
  setMode(TODAY);
})();

/* 02 · One front door, seven specialists. */
(function frontDoor() {
  const OFFICES = [
    { id: 'reg', name: 'Registrar', kind: 'Connected agent', owns: 'Registration, holds, transcripts, enrollment verification', knowledge: 'Academic calendar, registration policies (SharePoint)', tools: 'SIS MCP server · read holds and registration', person: 'Changes to enrollment go to registrar staff' },
    { id: 'bur', name: 'Bursar', kind: 'Connected agent', owns: 'Bills, payment plans, refunds, financial holds', knowledge: 'Payment deadlines and fee pages (website)', tools: 'Student accounts custom connector · read balance', person: 'Releasing holds and adjusting charges stay with staff' },
    { id: 'aid', name: 'Financial aid', kind: 'Connected agent', owns: 'Awards, verification, disbursement status', knowledge: 'Aid policies and forms (SharePoint)', tools: 'Aid system custom connector · read status', person: 'Award decisions are made by aid officers' },
    { id: 'hou', name: 'Housing', kind: 'Child agent', owns: 'Room assignments, break housing, key cards, maintenance', knowledge: 'Residence handbook, break dates (SharePoint)', tools: 'Housing portal custom connector · read assignment', person: 'Room changes are approved by housing staff' },
    { id: 'it', name: 'IT help desk', kind: 'Connected agent', owns: 'Accounts, passwords, Wi-Fi, software', knowledge: 'IT knowledge articles (website)', tools: 'ServiceNow connector · Get Records, Create Record', person: 'Technicians work the ticket queue' },
    { id: 'well', name: 'Wellbeing', kind: 'Child agent', owns: 'Counseling access, support services, crisis lines', knowledge: 'Counseling center pages only. No student records.', tools: 'None. It points to people and services.', person: 'Clinicians, never the agent, give care' },
    { id: 'intl', name: 'International office', kind: 'Child agent', owns: 'Visas, enrollment rules for visa holders, travel letters', knowledge: 'International student guides (SharePoint)', tools: 'SIS MCP server · read credit load', person: 'Status decisions belong to the designated school official' }
  ];

  const QUESTIONS = [
    { q: 'Why can’t I register for spring?', route: ['reg', 'bur', 'aid'],
      trace: ['Registrar agent · sis-mcp · get_holds', 'Bursar agent · Student accounts · Get balance', 'Financial aid agent · Aid system · Get verification status'],
      answer: 'You have one bursar hold for a $412 balance. Your spring aid covers it, but it is waiting on one verification form. Upload it here, and I can open a case so the bursar releases the hold once the aid posts.' },
    { q: 'Can I stay in my room over winter break?', route: ['hou'],
      trace: ['Housing agent · Knowledge · Residence handbook', 'Housing agent · Housing portal · Get assignment'],
      answer: 'Your hall stays open over break. Request break housing by 1 December in the housing portal. There is no extra charge for your hall.' },
    { q: 'My laptop won’t connect to campus Wi-Fi', route: ['it'],
      trace: ['IT agent · Knowledge · Wi-Fi setup', 'IT agent · ServiceNow · Get Records (open incidents)'],
      answer: 'Here are the three steps for the student network. There is no outage reported right now. If they don’t work, I can open an IT ticket with your device details.' },
    { q: 'If I drop a course, is my visa OK?', route: ['intl', 'reg'],
      trace: ['International office agent · Knowledge · Enrollment for visa holders', 'Registrar agent · sis-mcp · get_registration'],
      answer: 'You are at 12 credits, and dropping one course takes you below full time. Only the designated school official can approve that. I can connect you with the international office now.' },
    { q: 'When is spring tuition due?', route: ['bur'],
      trace: ['Bursar agent · Knowledge · Payment deadlines'],
      answer: 'Spring tuition is due 8 January. Payment plans are available until 15 January.' },
    { q: 'I’m not coping and don’t know who to talk to', route: ['well'],
      trace: ['Wellbeing agent · Topic · Support and crisis resources'],
      answer: 'Thank you for saying so. You can talk to a counselor today. Drop-in hours and the booking link are below, and the 24-hour support line is always open.',
      safety: 'If someone is in immediate danger, the topic shows emergency numbers first. The agent does not counsel, diagnose or keep the conversation to itself.' }
  ];

  const map = $('#door-map');
  const officeHost = $('#door-offices');
  const qHost = $('#route-questions');
  const detail = $('#door-detail');

  /* Wiring diagram */
  const HUB = [232, 180];
  const wiresIn = [];
  [['Teams', 110], ['Website', 250]].forEach(([label, y]) => {
    const p = svg('path', { class: 'wire is-on', d: `M118 ${y} C 160 ${y}, 160 ${HUB[1]}, ${HUB[0] - 62} ${HUB[1]}` }, map);
    wiresIn.push(p);
    const g = svg('g', { class: 'chan' }, map);
    svg('rect', { x: 14, y: y - 18, width: 104, height: 36, rx: 9 }, g);
    svg('text', { x: 66, y: y + 4 }, g).textContent = label;
  });
  const wires = {};
  const specs = {};
  OFFICES.forEach((o, i) => {
    const y = 28 + i * 50.5;
    wires[o.id] = svg('path', { class: 'wire', d: `M${HUB[0] + 62} ${HUB[1]} C 330 ${HUB[1]}, 320 ${y}, 368 ${y}` }, map);
    const g = svg('g', { class: 'spec' }, map);
    svg('rect', { x: 368, y: y - 19, width: 186, height: 38, rx: 9 }, g);
    svg('text', { x: 461, y: y - 1 }, g).textContent = o.name;
    svg('text', { class: 'kind', x: 461, y: y + 12 }, g).textContent = o.kind.toUpperCase();
    specs[o.id] = g;
  });
  const hub = svg('g', { class: 'hub' }, map);
  svg('rect', { x: HUB[0] - 62, y: HUB[1] - 34, width: 124, height: 68, rx: 14 }, hub);
  svg('text', { x: HUB[0], y: HUB[1] - 3 }, hub).textContent = 'Campus Copilot';
  svg('text', { class: 'sub', x: HUB[0], y: HUB[1] + 14 }, hub).textContent = 'main agent';

  function light(ids) {
    OFFICES.forEach((o) => {
      const on = ids.includes(o.id);
      wires[o.id].classList.toggle('is-on', on);
      specs[o.id].classList.toggle('is-on', on);
    });
    officeButtons.forEach((b) => b.classList.toggle('is-routed', ids.includes(b.dataset.id)));
  }

  function showQuestion(q) {
    light(q.route);
    detail.textContent = '';
    const head = el('div', 'head');
    head.appendChild(el('span', 'eyebrow', 'Routed to ' + q.route.length + (q.route.length === 1 ? ' specialist' : ' specialists')));
    head.appendChild(el('strong', null, q.q));
    detail.appendChild(head);
    const tr = el('ul', 'trace');
    q.trace.forEach((t) => tr.appendChild(el('li', null, t)));
    detail.appendChild(tr);
    detail.appendChild(el('p', 'answer', q.answer));
    if (q.safety) detail.appendChild(el('p', 'safety', q.safety));
  }

  function showOffice(o) {
    light([o.id]);
    detail.textContent = '';
    const head = el('div', 'head');
    head.appendChild(el('strong', null, o.name));
    head.appendChild(el('span', 'lane-src', o.kind));
    detail.appendChild(head);
    detail.appendChild(el('p', null, o.owns));
    const dl = el('dl');
    [['Knowledge', o.knowledge], ['Tools', o.tools], ['A person decides', o.person]].forEach(([k, v]) => {
      const d = el('div');
      d.appendChild(el('dt', null, k));
      d.appendChild(el('dd', null, v));
      dl.appendChild(d);
    });
    detail.appendChild(dl);
  }

  const qButtons = QUESTIONS.map((q) => {
    const b = el('button', null, q.q);
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.addEventListener('click', () => { press(all(), b); showQuestion(q); });
    qHost.appendChild(b);
    return b;
  });
  const officeButtons = OFFICES.map((o) => {
    const b = el('button');
    b.type = 'button';
    b.dataset.id = o.id;
    b.setAttribute('aria-pressed', 'false');
    b.appendChild(document.createTextNode(o.name));
    b.appendChild(el('small', null, o.kind));
    b.addEventListener('click', () => { press(all(), b); showOffice(o); });
    officeHost.appendChild(b);
    return b;
  });
  const all = () => qButtons.concat(officeButtons);

  press(all(), qButtons[0]);
  showQuestion(QUESTIONS[0]);
})();

/* 03 · Public answers without sign-in, personal answers after it. */
(function auth() {
  const ASK = { who: 'student', name: 'Student', text: 'Do I have any holds, and when is spring tuition due?' };
  const STATES = {
    pub: {
      msgs: [
        ASK,
        { who: 'agent', name: 'Campus Copilot', text: 'Spring tuition is due 8 January, and payment plans are open until 15 January. Holds are tied to your own account, so I can only check them after you sign in.', cta: 'Sign in with your university account', cite: 'Source · Bursar: Payment deadlines (public website)' }
      ],
      scope: [
        ['yes', 'Public website pages: deadlines, fees, office hours'],
        ['yes', 'Published policies and how-to guides'],
        ['no', 'Any student’s holds, balance or aid'],
        ['no', 'Changing anything']
      ]
    },
    signed: {
      msgs: [
        { who: 'student', name: 'Jonah', text: ASK.text },
        { who: 'system', text: 'Signed in as Jonah Whitcombe · Microsoft Entra ID' },
        { who: 'agent', name: 'Campus Copilot', text: 'You have one hold, and here is your spring bill.',
          card: [['Hold:', 'Bursar · $412 balance · blocks registration'], ['Spring bill:', '$6,840 due 8 January'], ['Aid pending:', '$3,200 · waiting on a verification form']],
          cite: 'Sources · Bursar agent (student accounts) · Financial aid agent (aid system)' },
        { who: 'agent', name: 'Campus Copilot', text: 'Want the link to upload the verification form? Once aid posts, the bursar can release the hold.' }
      ],
      scope: [
        ['yes', 'Everything public'],
        ['yes', 'Jonah’s own holds, balance and aid status'],
        ['no', 'Any other student’s record'],
        ['no', 'Releasing the hold. Bursar staff do that.']
      ]
    }
  };
  const chat = $('#auth-chat');
  const scope = $('#auth-scope');
  const pubBtn = $('#auth-public');
  const signBtn = $('#auth-signed');
  let timers = [];

  function show(key) {
    timers.forEach(clearTimeout);
    timers = [];
    const s = STATES[key];
    press([pubBtn, signBtn], key === 'pub' ? pubBtn : signBtn);
    chat.textContent = '';
    scope.textContent = '';
    s.scope.forEach(([kind, text]) => {
      const li = el('li', kind);
      li.appendChild(el('i', null, kind === 'yes' ? '✓' : '×'));
      li.appendChild(el('span', null, text));
      scope.appendChild(li);
    });
    s.msgs.forEach((m, i) => {
      if (reduceMotion.matches || i === 0) bubble(chat, m);
      else timers.push(setTimeout(() => bubble(chat, m), 450 * i));
    });
  }
  pubBtn.addEventListener('click', () => show('pub'));
  signBtn.addEventListener('click', () => show('signed'));
  show('pub');
})();

/* 04 · After hours. */
(function afterHours() {
  const VOLUME = [22, 14, 8, 4, 3, 4, 9, 21, 46, 70, 82, 88, 76, 84, 90, 86, 74, 61, 55, 62, 71, 68, 52, 36];
  const OPEN = (h) => h >= 9 && h < 17;
  const host = $('#hours-bars');
  const max = Math.max.apply(null, VOLUME);
  const bars = VOLUME.map((v, h) => {
    const i = el('i');
    i.style.height = Math.round((v / max) * 100) + '%';
    if (OPEN(h)) i.classList.add('is-open');
    i.title = h + ':00 · ' + v + ' questions';
    host.appendChild(i);
    return i;
  });
  host.setAttribute('role', 'img');
  host.setAttribute('aria-label', 'About 38 percent of questions arrive outside 9 am to 5 pm office hours, peaking again between 7 and 10 pm.');

  const ASK = { who: 'student', name: 'Student', text: 'My key card stopped working and I’m locked out of my hall.' };
  const CASES = {
    14: {
      bar: 14,
      msgs: [ASK,
        { who: 'agent', name: 'Campus Copilot · Housing', text: 'The housing desk is open until 5 pm. I can connect you now, and I’ll pass on your hall and what happened.' },
        { who: 'system', text: 'Transferred to Housing desk · live' }],
      path: [['Knowledge', 'Key card steps from the residence handbook'], ['Office-hours check', 'Housing desk open'], ['Live transfer', 'A person picks up with the summary', true]]
    },
    23: {
      bar: 23,
      msgs: [ASK,
        { who: 'agent', name: 'Campus Copilot · Housing', text: 'The housing desk is closed. The residence life duty phone answers all night and can let you in.', card: [['Duty phone:', 'listed in the residence handbook'], ['Campus safety:', 'also 24 hours']], cite: 'Source · Residence handbook (SharePoint)' },
        { who: 'agent', name: 'Campus Copilot · Housing', text: 'I can also open a case so the housing office replaces your card in the morning. Submit it?' },
        { who: 'student', name: 'Student', text: 'Yes, submit.' },
        { who: 'system', text: 'Case created · housing queue · reply by 10 am' }],
      path: [['Knowledge', 'After-hours numbers, right away'], ['Office-hours check', 'Housing desk closed'], ['Agent flow', 'Case created after the student confirms'], ['Morning', 'Staff replace the card', true]]
    },
    sat: {
      bar: 10,
      msgs: [ASK,
        { who: 'agent', name: 'Campus Copilot · Housing', text: 'The housing office is closed this weekend. The residence life duty phone can let you in now.', cite: 'Source · Residence handbook (SharePoint)' },
        { who: 'agent', name: 'Campus Copilot · Housing', text: 'Want me to open a case for a replacement card? Staff pick it up first thing Monday.' },
        { who: 'student', name: 'Student', text: 'Please.' },
        { who: 'system', text: 'Case created · housing queue · Monday morning' }],
      path: [['Knowledge', 'Weekend numbers, right away'], ['Office-hours check', 'Closed until Monday'], ['Agent flow', 'Case created after the student confirms'], ['Monday', 'Staff replace the card', true]]
    }
  };

  const out = $('#hours-outcome');
  const buttons = Array.from(document.querySelectorAll('.hours-buttons button'));
  let timers = [];

  function show(key, btn) {
    timers.forEach(clearTimeout);
    timers = [];
    press(buttons, btn);
    const c = CASES[key];
    bars.forEach((b, h) => b.classList.toggle('is-now', h === c.bar));
    out.textContent = '';
    const chat = el('div', 'chat');
    chat.setAttribute('aria-label', 'Conversation');
    const path = el('ol', 'path');
    path.setAttribute('aria-label', 'What the agent did');
    c.path.forEach(([k, v, human]) => {
      const li = el('li', human ? 'is-human' : null);
      li.appendChild(el('b', null, k));
      li.appendChild(el('span', null, v));
      path.appendChild(li);
    });
    out.appendChild(chat);
    out.appendChild(path);
    c.msgs.forEach((m, i) => {
      if (reduceMotion.matches || i === 0) bubble(chat, m);
      else timers.push(setTimeout(() => bubble(chat, m), 420 * i));
    });
  }
  buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.hour, b)));
  show('14', buttons[0]);
})();

/* 05 · Handoff with the whole story. */
(function handoff() {
  const ELIF = 'Elif';
  const SHARED = [
    { who: 'student', name: ELIF, text: 'I’m failing CHEM-210 and want to drop it. Will that affect my visa?' },
    { who: 'agent', name: 'Campus Copilot · International', text: 'You are at 12 credits, so dropping CHEM-210 would put you below full time. For visa holders, only the designated school official can approve a reduced course load. Please don’t drop it before you talk to them.', cite: 'Source · International student guide (SharePoint) · Registrar agent' }
  ];
  const MODES = {
    live: {
      label: 'International office · staff view',
      tag: 'Live chat · Dynamics 365',
      title: 'Transfer from Campus Copilot',
      student: SHARED.concat([
        { who: 'agent', name: 'Campus Copilot', text: 'The international office is open. Here’s what I’ll share so you don’t have to repeat it. OK to connect?' },
        { who: 'student', name: ELIF, text: 'Yes, connect me.' },
        { who: 'system', hand: true, text: 'Transferred · International office queue' },
        { who: 'staff', name: 'Rosalind · International office', text: 'Hi Elif, I can see the whole conversation. Let’s look at whether a reduced course load for academic difficulty fits. Do you have ten minutes now?' }
      ]),
      fields: [
        ['Student', 'Elif Marangoni · signed in (Entra ID)'],
        ['Asking', 'Drop CHEM-210 without risking visa status'],
        ['Already told', 'Below full time needs DSO approval. Don’t drop yet.'],
        ['Record', '12 credits · last day to drop with a W: 20 Nov'],
        ['Tone', 'Worried, wants to talk today']
      ],
      staff: [{ who: 'staff', name: 'Rosalind · picks up after 2 min', text: 'Reads the summary above, so her first message is about the student, not about the question.' }],
      status: 'Live transfer: the summary and full history arrived with the chat. Only staff can approve a reduced course load.'
    },
    case: {
      label: 'International office · next morning',
      tag: 'Case · ServiceNow',
      title: 'Case INT-20418',
      student: [
        { who: 'system', text: 'Tuesday · 11:48 pm' },
        SHARED[0],
        SHARED[1],
        { who: 'agent', name: 'Campus Copilot', text: 'The international office opens at 9 am. I can open a case with this summary so an advisor contacts you first thing. Submit it?' },
        { who: 'student', name: ELIF, text: 'Yes, submit.' },
        { who: 'system', hand: true, text: 'Case INT-20418 created · reply by 12 pm tomorrow' }
      ],
      fields: [
        ['Student', 'Elif Marangoni · signed in (Entra ID)'],
        ['Asking', 'Drop CHEM-210 without risking visa status'],
        ['Already told', 'Below full time needs DSO approval. Don’t drop yet.'],
        ['Record', '12 credits · last day to drop with a W: 20 Nov'],
        ['Transcript', 'Full conversation attached']
      ],
      staff: [{ who: 'staff', name: 'Rosalind · 9:12 am', text: 'Good morning Elif. I read last night’s conversation. I’ve booked you at 11 am to go through the reduced course load request together.' }],
      status: 'After hours: an agent flow created the case after Elif confirmed. Staff replied in the morning with the full story.'
    }
  };

  const chat = $('#ho-chat');
  const staff = $('#ho-staff');
  const card = $('#ho-card');
  const fields = $('#ho-card-fields');
  const wait = $('#ho-wait');
  const status = $('#ho-status');
  const play = $('#ho-play');
  const liveBtn = $('#ho-live');
  const caseBtn = $('#ho-case');
  let mode = 'live';
  let timers = [];

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    const m = MODES[mode];
    press([liveBtn, caseBtn], mode === 'live' ? liveBtn : caseBtn);
    $('#ho-staff-label').textContent = m.label;
    $('#ho-card-tag').textContent = m.tag;
    $('#ho-card-title').textContent = m.title;
    chat.textContent = '';
    staff.textContent = '';
    fields.textContent = '';
    m.fields.forEach(([k, v]) => {
      const d = el('div');
      d.appendChild(el('dt', null, k));
      d.appendChild(el('dd', null, v));
      fields.appendChild(d);
    });
    card.hidden = true;
    wait.hidden = false;
    status.textContent = '';
    play.disabled = false;
    play.textContent = 'Play the conversation';
  }

  function showCard() {
    card.hidden = false;
    wait.hidden = true;
  }

  function run() {
    reset();
    const m = MODES[mode];
    const handIdx = m.student.findIndex((x) => x.hand);
    const steps = [];
    m.student.forEach((msg, i) => {
      if (mode === 'live' && msg.who === 'staff') {
        steps.push(() => m.staff.forEach((s) => bubble(staff, s)));
      }
      steps.push(() => bubble(chat, msg));
      if (i === handIdx) steps.push(showCard);
    });
    if (mode === 'case') steps.push(() => m.staff.forEach((s) => bubble(staff, s)));
    steps.push(() => { status.textContent = m.status; play.disabled = false; play.textContent = 'Play it again'; });

    if (reduceMotion.matches) { steps.forEach((f) => f()); return; }
    play.disabled = true;
    steps.forEach((f, i) => timers.push(setTimeout(f, 700 * i + 100)));
  }

  play.addEventListener('click', run);
  liveBtn.addEventListener('click', () => { mode = 'live'; reset(); });
  caseBtn.addEventListener('click', () => { mode = 'case'; reset(); });
  reset();
})();

/* 06 · How it's built. */
(function built() {
  const STACK = [
    ['reach', 'Microsoft Teams', 'Signed-in students, with single sign-on through Entra ID', 'Channel'],
    ['reach', 'University website', 'Web Chat on the website. Public answers need no sign-in.', 'Channel'],
    ['think', 'Campus Copilot main agent', 'Generative orchestration picks the specialist by name and description', 'Copilot Studio'],
    ['think', 'Four connected agents', 'Registrar, bursar, financial aid and IT. Published in the same environment, each owned by its office.', 'Multi-agent'],
    ['think', 'Three child agents', 'Housing, wellbeing and international office, inside the main agent', 'Multi-agent'],
    ['think', 'Topics', 'Escalate with Transfer conversation, Authenticate node, office-hours check, crisis resources', 'Copilot Studio'],
    ['know', 'Knowledge', 'Public website pages and SharePoint sites for each office, with citations', 'Copilot Studio'],
    ['know', 'SIS through an MCP server', 'Holds and registration, read with the signed-in student’s identity', 'MCP · tool'],
    ['know', 'Dataverse', 'Office hours, case log and conversation transcripts for analytics', 'Data'],
    ['know', 'Fabric data agent', 'Office leads ask questions about service volumes in Teams', 'Preview · Teams only'],
    ['act', 'Agent flows', 'Power Automate flows that create the case and send the confirmation', 'Power Automate'],
    ['act', 'ServiceNow connector', 'Create Record for after-hours cases, Get Records for ticket status', 'Premium connector'],
    ['act', 'Microsoft Dataverse connector', 'Add a new row to the Case table in Dynamics 365 Customer Service', 'Connector'],
    ['act', 'Dynamics 365 Customer Service', 'Live handoff with history and variables, routed to each office’s queue', 'Engagement hub'],
    ['act', 'Office 365 Outlook connector', 'Confirmation email with the case number', 'Connector'],
    ['guard', 'Microsoft Entra ID', 'Sign-in, and who can use each agent', 'Identity'],
    ['guard', 'Power Platform admin center', 'Environments and DLP policies for connectors', 'Admin'],
    ['guard', 'Copilot Studio analytics', 'Outcomes, answer rate and themes for each agent', 'Themes in preview'],
    ['guard', 'Microsoft Purview', 'Audit of agent activity', 'Compliance']
  ];
  const host = $('#stack');
  const items = STACK.map(([layer, name, what, tag]) => {
    const li = el('li');
    li.dataset.layer = layer;
    li.appendChild(el('strong', null, name));
    li.appendChild(el('span', null, what));
    li.appendChild(el('small', /preview/i.test(tag) ? 'is-preview' : null, tag));
    host.appendChild(li);
    return li;
  });
  const buttons = Array.from(document.querySelectorAll('.stack-filter button'));
  buttons.forEach((b) => b.addEventListener('click', () => {
    press(buttons, b);
    items.forEach((li) => { li.hidden = b.dataset.layer !== 'all' && li.dataset.layer !== b.dataset.layer; });
  }));

  const CONTROL = [
    ['c-read', 'The agent does on its own', ['Answers from published pages and policies', 'Reads the signed-in student’s holds, balance and aid status', 'Checks IT ticket status', 'Gives crisis and after-hours numbers']],
    ['c-confirm', 'The student confirms first', ['Creating a case', 'Sharing a summary with staff', 'Sending a confirmation email']],
    ['c-staff', 'Only staff decide', ['Placing or releasing holds', 'Changing charges, refunds or aid', 'Enrollment and course load approvals', 'Room changes', 'Anything clinical']]
  ];
  const grid = $('#control-grid');
  CONTROL.forEach(([cls, title, list]) => {
    const col = el('div', 'control-col ' + cls);
    col.appendChild(el('h4', null, title));
    const ul = el('ul');
    list.forEach((t) => ul.appendChild(el('li', null, t)));
    col.appendChild(ul);
    grid.appendChild(col);
  });
})();

/* 07 · Office analytics: themes with a low answer rate point to knowledge gaps. */
(function offices() {
  const DATA = {
    all: { name: 'All offices', out: [71, 19, 10],
      themes: [['Registration and holds', 88], ['Bills and payment plans', 84], ['Aid verification', 62], ['Break housing', 79], ['Visa and course load', 54]],
      gaps: [['Aid verification', 'Questions about which form applies to which student', 'Financial aid'], ['Visa and course load', 'Rules for online courses toward full time', 'International office'], ['Break housing', 'Meal plan over break is missing from the handbook', 'Housing']] },
    reg: { name: 'Registrar', out: [78, 15, 7],
      themes: [['Registration holds', 91], ['Transcripts', 86], ['Enrollment verification', 58], ['Add/drop deadlines', 93]],
      gaps: [['Enrollment verification', 'Letters for landlords and insurers aren’t explained anywhere', 'Registrar']] },
    bur: { name: 'Bursar', out: [74, 18, 8],
      themes: [['Payment plans', 87], ['Refund timing', 61], ['1098-T forms', 82], ['Late fees', 77]],
      gaps: [['Refund timing', 'No page says how long a refund takes after a drop', 'Bursar']] },
    aid: { name: 'Financial aid', out: [63, 27, 10],
      themes: [['Verification', 62], ['Disbursement dates', 84], ['Work-study', 72], ['Appeals', 41]],
      gaps: [['Appeals', 'The appeal process page is a PDF the agent can’t read well', 'Financial aid'], ['Verification', 'Which form applies to which student', 'Financial aid']] },
    hou: { name: 'Housing', out: [76, 14, 10],
      themes: [['Break housing', 79], ['Key cards', 90], ['Maintenance', 85], ['Room changes', 66]],
      gaps: [['Break housing', 'Meal plan over break is missing', 'Housing']] },
    it: { name: 'IT help desk', out: [82, 12, 6],
      themes: [['Passwords and MFA', 94], ['Wi-Fi', 89], ['Software licenses', 71], ['Printing', 68]],
      gaps: [['Printing', 'Printer locations changed and the article is out of date', 'IT help desk']] },
    well: { name: 'Wellbeing', out: [58, 34, 8],
      themes: [['Booking a counselor', 92], ['Support groups', 70], ['Accessibility services', 64]],
      gaps: [['Accessibility services', 'How to request exam adjustments isn’t on the page', 'Wellbeing']] },
    intl: { name: 'International office', out: [55, 37, 8],
      themes: [['Travel letters', 83], ['Visa and course load', 54], ['Work authorization', 49]],
      gaps: [['Work authorization', 'Off-campus work rules need a plain-language page', 'International office'], ['Visa and course load', 'Online courses toward full time', 'International office']] }
  };
  const ORDER = ['all', 'reg', 'bur', 'aid', 'hou', 'it', 'well', 'intl'];
  const filter = $('#office-filter');
  const bar = $('#outcome-bar');
  const key = $('#outcome-key');
  const themes = $('#themes');
  const gaps = $('#gap-list');
  const fixed = new Set();

  const segs = ['o-res', 'o-esc', 'o-aba'].map((c) => { const i = el('i', c); bar.appendChild(i); return i; });
  bar.setAttribute('role', 'img');

  const buttons = ORDER.map((id) => {
    const b = el('button', 'toggle', DATA[id].name);
    b.type = 'button';
    b.addEventListener('click', () => show(id, b));
    filter.appendChild(b);
    return b;
  });

  function show(id, btn) {
    press(buttons, btn);
    const d = DATA[id];
    const labels = ['Resolved', 'Escalated to staff', 'Abandoned'];
    d.out.forEach((v, i) => { segs[i].style.flexGrow = v; });
    bar.setAttribute('aria-label', labels.map((l, i) => l + ' ' + d.out[i] + '%').join(', '));
    key.textContent = '';
    labels.forEach((l, i) => {
      const li = el('li');
      li.appendChild(el('i', ['o-res', 'o-esc', 'o-aba'][i]));
      li.appendChild(el('span', null, l));
      li.appendChild(el('b', null, d.out[i] + '%'));
      key.appendChild(li);
    });
    themes.textContent = '';
    d.themes.forEach(([name, rate]) => {
      const li = el('li', rate < 65 ? 'is-low' : null);
      li.appendChild(el('span', null, name));
      const t = el('span', 'track');
      const i = el('i');
      i.style.width = rate + '%';
      t.appendChild(i);
      li.appendChild(t);
      li.appendChild(el('b', null, rate + '%'));
      themes.appendChild(li);
    });
    gaps.textContent = '';
    d.gaps.forEach(([theme, what, owner]) => {
      const id_ = theme + '|' + what;
      const li = el('li');
      const txt = el('div');
      txt.appendChild(el('strong', null, theme + ' · ' + owner));
      txt.appendChild(el('em', null, what));
      li.appendChild(txt);
      const b = el('button');
      b.type = 'button';
      const sync = () => {
        const on = fixed.has(id_);
        b.setAttribute('aria-pressed', String(on));
        b.textContent = on ? 'Page updated · watch the rate' : 'Assign the fix';
        li.classList.toggle('is-fixed', on);
      };
      b.addEventListener('click', () => { if (fixed.has(id_)) fixed.delete(id_); else fixed.add(id_); sync(); });
      sync();
      li.appendChild(b);
      gaps.appendChild(li);
    });
  }
  show('all', buttons[0]);
})();
