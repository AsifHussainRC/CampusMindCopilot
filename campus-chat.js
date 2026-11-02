'use strict';
const $ = id => document.getElementById(id);
const announce = m => { $('live-region').textContent = m; };
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pause = REDUCED ? 2200 : 1100;

/* Teams deep link to the published agent (Copilot Studio → Channels → Teams → "Copy link").
   Leave empty until the agent is published; the button then explains how to get it. */
const AGENT_URL = '';

/* ================= presenter notes ================= */
$('notes-on').addEventListener('change', e => {
  document.querySelectorAll('.pnote').forEach(p => { p.hidden = !e.target.checked; });
});
function pressGroup(selector, onPick) {
  document.querySelectorAll(selector).forEach(b => b.addEventListener('click', () => {
    document.querySelectorAll(selector).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    onPick(b);
  }));
}
function buildDots(node, total) {
  node.textContent = '';
  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) frag.appendChild(document.createElement('span'));
  node.appendChild(frag);
  return [...node.children];
}

/* ================= 01 · everyone, or nobody ================= */
const POPULATION = 1000;
/* Illustrative: roughly what share of a campus would buy a $20/month AI seat themselves. */
const SELF_FUNDED = 0.11;
const accessCells = buildDots($('access-dots'), POPULATION);

function showAccess(kind) {
  const covered = kind === 'site' ? POPULATION : Math.round(POPULATION * SELF_FUNDED);
  accessCells.forEach((c, i) => { c.className = i < covered ? 'd-on' : 'd-off'; });
  $('access-covered').textContent = covered.toLocaleString();
  $('access-left').textContent = (POPULATION - covered).toLocaleString();
  $('access-left-label').textContent = kind === 'site' ? 'left out' : 'priced out';
  $('access-note').textContent = kind === 'site'
    ? 'One agent in Teams, billed to the institution. Every student, every member of staff, the same tools.'
    : 'Access tracks who can spend $20 a month. That is not a policy anyone chose.';
  $('access-alt').textContent = `${covered} of ${POPULATION} people have access.`;
  announce($('access-note').textContent);
}
pressGroup('[data-access]', b => showAccess(b.dataset.access));
showAccess('individual');

/* ================= 02 · every model ================= */
/* Copilot Studio model choice: the agent's main model (OpenAI default, Anthropic if an admin allows it),
   plus Azure AI Foundry models in prompt tools ("bring your own model"). */
const MODELS = [
  { name: 'GPT', house: 'OpenAI · default model' },
  { name: 'Claude Sonnet', house: 'Anthropic · admin-enabled' },
  { name: 'Claude Opus', house: 'Anthropic · admin-enabled' },
  { name: 'Llama', house: 'Meta · via Azure AI Foundry' },
  { name: 'Mistral', house: 'Mistral · via Azure AI Foundry' },
  { name: 'DeepSeek', house: 'DeepSeek · via Azure AI Foundry' },
  { name: 'Phi', house: 'Microsoft · via Azure AI Foundry' },
  { name: 'and the next one', house: 'deployed, not renegotiated' }
];
$('model-wall').innerHTML = MODELS.map((m, i) =>
  `<div class="model${i === MODELS.length - 1 ? ' is-next' : ''}"><strong>${m.name}</strong><span>${m.house}</span></div>`
).join('');

/* ================= shared thread rendering ================= */
function bubble(msg) {
  const el = document.createElement('div');
  el.className = 'msg is-' + msg.from;
  const who = msg.from === 'ai' ? msg.model : msg.who;
  el.innerHTML = `<span class="msg-who"></span><p class="msg-body"></p>`;
  el.querySelector('.msg-who').textContent = who;
  el.querySelector('.msg-body').textContent = msg.text;
  if (msg.from === 'ai') el.querySelector('.msg-who').classList.add('is-model');
  if (msg.from === 'sys') el.querySelector('.msg-who').classList.add('is-sys');
  return el;
}
function playThread(node, messages, done) {
  node.innerHTML = '';
  const run = node.dataset.run = String(Number(node.dataset.run || 0) + 1);
  let i = 0;
  const step = () => {
    if (node.dataset.run !== run) return; /* a newer play started; stop this one */
    node.appendChild(bubble(messages[i]));
    announce(messages[i].text);
    i++;
    if (i < messages.length) setTimeout(step, pause);
    else if (done) done();
  };
  step();
}

