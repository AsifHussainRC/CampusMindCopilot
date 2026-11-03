'use strict';
const $ = id => document.getElementById(id);
const announce = m => { $('live-region').textContent = m; };
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const PAUSE = REDUCED ? 0 : 750;

/* Small DOM helper: text is always set with textContent. */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function pressGroup(selector, onPick) {
  const btns = [...document.querySelectorAll(selector)];
  btns.forEach(b => b.addEventListener('click', () => {
    btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    onPick(b);
  }));
}

/* ================= presenter notes ================= */
$('notes-on').addEventListener('change', e => {
  document.querySelectorAll('.pnote').forEach(p => { p.hidden = !e.target.checked; });
});

/* ================= shared thread rendering ================= */
function bubble(m) {
  const node = el('div', 'msg is-' + m.from + (m.deny ? ' is-deny' : ''));
  node.appendChild(el('span', 'msg-who', m.who));
  node.appendChild(el('p', 'msg-body', m.text));
  if (m.cites) {
    const row = el('div', 'cites');
    m.cites.forEach(c => row.appendChild(el('span', 'cite' + (c.startsWith('Not found') ? ' is-none' : ''), c)));
    node.appendChild(row);
  }
  return node;
}
function playThread(node, msgs, done) {
  node.textContent = '';
  const run = node.dataset.run = String(Number(node.dataset.run || 0) + 1);
  let i = 0;
  const step = () => {
    if (node.dataset.run !== run) return; /* a newer play started */
    node.appendChild(bubble(msgs[i]));
    i++;
    if (i < msgs.length) setTimeout(step, PAUSE);
    else { announce(msgs[msgs.length - 1].text); if (done) done(); }
  };
  step();
}

/* ================= 01 · the deadline queue ================= */
/* Illustrative: how the last ten working days before a sponsor deadline get used. */
const QUEUE = {
  today: {
    days: ['draft', 'draft', 'draft', 'draft', 'draft', 'draft', 'draft', 'route', 'route', 'late'],
    note: 'Signatures arrive on day 9. Sponsored programs gets one afternoon to review, and finds the gaps then.',
    alt: 'Seven days of writing, two waiting for signatures, review squeezed into the final day.'
  },
  copilot: {
    days: ['draft', 'draft', 'draft', 'draft', 'draft', 'route', 'route', 'review', 'review', 'buffer'],
    note: 'Gaps found by the readiness check on day 3. Approvals in Teams take two days. Review gets two, with a day spare.',
    alt: 'Five days of writing, two for approvals, two for review and one day of buffer.'
  }
};
const KEY = { draft: 'k-draft', route: 'k-route', review: 'k-review', buffer: 'k-buffer', late: 'k-review k-late' };
const dayCells = [];
for (let d = 10; d >= 1; d--) {
  const w = el('div');
  const i = el('i');
  w.appendChild(i);
  w.appendChild(el('span', '', d === 1 ? 'Due' : 'D-' + (d - 1)));
  $('queue-days').appendChild(w);
  dayCells.push(i);
}
const INBOX = [
  ['Deadlines, formats, page limits', 46, 9],
  ['Who signs, and where it is', 31, 4],
  ['Award balance and spend', 38, 6],
  ['Budget rules in the guidelines', 27, 11],
  ['Does this need compliance review?', 14, 14]
];
const inboxRows = INBOX.map(([label]) => {
  const row = el('div');
  row.appendChild(el('span', '', label));
  const bar = el('i');
  row.appendChild(bar);
  const val = el('b');
  row.appendChild(val);
  $('inbox-bars').appendChild(row);
  return { bar, val };
});
function showQueue(kind) {
  const q = QUEUE[kind];
  q.days.forEach((k, i) => { dayCells[i].className = KEY[k]; });
  $('queue-note').textContent = q.note;
  $('queue-alt').textContent = q.alt;
  const max = 46;
  INBOX.forEach((r, i) => {
    const v = kind === 'today' ? r[1] : r[2];
    inboxRows[i].bar.style.width = Math.round(v / max * 100) + '%';
    inboxRows[i].bar.classList.toggle('is-human', kind !== 'today' && i === INBOX.length - 1);
    inboxRows[i].val.textContent = v;
  });
  announce(q.note);
}
pressGroup('[data-queue]', b => showQueue(b.dataset.queue));
showQueue('today');

