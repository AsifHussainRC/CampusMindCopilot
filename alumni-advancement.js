'use strict';
const $ = id => document.getElementById(id);
const announce = m => { $('live-region').textContent = m; };
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const STEP = REDUCED ? 0 : 750;

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function pressGroup(selector, onPick) {
  const btns = document.querySelectorAll(selector);
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
/* from: you | ai | sys | card. A card is a confirmation shown in chat before a tool runs. */
function bubble(m) {
  const node = el('div', 'msg is-' + m.from);
  node.appendChild(el('span', 'msg-who' + (m.from === 'ai' ? ' is-model' : m.from === 'sys' || m.from === 'card' ? ' is-sys' : ''), m.who));
  node.appendChild(el('p', 'msg-body', m.text));
  if (m.rows) {
    const dl = el('dl', 'diff');
    m.rows.forEach(([k, a, b]) => {
      const row = el('div');
      row.appendChild(el('dt', null, k));
      const dd = el('dd');
      if (a) dd.appendChild(el('s', null, a));
      dd.appendChild(el('span', null, b));
      row.appendChild(dd);
      dl.appendChild(row);
    });
    node.appendChild(dl);
  }
  if (m.buttons) {
    const row = el('div', 'card-btns');
    m.buttons.forEach((b, i) => row.appendChild(el('span', i === 0 ? 'fake-btn is-primary' : 'fake-btn', b)));
    node.appendChild(row);
  }
  if (m.src) node.appendChild(el('span', 'src', m.src));
  return node;
}
const timers = new Map();
function playThread(node, messages, done) {
  (timers.get(node) || []).forEach(clearTimeout);
  const list = [];
  timers.set(node, list);
  node.textContent = '';
  messages.forEach((m, i) => {
    const show = () => {
      const b = bubble(m);
      node.appendChild(b);
      if (!REDUCED) b.classList.add('is-in');
      if (i === messages.length - 1 && done) done();
    };
    if (!STEP) show(); else list.push(setTimeout(show, STEP * i));
  });
}

/* ================= 01 · routes ================= */
const ROUTES = [
  ['Event RSVP', 'Forwarded to events', 'Registered in chat'],
  ['Transcript request', 'Forwarded to registrar', 'Request opened with the Registrar'],
  ['Mentoring offer', 'Waits for Careers', 'Sign-up logged for review'],
  ['New address', 'Retyped into the CRM', 'Written to the CRM after the alum confirms'],
  ['“Stop the appeals”', 'Sometimes missed', 'Preference saved, every flow checks it']
];
const routesEl = $('routes');
ROUTES.forEach(([req]) => {
  const li = el('li');
  li.appendChild(el('span', 'route-req', req));
  li.appendChild(el('span', 'route-arrow', '→'));
  li.appendChild(el('span', 'route-dest'));
  routesEl.appendChild(li);
});
const PREP = { today: [75, 15], agent: [10, 80] };
function showRoute(mode) {
  const agent = mode === 'agent';
  $('prep-bar').classList.toggle('is-agent', agent);
  routesEl.classList.toggle('is-agent', agent);
  routesEl.querySelectorAll('li').forEach((li, i) => {
    li.querySelector('.route-dest').textContent = agent ? ROUTES[i][2] : 'alumni@ inbox · ' + ROUTES[i][1].toLowerCase();
  });
  $('route-note').textContent = agent
    ? 'Each request reaches the office that owns it, with the details already collected.'
    : 'One shared inbox. A person reads, forwards and chases every message. First reply: about 3 working days.';
  const [g, t] = PREP[mode];
  $('prep-gather').style.flexGrow = g;
  $('prep-think').style.flexGrow = t;
  $('prep-gather').querySelector('b').textContent = g;
  $('prep-think').querySelector('b').textContent = t;
  $('prep-gather').lastChild.textContent = agent ? ' min reviewing the brief' : ' min gathering';
  $('prep-alt').textContent = agent
    ? 'With a brief in Teams: about 10 minutes reviewing, 80 minutes planning the visit.'
    : 'Today: about 75 minutes gathering from several systems, 15 minutes planning the visit.';
}
pressGroup('[data-route]', b => { showRoute(b.dataset.route); announce(b.textContent); });
showRoute('today');

/* ================= 02 · alumni scenes ================= */
const ALUM = 'INES · ALUM';
const AGENT = 'CAMPUS COPILOT';
const SCENES = {
  events: {
    signedIn: true,
    route: 'Events system',
    note: 'The alum confirms before the registration is made.',
    pnote: 'Event details come from the events system through a connector (for example Eventbrite) or a Dataverse events table. "Register attendee" is a tool with "Ask the end user before running" set to Yes, so the card is shown and nothing is booked until Ines confirms.',
    msgs: [
      { from: 'you', who: ALUM, text: 'Is there anything for alumni in Chicago this spring?' },
      { from: 'ai', who: AGENT, text: 'Yes. The Chicago Alumni Reception is on Thursday 23 April, 6–8 pm, at the Riverside Gallery. It’s free and guests are welcome. Would you like me to register you?', src: 'Events calendar' },
      { from: 'you', who: ALUM, text: 'Yes, me plus one.' },
      { from: 'card', who: 'CONFIRM BEFORE RUNNING', text: 'Register Ines Aldana and 1 guest for the Chicago Alumni Reception?', buttons: ['Confirm', 'Cancel'] },
      { from: 'sys', who: 'TOOL', text: 'Events · Register attendee · confirmed by Ines' },
      { from: 'ai', who: AGENT, text: 'You’re registered. A confirmation is on its way to the email we have on file. You can add dietary needs at any time.' }
    ]
  },
  transcript: {
    signedIn: false,
    route: 'Registrar',
    note: 'The agent routes the request. The Registrar verifies identity and sends the record.',
    pnote: 'A topic recognises transcript requests and explains that the Registrar owns them. With the alum’s agreement, an agent flow creates a request in the Registrar’s service queue (for example a Dataverse table or ticketing system through its connector). The agent has no tool that reads or sends academic records.',
    msgs: [
      { from: 'you', who: ALUM, text: 'I need an official transcript sent to a graduate school.' },
      { from: 'ai', who: AGENT, text: 'Official transcripts are handled by the Registrar, not Alumni Relations. They check your identity and send it securely. I can open a request with the Registrar for you, or give you the link to order it yourself.', src: 'Registrar · transcripts page' },
      { from: 'you', who: ALUM, text: 'Open the request, please.' },
      { from: 'card', who: 'CONFIRM BEFORE RUNNING', text: 'Send your name, class year and the destination school to the Registrar?', buttons: ['Send to Registrar', 'Cancel'] },
      { from: 'sys', who: 'AGENT FLOW', text: 'Create registrar request · REG-20814 · routed to the Registrar queue' },
      { from: 'ai', who: AGENT, text: 'Done. Request REG-20814 is with the Registrar. They’ll email you to confirm your identity and any fee. I can’t see or send academic records myself.' }
    ]
  },
  mentor: {
    signedIn: true,
    route: 'Mentoring program',
    note: 'Sign-ups wait for review by the Careers team before any student is matched.',
    pnote: 'The sign-up is a Dataverse row (or a CRM volunteer record) created by a tool after Ines confirms. Its status starts as "Pending review"; the mentoring coordinator approves mentors before matching. The agent does not match students.',
    msgs: [
      { from: 'you', who: ALUM, text: 'I’d like to mentor current students who want to work in marketing.' },
      { from: 'ai', who: AGENT, text: 'Thank you. Mentors meet one or two students a term, about an hour a month. Shall I sign you up with Marketing as your field and email as your contact method?', src: 'Alumni mentoring guide' },
      { from: 'card', who: 'CONFIRM BEFORE RUNNING', text: 'Add Ines Aldana as a mentor · Field: Marketing · Contact: email', buttons: ['Sign me up', 'Change'] },
      { from: 'sys', who: 'TOOL', text: 'Dataverse · Add mentor sign-up · status: Pending review' },
      { from: 'ai', who: AGENT, text: 'You’re on the list. The Careers team reviews every mentor before matching and will be in touch within two weeks.' }
    ]
  },
  update: {
    signedIn: true,
    route: 'CRM · after confirmation',
    note: 'Old and new are shown side by side. Nothing changes until the alum confirms.',
    pnote: 'The topic requires sign-in. The update tool (Microsoft Dataverse "Update a row" for Dynamics 365, or the Salesforce or Raiser’s Edge NXT connector) has "Ask the end user before running" on. The flow tags the change with its source and emails both the old and new address. A change of name is sent to Advancement Services for review instead of being written directly.',
    msgs: [
      { from: 'you', who: ALUM, text: 'I’ve moved. New address is 14 Larch Lane, Portland OR 97205, and my email is now ines@aldana.studio.' },
      { from: 'card', who: 'CONFIRM BEFORE RUNNING', text: 'Please check these changes to your alumni record:', rows: [['Address', '220 Bay St, Oakland CA', '14 Larch Lane, Portland OR 97205'], ['Email', 'ines.a@oldmail.example', 'ines@aldana.studio']], buttons: ['Confirm', 'Edit'] },
      { from: 'sys', who: 'AGENT FLOW', text: 'Update contact in CRM · source: alumni self-service · confirmed by Ines' },
      { from: 'ai', who: AGENT, text: 'Updated. We’ve sent a note to both your old and new email, in case this wasn’t you.' }
    ]
  },
  giving: {
    signedIn: true,
    route: 'Giving FAQ · preferences',
    note: 'Answers giving questions without asking for a gift. An opt-out is saved the moment the alum confirms.',
    pnote: 'Giving answers come from the public giving pages added as website knowledge, with citations. The agent’s instructions say not to solicit, upsell or follow up on a gift. The opt-out uses a tool that writes the solicitation preference after confirmation; every appeal flow checks it (section 03).',
    msgs: [
      { from: 'you', who: ALUM, text: 'Does my employer match gifts to the scholarship fund?' },
      { from: 'ai', who: AGENT, text: 'Many employers do. The giving site explains how to ask your employer for a match, and Advancement Services confirms when it arrives. There’s nothing you need to decide today.', src: 'Giving FAQ · matching gifts' },
      { from: 'you', who: ALUM, text: 'Thanks. Honestly, please stop sending me fundraising emails.' },
      { from: 'card', who: 'CONFIRM BEFORE RUNNING', text: 'Turn off fundraising appeals? You’ll still get event invitations and the alumni magazine unless you turn those off too.', rows: [['Fundraising appeals', 'On', 'Off'], ['Event invitations', '', 'On'], ['Alumni magazine', '', 'On']], buttons: ['Confirm', 'Turn off everything'] },
      { from: 'sys', who: 'AGENT FLOW', text: 'Update communication preferences · confirmed by Ines' },
      { from: 'ai', who: AGENT, text: 'Done. You won’t get fundraising appeals from us. You can change this any time, here or from the link at the bottom of any email.' }
    ]
  }
};
let scene = 'events';
function loadScene(name, play) {
  scene = name;
  const s = SCENES[name];
  $('scene-route').textContent = 'Routed to: ' + s.route;
  $('scene-note').textContent = s.note;
  $('scene-pnote').textContent = s.pnote;
  $('signin-state').textContent = 'Not signed in';
  const thread = $('alumni-thread');
  if (!play) {
    thread.textContent = '';
    thread.appendChild(bubble(s.msgs[0]));
    $('alumni-play').textContent = '▶ Play the conversation';
    return;
  }
  $('alumni-play').disabled = true;
  if (s.signedIn) $('signin-state').textContent = 'Signed in · Ines Aldana ’09';
  playThread(thread, s.msgs, () => {
    $('alumni-play').disabled = false;
    $('alumni-play').textContent = '↻ Replay';
    announce('Conversation finished: ' + s.note);
  });
}
pressGroup('[data-scene]', b => loadScene(b.dataset.scene, false));
$('alumni-play').addEventListener('click', () => loadScene(scene, true));
loadScene('events', false);

/* ================= 03 · preferences ================= */
const PREFS = [
  ['dnc', 'Do not contact (all)', false],
  ['email', 'Email', true],
  ['phone', 'Phone', true],
  ['post', 'Postal mail', true],
  ['appeals', 'Fundraising appeals', true],
  ['events', 'Event invitations', true]
];
const OUTBOUND = [
  ['Spring giving appeal', 'Email', ['email', 'appeals']],
  ['Chicago reception reminder', 'Email', ['email', 'events']],
  ['Phonathon call list', 'Phone', ['phone', 'appeals']],
  ['Alumni magazine', 'Post', ['post']],
  ['Gift officer introduction', 'Email', ['email', 'appeals']]
];
const prefState = {};
const prefList = $('pref-list');
PREFS.forEach(([key, label, on]) => {
  prefState[key] = on;
  const row = el('label', 'pref' + (key === 'dnc' ? ' is-dnc' : ''));
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.setAttribute('role', 'switch');
  input.checked = key === 'dnc' ? on : on;
  input.dataset.key = key;
  row.appendChild(input);
  row.appendChild(el('span', 'pref-label', label));
  row.appendChild(el('span', 'pref-val'));
  prefList.appendChild(row);
  input.addEventListener('change', () => { prefState[key] = input.checked; renderQueue(); });
});
const PLABEL = Object.fromEntries(PREFS.map(p => [p[0], p[1]]));
function renderQueue() {
  prefList.querySelectorAll('.pref').forEach(row => {
    const k = row.querySelector('input').dataset.key;
    const v = prefState[k];
    row.querySelector('.pref-val').textContent = k === 'dnc' ? (v ? 'On' : 'Off') : (v ? 'Allowed' : 'Not allowed');
    row.classList.toggle('is-off', k !== 'dnc' && !v);
    row.classList.toggle('is-muted', k !== 'dnc' && prefState.dnc);
  });
  const q = $('queue');
  q.textContent = '';
  let sent = 0;
  OUTBOUND.forEach(([name, channel, needs]) => {
    let reason = '';
    if (prefState.dnc) reason = 'Do not contact';
    else {
      const miss = needs.find(n => !prefState[n]);
      if (miss) reason = PLABEL[miss] + ' not allowed';
    }
    const li = el('li', reason ? 'is-held' : 'is-sent');
    const left = el('span');
    left.appendChild(el('strong', null, name));
    left.appendChild(el('small', null, channel));
    li.appendChild(left);
    li.appendChild(el('span', 'q-state', reason ? 'Suppressed · ' + reason : 'Will send'));
    q.appendChild(li);
    if (!reason) sent++;
  });
  $('queue-sum').textContent = sent + ' of ' + OUTBOUND.length + ' will reach Ines · ' + (OUTBOUND.length - sent) + ' suppressed before sending';
}
renderQueue();

/* ================= 04 · brief ================= */
const BRIEF = {
  rel: [
    ['Class of ’94, Mechanical Engineering. Founder of a water-sensor firm in Gdańsk and Boston.', 'CRM · profile'],
    ['Married to Dr. Aiko Wieczorek, a ’96 alum who chairs the Engineering advisory board.', 'CRM · relationships'],
    ['Last visit: lunch with you on 12 June. He asked about the new water lab.', 'CRM · contact report'],
    ['Stage: cultivation. Next step agreed: tour of the lab this autumn.', 'CRM · opportunity']
  ],
  gift: [
    ['Giving every year for 14 years. Largest gift in FY24 to the Engineering scholarship.', 'Fabric data agent'],
    ['Employer match received each year since FY21.', 'Fabric data agent']
  ],
  eng: [
    ['Attended Reunion ’24 and two Boston alumni events.', 'Fabric data agent · events'],
    ['Mentors two engineering students through the alumni program.', 'Dataverse · mentoring'],
    ['Opened 6 of the last 8 Engineering newsletters.', 'Fabric data agent · engagement']
  ],
  care: [
    ['Prefers email, no phone calls. Phonathon: excluded.', 'CRM · preferences'],
    ['Do not mention the 2023 building naming; he declined and asked not to revisit it.', 'CRM · contact report'],
    ['Aiko is assigned to a different officer. Coordinate before any joint ask.', 'CRM · assignments']
  ]
};
const GIFTS = [['FY20', 2.5], ['FY21', 3], ['FY22', 3.5], ['FY23', 5], ['FY24', 12], ['FY25', 6.5]];
Object.keys(BRIEF).forEach(k => {
  const panel = $('bp-' + k);
  if (k === 'gift') {
    const fig = el('div', 'gift-chart');
    fig.setAttribute('role', 'img');
    fig.setAttribute('aria-label', 'Giving by fiscal year, thousands: ' + GIFTS.map(g => g[0] + ' ' + g[1]).join(', '));
    const max = Math.max(...GIFTS.map(g => g[1]));
    GIFTS.forEach(([fy, v]) => {
      const col = el('div');
      const bar = el('i');
      bar.style.height = Math.round(v / max * 100) + '%';
      col.appendChild(el('b', null, '$' + v + 'k'));
      col.appendChild(bar);
      col.appendChild(el('span', null, fy));
      fig.appendChild(col);
    });
    panel.appendChild(fig);
  }
  BRIEF[k].forEach(([text, src]) => {
    const row = el('div', 'brief-line' + (k === 'care' ? ' is-care' : ''));
    row.appendChild(el('p', null, text));
    row.appendChild(el('span', 'src', src));
    panel.appendChild(row);
  });
});
const tabs = Array.from(document.querySelectorAll('.brief-tabs [role=tab]'));
function selectTab(t, focus) {
  tabs.forEach(x => {
    const on = x === t;
    x.setAttribute('aria-selected', String(on));
    x.tabIndex = on ? 0 : -1;
    $(x.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) t.focus();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t, false));
  t.addEventListener('keydown', e => {
    const n = tabs.length;
    let j = null;
    if (e.key === 'ArrowRight') j = (i + 1) % n;
    else if (e.key === 'ArrowLeft') j = (i - 1 + n) % n;
    else if (e.key === 'Home') j = 0;
    else if (e.key === 'End') j = n - 1;
    if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
  });
});

