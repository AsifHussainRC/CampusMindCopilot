'use strict';
const $ = id => document.getElementById(id);
const announce = m => { $('live-region').textContent = m; };
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const BEAT = 850;

$('notes-on').addEventListener('change', e => {
  document.querySelectorAll('.pnote').forEach(p => { p.hidden = !e.target.checked; });
});
function make(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
/* Plays a table of steps one beat apart. With reduced motion, every step lands at once. */
function player(steps, apply, reset) {
  let timers = [];
  return () => {
    timers.forEach(clearTimeout);
    timers = [];
    reset();
    if (REDUCED) {
      steps.forEach(apply);
      return;
    }
    steps.forEach((s, i) => timers.push(setTimeout(() => apply(s, i), (i + 1) * BEAT)));
  };
}
function wire(svg, from, to, color) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', from[0]);
  line.setAttribute('y1', from[1]);
  line.setAttribute('x2', to[0]);
  line.setAttribute('y2', to[1]);
  if (color) line.style.stroke = color;
  svg.appendChild(line);
  return line;
}
function place(node, [x, y]) {
  node.style.setProperty('--x', x);
  node.style.setProperty('--y', y);
}
/* Chat text is an array of strings and one-item arrays; a one-item array is an @ token. */
function chatText(p, parts) {
  parts.forEach(part => p.append(Array.isArray(part) ? make('span', 'mention', part[0]) : part));
  return p;
}

/* ================= 01 · one campus ================= */
const OFFICES = [
  { name: 'Biology', how: 'Team chat plan', c: '#7b5bd6', apart: [33, 14, -4], together: [20, 15] },
  { name: 'Nursing', how: 'Paid on a personal card', c: '#e06a2c', apart: [75, 26, 3], together: [17, 66] },
  { name: 'Business', how: 'Separate pilot license', c: '#3f6fd8', apart: [36, 48, 1.5], together: [80, 15] },
  { name: 'Advising', how: 'Free tier', c: '#2e9e6b', apart: [73, 63, -2], together: [83, 66] },
  { name: 'Library', how: 'Browser add-on', c: '#c8423a', apart: [40, 86, 2], together: [50, 89] }
];
/* The pieces of the Microsoft stack that ring the hub once the offices connect. */
const STACK = ['Teams', 'M365 Copilot', 'SharePoint', 'Fabric', 'Power Automate', 'MCP', 'Entra ID'];
const HUB_AT = [50, 45];
const CONNECT = {
  apart: { heading: 'Every office bought its own AI.', button: 'Connect them', chip: '🔒 OWN LOGIN', tally: [`${OFFICES.length} contracts`, `${OFFICES.length} logins`, '0 audit trails'] },
  together: { heading: 'Your campus, connected.', button: 'Show before', chip: '✓ ENTRA ID', tally: ['1 tenant', '1 sign-in', '1 audit log'] }
};
OFFICES.forEach(o => {
  const card = make('div', 'office');
  card.style.setProperty('--c', o.c);
  ['ax', 'ay', 'ar'].forEach((k, i) => card.style.setProperty('--' + k, o.apart[i]));
  card.style.setProperty('--tx', o.together[0]);
  card.style.setProperty('--ty', o.together[1]);
  card.append(make('strong', '', o.name), make('span', 'office-how', o.how), make('span', 'office-chip'));
  $('office-stage').appendChild(card);
  wire($('office-wires'), HUB_AT, o.together);
});
STACK.forEach((name, i) => {
  const angle = (i / STACK.length) * 2 * Math.PI - Math.PI / 2;
  const dot = make('span', 'orbit-dot', name);
  dot.style.setProperty('--d', i);
  place(dot, [50 + 64 * Math.cos(angle), 50 + 60 * Math.sin(angle)]);
  $('office-hub').appendChild(dot);
});
function showCampus(state) {
  const s = CONNECT[state];
  $('office-stage').dataset.state = state;
  $('connect-heading').textContent = s.heading;
  $('connect-play').textContent = s.button;
  $('connect-play').setAttribute('aria-pressed', String(state === 'together'));
  document.querySelectorAll('.office-chip').forEach(c => { c.textContent = s.chip; });
  $('office-tally').textContent = '';
  s.tally.forEach(t => $('office-tally').appendChild(make('span', '', t)));
  $('office-tally').classList.toggle('is-one', state === 'together');
  return s;
}
$('connect-play').addEventListener('click', () => {
  const s = showCampus($('office-stage').dataset.state === 'apart' ? 'together' : 'apart');
  announce(s.heading + ' ' + s.tally.join(', ') + '.');
});
showCampus('apart');