/* ================= 02 · ask the guidelines ================= */
const GUIDE = 'Northfield ECA Guide FY27';
const QA = {
  limit: [
    { from: 'you', who: 'Dr. Tomasz Wren', text: 'What is the page limit for the research plan?' },
    { from: 'ai', who: 'Campus Copilot', text: 'The research plan is limited to 10 pages, 11-point font or larger. References are not counted toward the limit and go in their own section.', cites: [GUIDE + ' · §4.2 Format', GUIDE + ' · §4.4 References'] }
  ],
  indirect: [
    { from: 'you', who: 'Dr. Tomasz Wren', text: 'Can I charge our usual indirect cost rate?' },
    { from: 'ai', who: 'Campus Copilot', text: 'This sponsor caps indirect costs at 10% of total direct costs, so the institution\'s usual rate does not apply here. Your pre-award officer confirms the base used in the budget.', cites: [GUIDE + ' · §6.1 Budget limits', 'Sponsored programs · Indirect cost FAQ'] }
  ],
  eligible: [
    { from: 'you', who: 'Dr. Tomasz Wren', text: 'My doctorate was awarded in 2021. Am I eligible?' },
    { from: 'ai', who: 'Campus Copilot', text: 'The guide asks for applicants within seven years of their doctorate on the deadline date (1 March 2027). From the year you gave, you appear to be inside that window. The pre-award officer confirms eligibility before submission.', cites: [GUIDE + ' · §2.1 Eligibility'] }
  ],
  unknown: [
    { from: 'you', who: 'Dr. Tomasz Wren', text: 'Can I add a co-PI at a university in another country?' },
    { from: 'ai', who: 'Campus Copilot', text: 'The Northfield guide doesn\'t say whether co-PIs at institutions in other countries are allowed, and I won\'t guess. Want me to send this question to your pre-award officer?', cites: ['Not found in the uploaded guidelines'] },
    { from: 'sys', who: 'HAND-OFF', text: 'Question and thread sent to Jo Mbeki, pre-award officer, after Dr. Wren selected "Yes, send it".' }
  ]
};
pressGroup('[data-q]', b => playThread($('qa-thread'), QA[b.dataset.q]));
playThread($('qa-thread'), QA.limit);