const SCOPE = {
  hollis: [
    { from: 'you', who: 'HOLLIS', text: 'What has Tomasz given in the last five years, by fund?' },
    { from: 'sys', who: 'CONNECTED AGENT', text: 'Fabric data agent · signed in as Hollis · portfolio filter applied' },
    { from: 'ai', who: 'ADVANCEMENT AGENT', text: '$30,000 across FY21–FY25: Engineering scholarship $24,000, Annual fund $3,500, Water lab $2,500. Employer match included.', src: 'Fabric data agent · gifts' }
  ],
  renata: [
    { from: 'you', who: 'RENATA', text: 'What has Tomasz given in the last five years, by fund?' },
    { from: 'sys', who: 'CONNECTED AGENT', text: 'Fabric data agent · signed in as Renata · portfolio filter applied · 0 rows' },
    { from: 'ai', who: 'ADVANCEMENT AGENT', text: 'I can’t see giving for that donor. He isn’t in your portfolio. Hollis Grant is the assigned officer; Advancement Services can grant access if you need it.' }
  ]
};
pressGroup('[data-asker]', b => playThread($('scope-thread'), SCOPE[b.dataset.asker]));
playThread($('scope-thread'), SCOPE.hollis);

/* ================= 05 · outreach ================= */
const DRAFTS = {
  warm: `Dear Tomasz,

It was a pleasure to have lunch in June. You asked about the new water lab, and I'm glad to say the first student projects started there this term.

Would you and Aiko like to see it for yourselves? I could arrange a short tour with Professor Mbeki later this month or in early December, whichever suits you.

Warm regards,
Hollis`,
  brief: `Dear Tomasz,

Following our June lunch: the water lab is now open and the first student projects are underway. Would a short tour with Professor Mbeki later this month or in early December suit you?

Best,
Hollis`
};
const FACTS = [
  ['Lunch in June, asked about the water lab', 'CRM · contact report'],
  ['Agreed next step: a lab tour', 'CRM · opportunity'],
  ['Email allowed, no phone', 'CRM · preferences']
];
const facts = $('facts');
FACTS.forEach(([t, s]) => { const li = el('li', null, t); li.appendChild(el('span', 'src', s)); facts.appendChild(li); });
const draft = $('draft-text');
draft.value = DRAFTS.warm;
pressGroup('[data-tone]', b => { draft.value = DRAFTS[b.dataset.tone]; $('draft-status').textContent = 'New draft. Edit freely, nothing is saved yet.'; });
$('save-draft').addEventListener('click', () => {
  $('confirm-card').hidden = false;
  $('save-draft').disabled = true;
  $('confirm-yes').focus();
});
$('confirm-no').addEventListener('click', () => {
  $('confirm-card').hidden = true;
  $('save-draft').disabled = false;
  $('draft-status').textContent = 'Cancelled. Nothing was saved.';
  $('save-draft').focus();
});
$('confirm-yes').addEventListener('click', () => {
  $('confirm-card').hidden = true;
  $('save-draft').disabled = false;
  $('draft-status').textContent = 'Saved to Hollis’s Outlook Drafts. Not sent: Hollis reviews and sends it from Outlook.';
  $('save-draft').focus();
});
pressGroup('[data-out]', b => {
  const one = b.dataset.out === 'one';
  $('out-one').hidden = !one;
  $('out-event').hidden = one;
});