/* ================= 02 · one box ================= */
/* Primary-model options in Copilot Studio, as documented on Microsoft Learn (November 2026). */
const MODELS = [
  { name: 'GPT Chat Latest', by: 'OpenAI · default', status: 'GA' },
  { name: 'Claude Sonnet 4.6', by: 'Anthropic · admin turns on', status: 'GA' },
  { name: 'Claude Opus 4.8', by: 'Anthropic · also 4.7, 4.6', status: 'GA' },
  { name: 'Mistral', by: 'Mistral AI · external', status: 'Preview' },
  { name: 'Grok 4.2', by: 'xAI · US early access', status: 'Experimental' },
  { name: 'Foundry models', by: 'Llama, DeepSeek · prompt tools', status: 'Prompts' }
];
/* The Agents tab lists whatever is added from the Agent Store below. */
const MARKET = [
  { name: 'Campus Copilot', by: 'Campus IT', letter: 'C', c: '#023347', model: 'GPT Chat Latest', on: true, fixed: true,
    starters: ['What is due for me this week?', 'Where do I find the parking permit form?'] },
  { name: 'Conference Guide', by: 'Teaching & Learning Center', letter: 'G', c: '#087985', model: 'Claude Sonnet 4.6', on: true,
    starters: ['Which AI teaching sessions are on Wednesday?', 'Who is speaking on student success?'] },
  { name: 'Financial Aid', by: 'Student Financial Services', letter: '$', c: '#2e9e6b', model: 'GPT Chat Latest',
    starters: ['What is my aid status?', 'When is the next disbursement date?'] },
  { name: 'IT Help', by: 'Campus IT', letter: 'IT', c: '#3f6fd8', model: 'GPT Chat Latest',
    starters: ['Reset my MFA device', 'Wi-Fi is not connecting in the library'] },
  { name: 'Library', by: 'University Library', letter: 'L', c: '#c8423a', model: 'Claude Opus 4.8',
    starters: ['Find peer-reviewed sources on retention', 'Book a study room for Friday'] }
];
let tab = 'Agents';
let current = MARKET[0];
let draft = null;
const agentsOn = () => MARKET.filter(a => a.on);
const TABS = {
  Agents: {
    head: () => 'TYPE @ · ADDED FROM THE AGENT STORE',
    rows: () => agentsOn().map(a => ({ kind: 'agent', agent: a, letter: a.letter, c: a.c, name: a.name, sub: 'by ' + a.by, model: a.model }))
  },
  Models: {
    head: () => 'MAKER SETTING FOR @' + current.name.toUpperCase(),
    grid: true,
    note: 'People don’t switch models in chat. The agent’s maker picks one in Copilot Studio.',
    rows: () => MODELS.map(m => ({ kind: 'model', letter: m.name[0], c: '#566570', name: m.name, sub: m.by, status: m.status }))
  },
  Starters: {
    head: () => 'CONVERSATION STARTERS · @' + current.name.toUpperCase(),
    rows: () => current.starters.map(s => ({ kind: 'starter', letter: '›', c: '#a67312', name: s, sub: 'Set by the maker on the agent' }))
  }
};
function isPressed(r) {
  if (r.kind === 'agent') return r.agent === current;
  if (r.kind === 'model') return r.name === current.model;
  return r.name === draft;
}
function pickRow(r) {
  const b = make('button', 'pick');
  b.type = 'button';
  b.setAttribute('aria-pressed', String(isPressed(r)));
  const name = make('span', 'pick-name', r.name);
  name.appendChild(make('small', '', r.sub));
  const icon = make('span', 'pick-letter', r.letter);
  icon.style.setProperty('--c', r.c);
  b.append(icon, name);
  if (r.model) b.appendChild(make('span', 'pick-model', r.model));
  if (r.status) b.appendChild(make('span', 'pick-status' + (r.status === 'GA' ? '' : ' is-preview'), r.status));
  b.addEventListener('click', () => {
    let msg;
    if (r.kind === 'agent') {
      current = r.agent;
      draft = null;
      msg = '@' + current.name + ' will answer, running on ' + current.model + '.';
    } else if (r.kind === 'model') {
      current.model = r.name;
      msg = 'Maker setting: ' + current.name + ' now runs on ' + r.name + '.';
    } else {
      draft = r.name;
      msg = 'Starter added to the message.';
    }
    renderBox();
    renderMarket();
    const on = $('picker-list').querySelector('[aria-pressed=true]');
    if (on) on.focus();
    announce(msg);
  });
  return b;
}
function renderBox() {
  const t = TABS[tab];
  $('picker-tabs').querySelectorAll('[role=tab]').forEach(b => {
    const on = b.dataset.tab === tab;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  $('picker-list').setAttribute('aria-labelledby', 'tab-' + tab);
  $('picker-head').textContent = t.head();
  $('picker-list').classList.toggle('is-grid', !!t.grid);
  $('picker-list').textContent = '';
  t.rows().forEach(r => $('picker-list').appendChild(pickRow(r)));
  if (t.note) $('picker-list').appendChild(make('p', 'pick-note', t.note));
  $('answering').textContent = current.name;
  $('answering-model').textContent = current.model;
  $('composer-model').textContent = '@' + current.name;
  const text = $('composer-text');
  text.textContent = '';
  if (draft) chatText(text, [['@' + current.name], ' ' + draft]);
  else text.appendChild(make('span', 'placeholder', 'Message Copilot. Type @ to bring in an agent.'));
}
Object.keys(TABS).forEach(name => {
  const b = make('button', '', name);
  b.type = 'button';
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-controls', 'picker-list');
  b.dataset.tab = name;
  b.id = 'tab-' + name;
  b.addEventListener('click', () => { tab = name; renderBox(); });
  $('picker-tabs').appendChild(b);
});
$('picker-tabs').addEventListener('keydown', e => {
  const names = Object.keys(TABS);
  const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
  if (!step) return;
  tab = names[(names.indexOf(tab) + step + names.length) % names.length];
  renderBox();
  $('picker-tabs').querySelector('[aria-selected=true]').focus();
});

/* ================= 03 · agent store ================= */
const stalls = [];
function renderMarket() {
  stalls.forEach(s => s());
  $('my-agents').textContent = '';
  agentsOn().forEach(a => $('my-agents').appendChild(make('span', 'gchip is-agent', '@' + a.name)));
}
MARKET.filter(a => !a.fixed).forEach(a => {
  const card = make('div', 'stall');
  const icon = card.appendChild(make('span', 'pick-letter', a.letter));
  icon.style.setProperty('--c', a.c);
  card.append(make('strong', '', a.name), make('span', 'stall-by', 'by ' + a.by));
  const btn = card.appendChild(make('button', 'add'));
  btn.type = 'button';
  stalls.push(() => {
    btn.textContent = a.on ? 'Added' : 'Add';
    btn.appendChild(make('span', 'sr-only', ' ' + a.name));
    btn.setAttribute('aria-pressed', String(!!a.on));
    card.classList.toggle('is-on', !!a.on);
  });
  btn.addEventListener('click', () => {
    a.on = !a.on;
    if (!a.on && current === a) { current = MARKET[0]; draft = null; }
    renderMarket();
    renderBox();
    announce(a.name + (a.on ? ' added. It now shows under @ in your chat.' : ' removed from your chat.'));
  });
  $('market-grid').appendChild(card);
});
renderMarket();
renderBox();

/* ================= 04 · ask the conference ================= */
const ANSWER = {
  q: 'Which AI teaching sessions are on Wednesday?',
  lead: 'Three on Wednesday, September 30.',
  sources: [
    { kind: 'MCP server', name: 'Session schedule' },
    { kind: 'SharePoint', name: 'Speaker bios' },
    { kind: 'Agent flow', name: 'Room lookup' },
    { kind: 'Public website', name: 'Conference site', live: true }
  ],
  sessions: [
    { at: '10:00', title: 'AI tutors in intro physics', who: 'J. Abernathy · Harbor State University', room: 'Hall B' },
    { at: '13:30', title: 'Feedback at scale, with guardrails', who: 'L. Fontaine · Ridgeway College', room: 'Room 204' },
    { at: '15:30', title: 'Faculty prompts that work', who: 'K. Osei · Maple Valley University', room: 'Hall B' }
  ]
};
$('answer-q').textContent = ANSWER.q;
ANSWER.sources.forEach(s => {
  const chip = make('span', 'source');
  chip.append(make('em', '', s.kind), s.name);
  if (s.live) chip.appendChild(make('i', 'live-dot'));
  $('answer-sources').appendChild(chip);
});
ANSWER.sessions.forEach(s => {
  const li = make('li', 'slot');
  const what = make('span');
  what.append(make('b', '', s.title), make('small', '', s.who));
  li.append(make('time', '', s.at), what, make('span', 'slot-room', s.room));
  $('answer-agenda').appendChild(li);
});
const ANSWER_STEPS = [
  ...ANSWER.sources.map((s, i) => ['.source', i]),
  ...ANSWER.sessions.map((s, i) => ['.slot', i])
];
const playAnswer = player(ANSWER_STEPS, ([sel, i]) => {
  $('answer-app').querySelectorAll(sel)[i].classList.add(sel === '.source' ? 'is-lit' : 'is-in');
  if (sel === '.slot' && i === 0) $('answer-lead').textContent = ANSWER.lead;
  if (sel === '.slot' && i === ANSWER.sessions.length - 1) announce(ANSWER.lead + ' Sources: ' + ANSWER.sources.map(s => s.name).join(', ') + '.');
}, () => {
  $('answer-app').querySelectorAll('.is-lit,.is-in').forEach(n => n.classList.remove('is-lit', 'is-in'));
  $('answer-lead').textContent = '';
});
$('answer-play').addEventListener('click', playAnswer);

/* ================= 05 · group chat ================= */
const PEOPLE = {
  Dana: { letter: 'D', c: '#023347' },
  Marcus: { letter: 'M', c: '#7b5bd6' },
  'Conference Guide': { letter: 'G', c: '#087985' }
};
const TURNS = [
  { kind: 'person', who: 'Dana', how: ['@ agent'], text: [['@Conference Guide'], ' which AI sessions are on Wednesday?'] },
  { kind: 'agent', who: 'Conference Guide', text: ['Three. 10:00 and 15:30 in Hall B, 13:30 in Room 204.'] },
  { kind: 'event', text: 'Dana added Marcus to the chat', joins: 'Marcus' },
  { kind: 'person', who: 'Marcus', how: ['@ agent'], text: [['@Conference Guide'], ' which one suits faculty new to AI?'] },
  { kind: 'agent', who: 'Conference Guide', text: ['Faculty prompts that work, 15:30 in Hall B.'] },
  { kind: 'person', who: 'Marcus', quiet: true, how: ['no @ · agent not sent this'], text: ['Let’s go to that one together.'] },
  { kind: 'person', who: 'Dana', how: ['@ agent', 'agent flow'], text: [['@Conference Guide'], ' put the 15:30 session on both our calendars'] },
  { kind: 'agent', who: 'Conference Guide', text: ['Done. Invites sent to Dana and Marcus.'], file: 'Faculty prompts that work · Wed 15:30 · Hall B' }
];
function avatar(name) {
  const a = make('i', 'avatar', PEOPLE[name].letter);
  a.style.background = PEOPLE[name].c;
  a.title = name;
  return a;
}
function turnRow(t) {
  if (t.kind === 'event') {
    const li = make('li', 'event');
    li.appendChild(make('span', '', t.text));
    return li;
  }
  const li = make('li', 'msg is-' + t.kind + (t.quiet ? ' is-quiet' : ''));
  const body = make('div');
  const who = make('span', 'msg-who');
  who.appendChild(make('b', '', t.who));
  (t.how || []).forEach(h => who.appendChild(make('span', 'how' + (t.quiet ? ' is-quiet' : ''), h)));
  body.append(who, chatText(make('p', 'msg-text'), t.text));
  if (t.file) body.appendChild(make('span', 'file', t.file));
  li.append(avatar(t.who), body);
  return li;
}
const playTogether = player(TURNS, t => {
  $('thread').appendChild(turnRow(t));
  if (t.joins) $('room-people').appendChild(avatar(t.joins));
  announce(t.kind === 'event' ? t.text : t.who + ': ' + t.text.map(p => Array.isArray(p) ? p[0] : p).join(''));
}, () => {
  $('thread').textContent = '';
  $('room-people').textContent = '';
  $('room-people').append(avatar('Dana'), avatar('Conference Guide'));
});
$('together-play').addEventListener('click', playTogether);

/* ================= 06 · agents calling agents ================= */
const ORCH = {
  ask: 'Plan my Wednesday around the AI sessions.',
  hub: [50, 24],
  agents: [
    { name: 'Conference Guide', kind: 'connected agent', job: 'which sessions', c: '#087985', at: [17, 74] },
    { name: 'Schedule helper', kind: 'child agent', job: 'when you are free', c: '#a67312', at: [50, 82] },
    { name: 'Campus Facilities', kind: 'Fabric data agent', job: 'how far to walk', c: '#6f4bd8', at: [83, 74] }
  ],
  /* Each line of the plan is keyed to the agent that supplied it. */
  plan: [
    { at: '10:00', what: 'AI tutors in intro physics · Hall B', from: 0 },
    { at: '12:00', what: 'Lunch · your Outlook calendar is clear', from: 1 },
    { at: '13:20', what: 'Walk to Room 204 · 6 min', from: 2 },
    { at: '13:30', what: 'Feedback at scale, with guardrails · Room 204', from: 0 }
  ]
};
$('orch-ask').textContent = ORCH.ask;
const orchParts = ORCH.agents.map(a => {
  const node = make('div', 'node');
  node.style.setProperty('--c', a.c);
  place(node, a.at);
  node.append(make('span', 'node-kind', a.kind), make('b', '', a.name), make('small', '', a.job));
  $('orch-stage').appendChild(node);
  return { node, line: wire($('orch-wires'), ORCH.hub, a.at, a.c) };
});
ORCH.plan.forEach(p => {
  const li = make('li');
  li.dataset.from = p.from;
  const dot = li.appendChild(make('i'));
  dot.style.setProperty('--c', ORCH.agents[p.from].c);
  li.append(make('time', '', p.at), make('span', '', p.what));
  $('orch-plan').appendChild(li);
});
const ORCH_STEPS = [-1, ...ORCH.agents.map((a, i) => i)];
const playOrch = player(ORCH_STEPS, i => {
  if (i < 0) {
    $('orch-hub').classList.add('is-lit');
    return;
  }
  orchParts[i].node.classList.add('is-lit');
  orchParts[i].line.classList.add('is-lit');
  $('orch-plan').querySelectorAll(`[data-from="${i}"]`).forEach(n => n.classList.add('is-in'));
  if (i === ORCH.agents.length - 1) announce('One plan from three agents.');
}, () => {
  $('orchestrate').querySelectorAll('.is-lit,.is-in').forEach(n => n.classList.remove('is-lit', 'is-in'));
});
$('orch-play').addEventListener('click', playOrch);

/* ================= 07 · on your website ================= */
const SITES = {
  public: {
    url: 'harborstate.edu/summit', badge: 'No sign-in', signin: false,
    you: 'Which sessions cover AI in teaching?',
    agent: 'Three on Wednesday. 10:00 and 15:30 in Hall B, 13:30 in Room 204.',
    src: 'Public website knowledge only',
    say: 'Public page: anyone can chat, and the agent uses public sources only.'
  },
  staff: {
    url: 'harborstate.sharepoint.com/sites/summit-staff', badge: 'Entra ID', signin: true,
    you: 'What is in the speaker briefing for 13:30?',
    agent: 'L. Fontaine needs a lapel mic and arrives at 12:45. Room 204 seats 60.',
    src: 'SharePoint knowledge · your permissions',
    say: 'Staff page: people sign in with Entra ID, so SharePoint knowledge is available.'
  }
};
function showSite(key) {
  const s = SITES[key];
  document.querySelectorAll('[data-auth]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.auth === key)));
  $('site-url').textContent = s.url;
  $('widget-badge').textContent = s.badge;
  $('widget-badge').classList.toggle('is-staff', key === 'staff');
  $('widget-signin').hidden = !s.signin;
  $('widget-you').textContent = s.you;
  $('widget-agent').textContent = s.agent;
  $('widget-src').textContent = s.src;
  return s;
}
document.querySelectorAll('[data-auth]').forEach(b => b.addEventListener('click', () => announce(showSite(b.dataset.auth).say)));
showSite('public');

/* ================= 08 · build it ================= */
const STEPS = [
  { title: 'Create the agent in Copilot Studio', how: 'Describe it in plain language. Keep GPT Chat Latest, or pick another model on the Overview page.' },
  { title: 'Add knowledge', how: 'The conference’s public website, plus a SharePoint library of speaker bios.' },
  { title: 'Add tools', how: 'An MCP server for the session schedule, and an agent flow that sends Outlook invites.' },
  { title: 'Connect other agents', how: 'A Fabric data agent over the facilities lakehouse, for walking times.', tag: 'Preview' },
  { title: 'Test it', how: 'Paste the questions below into the Test pane and check which sources answer.' },
  { title: 'Publish to Teams and Microsoft 365 Copilot', how: 'Turn on group and meeting chats, then submit it for admin approval to the Agent Store.' },
  { title: 'Add it to your website', how: 'Custom website channel. Choose No authentication or Entra ID sign-in.' }
];
const done = new Set();
function renderBuild() {
  $('build-count').textContent = `${done.size} of ${STEPS.length}`;
  $('build-fill').style.width = (done.size / STEPS.length * 100) + '%';
  $('build-done').textContent = done.size === STEPS.length ? '✓ Built. Now ask it something hard.' : '';
}
STEPS.forEach((s, i) => {
  const li = make('li');
  const b = make('button', 'build-step');
  b.type = 'button';
  b.setAttribute('aria-pressed', 'false');
  const text = make('span');
  const title = make('b', '', s.title);
  if (s.tag) title.appendChild(make('span', 'tag', s.tag));
  text.append(title, make('small', '', s.how));
  b.append(make('span', 'tick'), text);
  b.addEventListener('click', () => {
    if (done.has(i)) done.delete(i); else done.add(i);
    b.setAttribute('aria-pressed', String(done.has(i)));
    renderBuild();
    announce(`${s.title}: ${done.has(i) ? 'done' : 'not done'}. ${done.size} of ${STEPS.length} steps.`);
  });
  li.appendChild(b);
  $('build-list').appendChild(li);
});
$('build-list').after(make('p', 'build-done'));
document.querySelector('.build-done').id = 'build-done';
renderBuild();

const QUESTIONS = [
  'What happens on each day of the conference?',
  'Which sessions on Wednesday, September 30 cover AI in teaching and learning?',
  'Who is presenting on student success, and from which institution?',
  'Build me a one-day agenda around cybersecurity sessions, with walking times.'
];
QUESTIONS.forEach(q => {
  const li = document.createElement('li');
  const copy = make('button', 'try-copy', 'Copy');
  copy.type = 'button';
  copy.setAttribute('aria-label', 'Copy: ' + q);
  li.append(make('span', '', q), copy);
  $('try-list').appendChild(li);
});
/* Copy a question so it can be pasted straight into the Copilot Studio Test pane. */
function fallbackCopy(text) {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch (error) {
    return false;
  }
}
document.addEventListener('click', event => {
  const button = event.target.closest('.try-copy');
  if (!button) return;
  const text = button.closest('li').querySelector('span').textContent.trim();
  const ok = () => {
    button.textContent = 'Copied';
    button.setAttribute('data-done', '');
    announce('Question copied.');
    setTimeout(() => {
      button.textContent = 'Copy';
      button.removeAttribute('data-done');
    }, 1600);
  };
  const fail = () => {
    button.textContent = 'Select it';
    setTimeout(() => { button.textContent = 'Copy'; }, 2200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(ok, () => { if (fallbackCopy(text)) ok(); else fail(); });
  } else if (fallbackCopy(text)) {
    ok();
  } else {
    fail();
  }
});

/* ================= scene entrances ================= */
/* A scene plays its animation the first time it scrolls into view. */
const ON_ENTER = { answer: playAnswer, together: playTogether, orchestrate: playOrch };
if (!REDUCED) document.documentElement.classList.add('js-motion');
const seen = new IntersectionObserver(entries => entries.forEach(e => {
  if (!e.isIntersecting) return;
  e.target.classList.add('is-in');
  seen.unobserve(e.target);
  if (ON_ENTER[e.target.id]) ON_ENTER[e.target.id]();
}), { threshold: 0.3 });
document.querySelectorAll('.scene').forEach(s => seen.observe(s));

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
    let id = 'connect';
    document.querySelectorAll('main section').forEach(s => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    $('section-jump').value = id;
  });
}, { passive: true });