/* ================= 03 · readiness check ================= */
/* [status, item, finding, where it looked] — status: ok | warn | gap */
const CHECK = [
  ['ok', 'Project summary', 'Present, one page (limit one).', 'Solicitation §4.1 · draft p.1'],
  ['ok', 'Research plan', '9.5 pages of a 10-page limit.', 'Solicitation §4.2 · draft pp.2–11'],
  ['gap', 'Data management plan', 'Required, but not found in the draft.', 'Solicitation §4.6'],
  ['warn', 'Budget justification · personnel', 'Justification totals $142,000; the budget form shows $148,500.', 'Solicitation §6.2 · draft p.14'],
  ['gap', 'Budget justification · equipment', '$18,000 instrument in the budget is not explained in the justification.', 'Solicitation §6.3 · draft p.15'],
  ['warn', 'Indirect costs', 'Calculated at the institution\'s usual rate; this sponsor caps them at 10%.', 'Solicitation §6.1 · draft p.13'],
  ['ok', 'Biographical sketch', 'Present, three pages (limit three).', 'Solicitation §4.7 · draft pp.16–18'],
  ['gap', 'Letter of collaboration', 'The plan names an external collaborator; no letter is attached.', 'Solicitation §4.8 · draft p.6']
];
const MARK = { ok: '✓', warn: '!', gap: '×' };
let readyFilter = 'all';
let readyRun = 0;
function renderChecklist(revealed) {
  const list = $('ready-list');
  list.textContent = '';
  CHECK.forEach(([st, item, finding, where], i) => {
    const shown = i < revealed;
    if (readyFilter === 'gap' && (!shown || st === 'ok')) return;
    const li = el('li', shown ? 'is-' + st : 'is-pending');
    li.appendChild(el('span', 'mark', shown ? MARK[st] : '·'));
    li.appendChild(el('strong', '', item));
    const body = el('div');
    body.appendChild(el('em', '', shown ? finding : 'Not checked yet'));
    if (shown) { body.appendChild(document.createElement('br')); body.appendChild(el('span', 'where', where)); }
    li.appendChild(body);
    list.appendChild(li);
  });
  $('ready-meter').style.width = Math.round(revealed / CHECK.length * 100) + '%';
}
let readyShown = 0;
$('ready-run').addEventListener('click', () => {
  const btn = $('ready-run');
  const run = ++readyRun;
  btn.disabled = true;
  readyShown = 0;
  $('ready-status').textContent = 'Prompt tool reading the draft and the solicitation…';
  const tick = () => {
    if (run !== readyRun) return;
    readyShown++;
    renderChecklist(readyShown);
    if (readyShown < CHECK.length) setTimeout(tick, REDUCED ? 0 : 260);
    else {
      const gaps = CHECK.filter(c => c[0] === 'gap').length;
      const warns = CHECK.filter(c => c[0] === 'warn').length;
      $('ready-status').textContent = `${gaps} missing, ${warns} inconsistent, ${CHECK.length - gaps - warns} in order. Nothing in the proposal was changed.`;
      btn.disabled = false;
      btn.textContent = '▶ Run it again';
    }
  };
  tick();
});
pressGroup('[data-rf]', b => { readyFilter = b.dataset.rf; renderChecklist(readyShown); });
renderChecklist(0);

/* ================= 04 · compliance hand-offs ================= */
const SCREEN = [
  { id: 'human', q: 'Will people take part as research participants, or will you use their identifiable data?', office: 'IRB office' },
  { id: 'animals', q: 'Will the work involve live vertebrate animals?', office: 'Animal care & use office' },
  { id: 'bio', q: 'Will you use recombinant DNA, infectious agents or biological toxins?', office: 'Biosafety office' },
  { id: 'export', q: 'Will equipment, software or data go to collaborators in other countries?', office: 'Export control office' },
  { id: 'coi', q: 'Do you have a financial interest in a company related to this work?', office: 'Conflict of interest office' }
];
const answers = { human: 'yes', animals: 'no', bio: 'no', export: 'unsure', coi: 'no' };
let sent = false;
SCREEN.forEach(s => {
  const box = el('div', 'sq');
  box.appendChild(el('p', '', s.q));
  const opts = el('div', 'opts');
  opts.setAttribute('role', 'group');
  opts.setAttribute('aria-label', s.q);
  [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']].forEach(([v, label]) => {
    const b = el('button', '', label);
    b.type = 'button';
    b.dataset.v = v;
    b.setAttribute('aria-pressed', String(answers[s.id] === v));
    b.addEventListener('click', () => {
      answers[s.id] = v;
      opts.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      sent = false;
      renderHandoff();
    });
    opts.appendChild(b);
  });
  box.appendChild(opts);
  $('screen').appendChild(box);
});
function renderHandoff() {
  const host = $('handoff');
  host.textContent = '';
  const flagged = SCREEN.filter(s => answers[s.id] !== 'no');
  if (!flagged.length) {
    host.appendChild(bubble({ from: 'ai', who: 'Campus Copilot', text: 'Nothing from these questions needs a hand-off. Sponsored programs still reviews the proposal and may ask more. If anything changes, tell me and I\'ll ask again.' }));
    return;
  }
  const msg = bubble({
    from: 'ai', who: 'Campus Copilot',
    text: sent
      ? 'Sent. Each office has the proposal summary and your answers, and you are copied. They will tell you what review, if any, applies.'
      : `Your answers mean ${flagged.length === 1 ? 'this office should' : 'these offices should'} take a look. I can't tell you whether review is required. That is their decision, under the institution's policies. Send them the proposal summary?`
  });
  const row = el('div', 'offices');
  flagged.forEach(s => row.appendChild(el('span', 'office' + (sent ? ' is-sent' : ''), (sent ? '✓ ' : '') + s.office + (answers[s.id] === 'unsure' ? ' · not sure' : ''))));
  msg.appendChild(row);
  if (!sent) {
    const go = el('button', 'primary-button', 'Yes, send it');
    go.type = 'button';
    go.addEventListener('click', () => { sent = true; renderHandoff(); announce('Sent to ' + flagged.map(s => s.office).join(', ')); });
    msg.appendChild(go);
  }
  host.appendChild(msg);
  if (sent) host.appendChild(bubble({ from: 'sys', who: 'AGENT FLOW', text: flagged.map(s => 'Posted to ' + s.office + ' channel').join(' · ') + ' · PI copied by email' }));
}
renderHandoff();