const FLOW = [
  ['Event ends', 'Boston Alumni Evening · attendance marked final', '212 attended', 'Trigger'],
  ['Check preferences', 'Do not contact, email and event preferences read from the CRM', '9 removed', 'Agent flow'],
  ['Split the list', 'Portfolio prospects go to their officer; everyone else gets the standard thank-you', '28 prospects · 175 standard', 'Agent flow'],
  ['Events lead approves', 'Reviews the thank-you text and the list before anything is sent', 'Approved', 'Person'],
  ['Thank-you sent', 'Standard message to 175 attendees', '175 sent', 'Cloud flow'],
  ['Officer drafts', 'A personal draft in each officer’s Outlook Drafts, with what the prospect did at the event', '28 drafts · officers send', 'Person']
];
const flowEl = $('flow');
function renderFlow() {
  flowEl.textContent = '';
  return FLOW.map(([t, d, n, who]) => {
    const li = el('li');
    li.appendChild(el('strong', null, t));
    li.appendChild(el('span', 'sub', d));
    li.appendChild(el('span', 'count', n));
    li.appendChild(el('span', 'who' + (who === 'Person' ? ' is-person' : ''), who));
    flowEl.appendChild(li);
    return li;
  });
}
let flowTimers = [];
$('event-play').addEventListener('click', () => {
  flowTimers.forEach(clearTimeout);
  flowTimers = [];
  const items = renderFlow();
  const btn = $('event-play');
  btn.disabled = true;
  $('flow-status').textContent = 'Running…';
  const finish = () => {
    btn.disabled = false;
    btn.textContent = '↻ Run it again';
    $('flow-status').textContent = '203 contacted, 9 respected opt-outs. Every send waited for a person.';
  };
  items.forEach((li, i) => {
    const on = () => { li.classList.add('is-on'); if (i === items.length - 1) finish(); };
    if (!STEP) on(); else flowTimers.push(setTimeout(on, STEP * (i + 1)));
  });
});
renderFlow();