/* ================= 03 · right model, same thread ================= */
const SWITCH_THREAD = [
  { from: 'you', who: 'You', text: 'Write a 500-word essay about the weather in Chicago.' },
  { from: 'ai', model: 'Campus Copilot · GPT', text: 'Chicago has a humid continental climate with four distinct seasons…' },
  { from: 'you', who: 'You', text: 'Tighten this and check the temperature claims.' },
  { from: 'sys', who: 'Orchestrator', text: 'Routing to Editor agent (connected agent · Claude). Conversation history passed along.' },
  { from: 'ai', model: 'Editor agent · Claude', text: 'Trimmed to 380 words. Two figures were off — spring highs are upper 50s, not upper 60s.' },
  { from: 'you', who: 'You', text: 'Give me a two-line summary for the newsletter.' },
  { from: 'ai', model: 'Summary prompt · Foundry model', text: 'Chicago swings from icy winters to humid summers. Spring and autumn are short, mild and changeable.' }
];
$('switch-play').addEventListener('click', () => {
  const b = $('switch-play');
  b.disabled = true;
  b.textContent = 'Playing…';
  playThread($('switch-thread'), SWITCH_THREAD, () => {
    b.disabled = false;
    b.textContent = '▶ Play it again';
    $('switch-note').textContent = 'Three models, one thread. Each step could read everything said before it.';
  });
});
playThread($('switch-thread'), SWITCH_THREAD.slice(0, 2));

/* ================= 04 · bring people in ================= */
const PEOPLE = [
  { initials: 'LO', name: 'Lena Ortiz', tag: 'OWNER' },
  { initials: 'SP', name: 'Sam Patel', tag: '' },
  { initials: 'CC', name: 'Campus Copilot', tag: 'AGENT' }
];
const ROOM_THREAD = [
  { from: 'you', who: 'Lena Ortiz', text: 'Drafting the weather article — join me.' },
  { from: 'you', who: 'Sam Patel', text: '@Campus Copilot what are the seasonal averages?' },
  { from: 'ai', model: 'Campus Copilot', text: 'Spring 45–58°F, summer 70–84°F, autumn 48–65°F, winter 20–34°F.' }
];
function renderRoom(n) {
  $('room-people').innerHTML = PEOPLE.slice(0, n).map(p =>
    `<span class="person"><i>${p.initials}</i>${p.name}${p.tag ? `<b>${p.tag}</b>` : ''}</span>`
  ).join('');
  const humans = PEOPLE.slice(0, n).filter(p => p.tag !== 'AGENT').length;
  $('room-count').textContent = humans === 1 ? '1 participant' : `${humans} people + agent`;
  $('room').classList.toggle('is-shared', humans > 1);
}
$('invite-play').addEventListener('click', () => {
  const b = $('invite-play');
  b.disabled = true;
  b.textContent = 'Inviting…';
  renderRoom(3);
  announce('Sam Patel joined the chat.');
  playThread($('room-thread'), ROOM_THREAD, () => {
    b.disabled = false;
    b.textContent = '▶ Play it again';
  });
});
/* Start with the owner and the agent already in the chat. */
function renderSolo() {
  $('room-people').innerHTML = [PEOPLE[0], PEOPLE[2]].map(p =>
    `<span class="person"><i>${p.initials}</i>${p.name}${p.tag ? `<b>${p.tag}</b>` : ''}</span>`
  ).join('');
  $('room-count').textContent = '1 participant';
  $('room').classList.remove('is-shared');
}
renderSolo();
playThread($('room-thread'), ROOM_THREAD.slice(0, 1));