/* ================= 05 · routing & reminders ================= */
const ROUTE = [
  { who: 'Department chair', name: 'Dr. Ruth Calloway · Chemistry', ask: 'Approve Northfield ECA proposal · Dr. Wren' },
  { who: 'Dean', name: 'Prof. Anders Holt · College of Science', ask: 'Approve Northfield ECA proposal · cost share $0' },
  { who: 'Sponsored programs', name: 'Jo Mbeki · pre-award officer', ask: 'Final review and institutional sign-off' }
];
let routeAt = -1;          /* -1 not started, 0..2 waiting at step, 3 complete */
let routeStopped = false;
function renderRoute() {
  const host = $('route');
  host.textContent = '';
  ROUTE.forEach((r, i) => {
    let cls = '';
    let state = 'NOT STARTED';
    if (routeAt > i) { cls = 'is-done'; state = 'APPROVED'; }
    else if (routeAt === i && routeStopped) { cls = 'is-wait'; state = 'CHANGES REQUESTED'; }
    else if (routeAt === i) { cls = 'is-wait'; state = 'WAITING · TEAMS CARD SENT'; }
    const li = el('li', cls);
    li.appendChild(el('strong', '', r.who));
    li.appendChild(el('span', '', r.name));
    li.appendChild(el('span', 'state', state));
    if (routeAt === i && !routeStopped) {
      const card = el('div', 'card');
      card.appendChild(el('b', '', r.ask));
      card.appendChild(el('small', '', 'Approvals · readiness checklist and budget attached'));
      const acts = el('div', 'card-actions');
      const ok = el('button', '', 'Approve');
      ok.type = 'button';
      ok.addEventListener('click', () => advanceRoute(true));
      const no = el('button', 'is-alt', 'Request changes');
      no.type = 'button';
      no.addEventListener('click', () => advanceRoute(false));
      acts.appendChild(ok);
      acts.appendChild(no);
      card.appendChild(acts);
      li.appendChild(card);
    }
    host.appendChild(li);
  });
}
function advanceRoute(approved) {
  const status = $('route-status');
  if (!approved) {
    routeStopped = true;
    status.textContent = `${ROUTE[routeAt].who} requested changes. The flow stopped and sent the comments to Dr. Wren.`;
  } else {
    routeAt++;
    status.textContent = routeAt < ROUTE.length
      ? `Approved. Next approval sent to ${ROUTE[routeAt].who.toLowerCase()}.`
      : 'All three approved. Sponsored programs submits to the sponsor; the record is saved with the proposal.';
  }
  renderRoute();
  announce(status.textContent);
}
$('route-next').addEventListener('click', () => {
  routeAt = 0; routeStopped = false;
  $('route-next').disabled = true;
  $('route-status').textContent = 'Dr. Wren confirmed. Approval request sent to the department chair.';
  renderRoute();
});
$('route-reset').addEventListener('click', () => {
  routeAt = -1; routeStopped = false;
  $('route-next').disabled = false;
  $('route-status').textContent = '';
  renderRoute();
});
renderRoute();