/* ================= 06 · stack ================= */
const STACK = [
  { name: 'Alumni website agent', tag: 'Copilot Studio · website channel', detail: 'Public questions need no sign-in. Topics that touch a personal record ask the alum to sign in through the institution’s alumni identity provider (Authenticate manually · Generic OAuth 2). Can’t see officer notes, giving or portfolios.' },
  { name: 'Advancement agent', tag: 'Copilot Studio · Microsoft Teams', detail: 'Shared only with the advancement security group in Entra ID. Briefs, answers portfolio questions and drafts outreach. Never sends on its own.' },
  { name: 'Topics', tag: 'Guided steps', detail: 'Transcript hand-off to the Registrar, sign-in for personal changes, opt-out wording, escalation to a staff member.' },
  { name: 'Knowledge', tag: 'Public site · SharePoint', detail: 'Public alumni, events and giving pages as website knowledge (answers cite them). Internal stewardship guidance on SharePoint for the staff agent only.' },
  { name: 'CRM connectors', tag: 'Dataverse · Salesforce · Raiser’s Edge NXT', detail: 'Dynamics 365 through the Microsoft Dataverse connector (the separate Dynamics 365 connector is deprecated). Salesforce connector. Blackbaud publishes Raiser’s Edge NXT connectors. Other advancement CRMs: custom connector or MCP server. Tools run with end-user credentials where possible.' },
  { name: 'Fabric data agent', tag: 'Connected agent · preview', detail: 'Gift history and engagement from OneLake. User authentication plus row-level security in the source, so officers see only their portfolio. Validated only in Microsoft Teams.' },
  { name: 'Agent flows', tag: 'Power Automate', detail: 'Register, update contact, set preferences, open registrar request, save Outlook draft (Office 365 Outlook · Draft an email message), event follow-up with an approval step.' },
  { name: 'Dataverse', tag: 'Tables', detail: 'Mentor sign-ups, preference-change log, registrar hand-offs, if the CRM doesn’t hold them already.' },
  { name: 'Governance', tag: 'Entra ID · Purview · admin center', detail: 'Who can use each agent, DLP and environments in the Power Platform admin center, Microsoft Purview audit, Copilot Studio analytics.' }
];
const stackEl = $('stack-grid');
STACK.forEach((s, i) => {
  const b = el('button', 'stack-item');
  b.type = 'button';
  b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
  b.appendChild(el('strong', null, s.name));
  b.appendChild(el('span', null, s.tag));
  b.addEventListener('click', () => {
    stackEl.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    showStack(s);
  });
  stackEl.appendChild(b);
});
function showStack(s) {
  const d = $('stack-detail');
  d.textContent = '';
  d.appendChild(el('strong', null, s.name));
  d.appendChild(el('p', null, s.detail));
}
showStack(STACK[0]);