/* ================= 05 · message mode ================= */
const PEOPLE_TALK = [
  { from: 'you', who: 'Lena Ortiz', text: 'Before we ask it — do we want the essay or the data table?' },
  { from: 'you', who: 'Sam Patel', text: 'Table. The essay reads like filler.' },
  { from: 'you', who: 'Lena Ortiz', text: 'Agreed. Table it is.' }
];
const MODE_THREAD = {
  human: PEOPLE_TALK,
  ai: [
    ...PEOPLE_TALK,
    { from: 'you', who: 'Lena Ortiz', text: '@Campus Copilot go ahead.' },
    { from: 'sys', who: 'Agent flow', text: 'Read the last 20 chat messages through Microsoft Graph and passed them to the agent.' },
    { from: 'ai', model: 'Campus Copilot', text: 'Understood — a table, not an essay. Here are the seasonal averages you agreed on…' }
  ]
};
function showMode(kind) {
  const node = $('mode-thread');
  node.innerHTML = '';
  MODE_THREAD[kind].forEach(m => node.appendChild(bubble(m)));
  node.classList.toggle('is-quiet', kind === 'human');
  $('mode-note').textContent = kind === 'human'
    ? 'No @mention, no agent. Three people talking, and the chat history is kept for later.'
    : 'When it is @mentioned, it reads the recent chat history and answers from what was decided.';
  announce($('mode-note').textContent);
}
pressGroup('[data-mode]', b => showMode(b.dataset.mode));
showMode('ai');

/* ================= 06 · one place ================= */
const TOOLS = [
  ['Web search', 'current information, cited'],
  ['Campus data', 'Fabric data agent · enrolment, retention, finance'],
  ['LMS & SIS', 'MCP servers · courses, grades, schedules'],
  ['Policies & handbooks', 'SharePoint knowledge, cited'],
  ['File upload', 'PDFs, slides, spreadsheets'],
  ['Code interpreter', 'runs Python on the data, no guessing'],
  ['Guided topics', 'help shaping the question'],
  ['Get things done', 'Power Automate · book, request, email the thread']
];
$('tool-grid').innerHTML = TOOLS.map(([t, s]) => `<div class="tool"><strong>${t}</strong><span>${s}</span></div>`).join('');
$('msg-actions').innerHTML = ['Copy', 'Citations', 'Thumbs up / down', 'Start over'].map(a => `<span class="gchip">${a}</span>`).join('');

/* ================= 07 · how it's built ================= */
const STACK = [
  { layer: 'Where people chat', items: ['Microsoft Teams · 1:1, group chats, channels', 'Campus website (optional)'] },
  { layer: 'Copilot Studio agent', items: ['Generative orchestration', 'Model: GPT or Claude', 'Instructions & guardrails'] },
  { layer: 'Topics', items: ['Guided questions & adaptive cards', 'Escalate to a person', 'Start over, feedback'] },
  { layer: 'Connected agents', items: ['Fabric data agent · OneLake, warehouse, semantic models', 'Specialist agents · Editor, Advising'] },
  { layer: 'Tools', items: ['MCP servers · LMS, SIS, ITSM', 'Connectors', 'Agent flows · Power Automate'] },
  { layer: 'Knowledge', items: ['SharePoint & OneDrive', 'Public websites', 'Uploaded files'] },
  { layer: 'Governance', items: ['Entra ID sign-in', 'Purview & DLP', 'Power Platform admin center'] }
];
$('stack-diagram').innerHTML = STACK.map(s =>
  `<div class="stack-row"><strong>${s.layer}</strong><div class="chip-row">${s.items.map(x => `<span class="gchip">${x}</span>`).join('')}</div></div>`
).join('');

/* ================= 08 · see it live ================= */
if (AGENT_URL) {
  $('agent-link').href = AGENT_URL;
} else {
  const a = $('agent-link');
  a.removeAttribute('target');
  a.href = '#live';
  a.title = 'Publish the agent to Teams, then paste its link into AGENT_URL in campus-chat.js';
}

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
    let id = 'everyone';
    document.querySelectorAll('main section').forEach(s => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    $('section-jump').value = id;
  });
}, { passive: true });