const REMIND = [
  { d: 21, label: 'days out', to: 'To Dr. Wren', text: 'Northfield ECA closes 1 March (21 days). Your readiness check has 3 open gaps. Internal routing should start by 15 February.' },
  { d: 10, label: 'days out', to: 'To Dr. Wren', text: 'Routing starts in 3 days and the chair hasn\'t been asked yet. Reply "route it" when the draft is ready.' },
  { d: 5, label: 'days out', to: 'To Dr. Wren and Jo Mbeki', text: 'Today is the institution\'s internal deadline for the final package. Dean approval is still pending.' },
  { d: 2, label: 'days out', to: 'To Prof. Holt', text: 'Reminder: one proposal waiting for your approval, due to the sponsor in 2 days.' },
  { d: 0, label: 'deadline', to: 'To Dr. Wren', text: 'Submitted by sponsored programs at 10:42. The confirmation is saved with the proposal record.' }
];
REMIND.forEach((r, i) => {
  const b = el('button');
  b.type = 'button';
  b.appendChild(el('b', '', r.d === 0 ? 'Day' : 'T-' + r.d));
  b.appendChild(el('span', '', r.label));
  b.setAttribute('aria-pressed', String(i === 0));
  b.dataset.i = String(i);
  $('countdown').appendChild(b);
});
function showRemind(i) {
  const r = REMIND[i];
  $('remind-card').textContent = '';
  $('remind-card').appendChild(bubble({ from: 'ai', who: 'Scheduled flow · Teams message · ' + r.to, text: r.text }));
}
pressGroup('#countdown button', b => showRemind(Number(b.dataset.i)));
showRemind(0);