/* ================= 07 · outcome ================= */
const KPIS = [
  ['71%', 'of alumni requests resolved or routed in the first conversation'],
  ['Same day', 'opt-outs take effect across every flow'],
  ['10 min', 'to review a donor brief before a visit']
];
KPIS.forEach(([v, l]) => {
  const k = el('div', 'kpi');
  k.appendChild(el('strong', null, v));
  k.appendChild(el('span', null, l));
  $('kpis').appendChild(k);
});
function bars(id, rows) {
  const host = $(id);
  const max = Math.max(...rows.map(r => r[1]));
  rows.forEach(([label, v]) => {
    const r = el('div');
    r.appendChild(el('span', null, label));
    const i = el('i');
    i.style.width = Math.round(v / max * 100) + '%';
    r.appendChild(i);
    r.appendChild(el('b', null, String(v)));
    host.appendChild(r);
  });
}
bars('bars-requests', [['Answered from knowledge', 1840], ['Event registrations', 960], ['Contact updates', 610], ['Registrar hand-offs', 330], ['Mentor sign-ups', 140]]);
bars('bars-optouts', [['Fundraising appeals', 118], ['Phone', 64], ['Postal mail', 41], ['Do not contact', 12]]);

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
    let id = 'today';
    document.querySelectorAll('main section').forEach(s => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    $('section-jump').value = id;
  });
}, { passive: true });