/* ================= 06 · after the award ================= */
const PIS = {
  wren: {
    name: 'Dr. Wren',
    awards: [
      { id: 'NF-2291', title: 'Northfield · Early Career (prior)', budget: 250000, spent: 171400, elapsed: 70 },
      { id: 'HST-0417', title: 'Halvorsen Trust · Catalysis', budget: 480000, spent: 122000, elapsed: 45 }
    ],
    due: [
      ['15 Jan', 'Annual progress report · HST-0417', 'Report'],
      ['31 Jan', 'Effort certification · fall term', 'Effort'],
      ['30 Apr', 'Final financial report · NF-2291', 'Report']
    ],
    answers: {
      left: 'NF-2291 has $78,600 left of $250,000. HST-0417 has $358,000 left of $480,000. Figures are as of last night\'s ledger load.',
      pace: 'NF-2291 is 69% spent with 70% of the time gone, so roughly on pace. HST-0417 is 25% spent at 45% of the time: about $94,000 behind a straight-line plan.',
      buy: 'HST-0417 has $41,000 left in its equipment category. Whether this instrument is an allowable cost on the award is for your post-award officer to decide. Send the question to Rosa Kimura?',
      other: 'I can\'t see that. I can only show awards where you are the PI or a named delegate.'
    },
    otherQ: 'Show Dr. Nandakumar\'s award'
  },
  nanda: {
    name: 'Dr. Nandakumar',
    awards: [
      { id: 'NF-3310', title: 'Northfield · Seed Grant', budget: 60000, spent: 51200, elapsed: 60 }
    ],
    due: [
      ['31 Jan', 'Effort certification · fall term', 'Effort'],
      ['28 Feb', 'Interim report · NF-3310', 'Report']
    ],
    answers: {
      left: 'NF-3310 has $8,800 left of $60,000, as of last night\'s ledger load.',
      pace: 'NF-3310 is 85% spent with 60% of the time gone. At this rate the funds run out about four months before the end date.',
      buy: 'NF-3310 has $8,800 left in total, less than $12,000. Whether a rebudget is possible is for your post-award officer to decide. Send the question to Rosa Kimura?',
      other: 'I can\'t see that. I can only show awards where you are the PI or a named delegate.'
    },
    otherQ: 'Show Dr. Wren\'s awards'
  }
};
const SPEND_QS = [
  ['left', 'How much is left?'],
  ['pace', 'Am I on pace?'],
  ['buy', 'Can I buy a $12,000 instrument?'],
  ['other', null]
];
let currentPi = 'wren';
const money = n => '$' + n.toLocaleString('en-US');
function renderPi() {
  const pi = PIS[currentPi];
  $('pa-who').textContent = pi.name + ' · user authentication';
  const host = $('awards');
  host.textContent = '';
  pi.awards.forEach(a => {
    const card = el('div', 'award');
    const head = el('header');
    head.appendChild(el('strong', '', a.id));
    head.appendChild(el('small', '', a.title));
    card.appendChild(head);
    const burn = el('div', 'burn');
    burn.setAttribute('role', 'img');
    const pct = Math.round(a.spent / a.budget * 100);
    burn.setAttribute('aria-label', `${pct}% spent, ${a.elapsed}% of time elapsed`);
    const fill = el('i');
    fill.style.width = pct + '%';
    const mark = el('em');
    mark.style.left = a.elapsed + '%';
    burn.appendChild(fill);
    burn.appendChild(mark);
    card.appendChild(burn);
    const lab = el('div', 'burn-label');
    lab.appendChild(el('span', '', money(a.spent) + ' of ' + money(a.budget)));
    lab.appendChild(el('span', '', a.elapsed + '% of time'));
    card.appendChild(lab);
    host.appendChild(card);
  });
  const qs = $('spend-qs');
  qs.textContent = '';
  SPEND_QS.forEach(([k, label]) => {
    const b = el('button', '', label || pi.otherQ);
    b.type = 'button';
    b.dataset.k = k;
    b.setAttribute('aria-pressed', 'false');
    qs.appendChild(b);
  });
  pressGroup('#spend-qs button', b => askSpend(b.dataset.k, b.textContent));
  const due = $('due');
  due.textContent = '';
  pi.due.forEach(([date, what, kind]) => {
    const li = el('li');
    li.appendChild(el('time', '', date));
    li.appendChild(el('span', '', what));
    li.appendChild(el('span', 'kind' + (kind === 'Effort' ? ' is-effort' : ''), kind));
    due.appendChild(li);
  });
  $('pa-thread').textContent = '';
  $('pa-thread').appendChild(bubble({ from: 'sys', who: 'SIGNED IN', text: `Signed in to Teams as ${pi.name}. The data agent queries the grants ledger with these permissions.` }));
}
function askSpend(k, label) {
  const pi = PIS[currentPi];
  const msgs = [
    { from: 'you', who: pi.name, text: label },
    { from: 'sys', who: 'ORCHESTRATOR', text: 'Routing to the Fabric data agent · grants ledger · user authentication' },
    { from: 'ai', who: 'Campus Copilot', text: pi.answers[k], deny: k === 'other' }
  ];
  playThread($('pa-thread'), msgs);
}
pressGroup('[data-pi]', b => { currentPi = b.dataset.pi; renderPi(); });
renderPi();

/* ================= 07 · how it's built ================= */
const STACK = [
  { name: 'Copilot Studio agent', tag: 'Generative orchestration', text: 'One agent with instructions that bar it from writing research content or making compliance or allowability decisions.', chips: ['Instructions & guardrails', 'GPT Chat Latest (default model)', 'Published to Microsoft Teams'] },
  { name: 'Knowledge', tag: 'SharePoint', text: 'The office\'s library of sponsor guidelines and solicitations. Answers cite the file; content follows the user\'s SharePoint permissions.', chips: ['SharePoint knowledge source', 'Citations on every answer'] },
  { name: 'Prompt tool', tag: 'Readiness check', text: 'A prompt with two PDF inputs (draft and solicitation) that returns a checklist of present, missing and inconsistent items.', chips: ['Prompt · document inputs', 'Reads, never rewrites'] },
  { name: 'Topics', tag: 'Compliance screening', text: 'Fixed screening questions written by the compliance offices, with a hand-off message instead of a determination.', chips: ['Question nodes', 'Hand-off to a person'] },
  { name: 'Agent & cloud flows', tag: 'Power Automate', text: 'Sequential approvals (chair → dean → sponsored programs), office hand-offs and a daily Recurrence flow for reminders.', chips: ['Standard approvals', 'Microsoft Teams', 'Office 365 Outlook', 'SharePoint'] },
  { name: 'Connected agent', tag: 'Fabric data agent · preview', text: 'Answers spend questions over the grants ledger in Fabric. User authentication plus row-level security: PIs see only their awards. Validated in Teams only.', chips: ['Fabric data agent', 'User authentication', 'Row-level security'] },
  { name: 'Data', tag: 'Dataverse', text: 'A proposals-in-flight table: sponsor, deadline, routing state and checklist results, read by the reminder flow.', chips: ['Dataverse table', 'Institution retention policy'] },
  { name: 'Identity & governance', tag: 'Entra ID · admin center', text: 'Who can use the agent, which connectors can mix, and what it cost.', chips: ['Entra ID groups', 'Environments & DLP', 'Copilot Studio analytics', 'Microsoft Purview audit', 'Copilot Credits reports'] }
];
STACK.forEach((s, i) => {
  const b = el('button');
  b.type = 'button';
  b.setAttribute('role', 'listitem');
  b.setAttribute('aria-pressed', String(i === 0));
  b.dataset.i = String(i);
  b.appendChild(el('strong', '', s.name));
  b.appendChild(el('span', '', s.tag));
  $('stack').appendChild(b);
});
function showStack(i) {
  const s = STACK[i];
  const host = $('stack-detail');
  host.textContent = '';
  host.appendChild(el('p', '', s.text));
  const row = el('div', 'chip-row');
  s.chips.forEach(c => row.appendChild(el('span', 'gchip', c)));
  host.appendChild(row);
}
pressGroup('#stack button', b => showStack(Number(b.dataset.i)));
showStack(0);

const DECIDE = [
  ['is-agent', 'The agent', ['Answers from uploaded guidelines, with citations', 'Lists gaps against the solicitation', 'Asks screening questions', 'Reports balances from the ledger', 'Sends reminders']],
  ['is-people', 'People', ['Write the science', 'Approve: chair, dean, sponsored programs', 'Decide on IRB, animal, biosafety, export, COI review', 'Rule on allowable costs', 'Submit to the sponsor']]
];
DECIDE.forEach(([cls, head, items]) => {
  const d = el('div', cls);
  d.appendChild(el('b', '', head));
  const ul = el('ul');
  items.forEach(t => ul.appendChild(el('li', '', t)));
  d.appendChild(ul);
  $('decide').appendChild(d);
});

const OUTCOMES = [
  ['4 days', 'more time for sponsored programs review, per proposal'],
  ['7 of 10', 'guideline questions answered with a citation, no officer needed'],
  ['0', 'compliance determinations made by the agent. By design.']
];
OUTCOMES.forEach(([n, t]) => {
  const d = el('div', 'outcome');
  d.appendChild(el('strong', '', n));
  d.appendChild(el('span', '', t));
  $('outcomes').appendChild(d);
});

/* ================= section nav ================= */
$('section-jump').addEventListener('change', e => {
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
    let id = 'queue';
    document.querySelectorAll('main section').forEach(s => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    $('section-jump').value = id;
  });
}, { passive: true });
