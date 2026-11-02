'use strict';
const $ = id => document.getElementById(id);
const announce = m => { $('live').textContent = m; };
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const cr = n => Math.round(n).toLocaleString('en-US');
const credits = n => cr(n) + ' credits';

/* ================= presenter notes ================= */
$('notes-on').addEventListener('change', e => {
  document.querySelectorAll('.pnote').forEach(p => { p.hidden = !e.target.checked; });
});

function chips(host, items, onPick, startIndex) {
  items.forEach((item, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = item.label;
    b.setAttribute('aria-pressed', String(i === (startIndex || 0)));
    b.addEventListener('click', () => {
      [...host.children].forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
      onPick(item, i);
    });
    host.appendChild(b);
  });
}
function buildDots(node, total) {
  node.textContent = '';
  const frag = document.createDocumentFragment();
  for (let i = 0; i < total; i++) frag.appendChild(document.createElement('span'));
  node.appendChild(frag);
  return [...node.children];
}

/* ================= 01 · the runaway bill ================= */
const SEATS = 600;
const PREPAID = 200000;          // illustrative monthly prepaid Copilot Credits
const ENFORCE = PREPAID * 1.25;  // tenant enforcement threshold (125%)
const burnCells = buildDots($('burn-dots'), SEATS);
let burnTimer = null;

function resetBurn() {
  if (burnTimer) clearTimeout(burnTimer);
  burnCells.forEach(c => { c.className = 'd-normal'; });
  $('burn-fill').style.width = '0%';
  $('burn-fill').classList.remove('is-over');
  $('burn-cap').hidden = true;
  $('burn-spend').textContent = '0';
  $('burn-top').textContent = '0%';
  $('burn-caption').textContent = '';
  $('burn-alt').textContent = `${SEATS} people and automations using campus agents, nothing used yet.`;
}
const BURN_STEPS = [
  { spend: 46000, heavy: 0, runaway: 0, text: 'Week one. Normal use across 600 people and a few automations.' },
  { spend: 94000, heavy: 18, runaway: 0, text: 'Week two. A research agent moves to a reasoning model. Its long turns cost more.' },
  { spend: 158000, heavy: 18, runaway: 3, text: 'Week three. One event-triggered agent starts re-firing on its own output.' },
  { spend: 250000, heavy: 18, runaway: 3, text: 'Week four. The tenant passes 125% of prepaid capacity. Every agent drawing on the pool stops answering.' }
];
function playBurn() {
  resetBurn();
  const btn = $('burn-play');
  btn.disabled = true;
  btn.textContent = 'Running…';
  let i = 0;
  const step = () => {
    const s = BURN_STEPS[i];
    burnCells.forEach((c, n) => {
      c.className = n < s.runaway ? 'd-runaway' : n < s.runaway + s.heavy ? 'd-heavy' : 'd-normal';
    });
    const pct = Math.min(100, (s.spend / ENFORCE) * 100);
    $('burn-fill').style.width = pct + '%';
    $('burn-fill').classList.toggle('is-over', s.spend > PREPAID);
    $('burn-spend').textContent = cr(s.spend);
    const topShare = s.runaway ? Math.round(((s.spend - 94000) / s.spend) * 100) : 0;
    $('burn-top').textContent = topShare + '%';
    $('burn-caption').textContent = s.text;
    $('burn-alt').textContent = `${credits(s.spend)} used against ${credits(PREPAID)} prepaid. ${topShare}% of it from one looping agent.`;
    announce(s.text);
    i++;
    if (i < BURN_STEPS.length) {
      burnTimer = setTimeout(step, REDUCED ? 2600 : 1500);
    } else {
      $('burn-cap').hidden = false;
      burnTimer = setTimeout(() => {
        $('burn-caption').textContent = 'A monthly limit with hard stop on that one agent would have switched it off on day nine. Nothing else would have noticed.';
        announce($('burn-caption').textContent);
        btn.disabled = false;
        btn.textContent = '▶ Run it again';
      }, REDUCED ? 2600 : 1600);
    }
  };
  step();
}
$('burn-play').addEventListener('click', playBurn);
resetBurn();

/* ================= 02 · where the cap sits ================= */
const SCOPES = [
  { key: 'tenant', label: 'Tenant', caption: 'Prepaid Copilot Credits are pooled across the tenant. Past 125%, agents drawing on the pool are blocked. That protects the invoice, not the agents.' },
  { key: 'environment', label: 'Environment', caption: 'Allocate credits to each environment, such as Admissions or Research. An environment with credits left in its own allocation keeps working when the pool runs dry.' },
  { key: 'agent', label: 'Agent', caption: 'Set a monthly limit on any agent. Admins are notified as it gets close, and a hard stop turns that agent off when it reaches the limit.' },
  { key: 'payg', label: 'Pay-as-you-go', caption: 'A billing plan sends an environment’s overage to an Azure subscription. Business continuity, with Azure Cost Management showing the charges.' }
];
buildDots($('nest-dots'), 24);
chips($('scope-picker'), SCOPES, s => showScope(s.key), 0);
function showScope(key) {
  document.querySelectorAll('.nest-ring').forEach(r => r.classList.toggle('is-on', r.dataset.scope === key));
  const s = SCOPES.find(x => x.key === key);
  $('scope-caption').textContent = s.caption;
  announce(`${s.label}. ${s.caption}`);
}
showScope('tenant');

/* ================= 03 · enforcement mode ================= */
const MODES = [
  { key: 'none', label: 'Allocation only' },
  { key: 'tenant', label: 'Draw from tenant' },
  { key: 'payg', label: 'Bill pay-as-you-go' }
];
const STATE_KEYS = [
  { key: 'env', label: 'Environment allocation', words: { ok: 'credits left', warn: 'nearly used', out: 'used up' } },
  { key: 'tenant', label: 'Tenant pool', words: { ok: 'within prepaid', warn: 'overage · grace', out: 'past 125%' } },
  { key: 'agent', label: 'Agent monthly limit', words: { ok: 'within limit', warn: 'nearing limit', out: 'limit reached' } }
];
let mode = 'tenant';
const STATES = ['ok', 'warn', 'out'];
const budgetState = { env: 'out', tenant: 'out', agent: 'ok' };

STATE_KEYS.forEach(s => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'switch';
  b.dataset.state = s.key;
  b.addEventListener('click', () => {
    budgetState[s.key] = STATES[(STATES.indexOf(budgetState[s.key]) + 1) % STATES.length];
    renderSwitches(); renderVerdict();
  });
  $('state-toggles').appendChild(b);
});
function renderSwitches() {
  [...$('state-toggles').children].forEach(b => {
    const s = STATE_KEYS.find(x => x.key === b.dataset.state);
    const v = budgetState[s.key];
    b.dataset.level = v;
    b.setAttribute('aria-label', `${s.label}: ${s.words[v]}. Tap to change.`);
    b.innerHTML = `<span class="sw-l">${s.label}</span><span class="sw-v">${s.words[v]}</span>`;
  });
}
function decide() {
  const { env, tenant, agent } = budgetState;
  if (agent === 'out') return ['blocked', 'The agent reached its monthly limit with hard stop on, so it is turned off whatever the overage setting.'];
  const notes = [];
  if (agent === 'warn') notes.push('environment and tenant admins get a nearing-limit notification');
  if (env !== 'out') {
    if (env === 'warn') notes.push('allocation nearly used');
    if (tenant === 'out') notes.push('the tenant is past 125%, but this environment still has its own credits');
    return [notes.length ? 'warned' : 'allowed', notes.length ? notes.join(' · ') : 'Paid from this environment’s own allocation.'];
  }
  if (mode === 'none') return ['blocked', 'Allocation used up and no overage source chosen. Features that need credits stop working.'];
  if (mode === 'payg') return ['warned', ['Allocation used up · the overage is billed to the Azure subscription', ...notes].join(' · ')];
  if (tenant === 'out') return ['blocked', 'Drawing from a tenant pool that is past 125%. Agents stop with “It has reached its usage limit.”'];
  if (tenant === 'warn') return ['warned', ['Drawing from the tenant in its overage grace period · the tenant admin gets an email', ...notes].join(' · ')];
  return [notes.length ? 'warned' : 'allowed', ['Allocation used up · drawing from unallocated tenant capacity', ...notes].join(' · ')];
}
function renderVerdict() {
  const [level, why] = decide();
  $('verdict').classList.toggle('is-blocked', level === 'blocked');
  $('verdict').classList.toggle('is-warned', level === 'warned');
  $('verdict-word').textContent = level === 'blocked' ? 'BLOCKED' : level === 'warned' ? 'ANSWERS · FLAGGED' : 'ANSWERS';
  $('verdict-why').textContent = why;
  announce(`${$('verdict-word').textContent}. ${why}`);
}
chips($('mode-picker'), MODES, m => { mode = m.key; renderVerdict(); }, 1);
renderSwitches();
renderVerdict();

/* ================= 04 · the public agent ================= */
const PER_CELL = 200;            // 50 questions × ~4 credits each (illustrative)
const AGENT_LIMIT = 6000;
const LAG_CELLS = 4;             // limits aren't applied instantly
const POOL_LEFT = 48000;
let agentCap = 'off', floodTimer = null;
const floodCells = buildDots($('flood'), 200);

function resetFlood() {
  if (floodTimer) clearTimeout(floodTimer);
  floodCells.forEach(c => { c.className = ''; });
  setPools(0, 0);
  $('flood-play').disabled = false;
  $('flood-play').textContent = '▶ Send 10,000 questions';
  $('flood-verdict').textContent = agentCap === 'on'
    ? 'The agent has its own monthly limit. Send the traffic.'
    : agentCap === 'auth'
      ? 'A data policy blocks agents without sign-in. Strangers have to sign in with Entra ID first.'
      : 'No agent limit. Every answer comes out of the shared tenant pool.';
}
function setPools(agentSpent, orgSpent) {
  const a = agentCap === 'on' ? Math.min(100, (agentSpent / AGENT_LIMIT) * 100) : 0;
  const o = Math.min(100, (orgSpent / POOL_LEFT) * 100);
  $('pool-agent').style.width = a + '%';
  $('pool-org').style.width = o + '%';
  $('pool-agent').classList.toggle('is-full', a >= 100);
  $('pool-org').classList.toggle('is-full', o >= 80);
  $('pool-agent-n').textContent = agentCap === 'on' ? `${cr(agentSpent)} of ${credits(AGENT_LIMIT)}` : 'not set';
  $('pool-org-n').textContent = `${cr(orgSpent)} of ${credits(POOL_LEFT)} left this month`;
}
function playFlood() {
  resetFlood();
  const btn = $('flood-play');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  let i = 0;
  const total = floodCells.length;
  const capCells = AGENT_LIMIT / PER_CELL + LAG_CELLS;
  const step = () => {
    const shown = Math.min(total, i * 25);
    let charged = 0;
    for (let n = 0; n < shown; n++) {
      const ok = agentCap === 'off' || (agentCap === 'on' && n < capCells);
      floodCells[n].className = ok ? 'is-charged' : 'is-rejected';
      if (ok) charged++;
    }
    const spent = charged * PER_CELL;
    setPools(agentCap === 'on' ? spent : 0, agentCap === 'off' ? spent : 0);
    i++;
    if (shown < total) {
      floodTimer = setTimeout(step, REDUCED ? 700 : 340);
    } else {
      btn.disabled = false;
      btn.textContent = '▶ Send again';
      $('flood-verdict').textContent = agentCap === 'on'
        ? `The limit is reached and, a few answers later, the agent turns itself off at ${credits(spent)}. Every other agent carries on.`
        : agentCap === 'auth'
          ? 'Nothing is charged, because nobody gets past sign-in. Prospective students can’t use it without an account either. That’s the trade-off.'
          : `${credits(spent)} taken from the shared pool. Every staff and student agent is now that much closer to the 125% block.`;
      announce($('flood-verdict').textContent);
    }
  };
  step();
}
$('flood-play').addEventListener('click', playFlood);
document.querySelectorAll('[data-agentcap]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-agentcap]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  agentCap = b.dataset.agentcap;
  resetFlood();
}));
resetFlood();

/* ================= 05 · who spent what ================= */
const PERIODS = {
  oct: {
    label: 'October', total: 171400, remaining: 28600, near: 2, over: 1, resets: 'Nov 1',
    agents: [['Admissions Concierge · public site', 52300], ['Research Grants Agent', 38900], ['IT Help Desk', 27600], ['Library Guide', 14100], ['All other agents', 38500]],
    split: {
      env: [['Admissions · Prod', 61200], ['Research', 44800], ['Student Services', 33900], ['Faculty Sandbox', 19700], ['Default', 11800]],
      feature: [['Generative answers', 58000], ['Gen AI tools (premium)', 49600], ['Agent actions', 31200], ['Tenant graph grounding', 21400], ['Agent flow actions', 11200]],
      channel: [['Microsoft Teams', 61800], ['Website (Direct Line)', 52300], ['Microsoft 365 Copilot', 29700], ['SharePoint', 15400], ['Autonomous triggers', 12200]],
      model: [['GPT Chat Latest', 96500], ['Claude Opus 4.7', 49600], ['Claude Sonnet 4.6', 25300]]
    }
  },
  sep: {
    label: 'September', total: 132800, remaining: 67200, near: 1, over: 0, resets: 'Oct 1',
    agents: [['Research Grants Agent', 31200], ['IT Help Desk', 26400], ['Admissions Concierge · public site', 22800], ['Library Guide', 12900], ['All other agents', 39500]],
    split: {
      env: [['Research', 36100], ['Admissions · Prod', 30400], ['Student Services', 29800], ['Faculty Sandbox', 22700], ['Default', 13800]],
      feature: [['Generative answers', 49700], ['Gen AI tools (premium)', 30900], ['Agent actions', 26800], ['Tenant graph grounding', 16600], ['Agent flow actions', 8800]],
      channel: [['Microsoft Teams', 54300], ['Microsoft 365 Copilot', 27600], ['Website (Direct Line)', 22800], ['SharePoint', 16400], ['Autonomous triggers', 11700]],
      model: [['GPT Chat Latest', 80200], ['Claude Opus 4.7', 30900], ['Claude Sonnet 4.6', 21700]]
    }
  }
};
const SPLITS = [
  { key: 'env', label: 'Environment', kicker: 'BY ENVIRONMENT' },
  { key: 'feature', label: 'AI feature', kicker: 'BY PRODUCT / AI FEATURE' },
  { key: 'channel', label: 'Channel', kicker: 'BY CHANNEL' },
  { key: 'model', label: 'Model', kicker: 'BY LLM MODEL' }
];
let period = 'oct', split = 'env';
function bars(node, rows) {
  const max = Math.max(...rows.map(r => r[1]));
  node.innerHTML = rows.map(([name, value]) => `<div class="bar"><span class="bar-l">${name}</span><span class="bar-track"><i style="width:${(value / max) * 100}%"></i></span><b>${cr(value)}</b></div>`).join('');
}
function showSplit() {
  const s = SPLITS.find(x => x.key === split);
  $('split-kicker').textContent = s.kicker;
  bars($('bars-groups'), PERIODS[period].split[split]);
}
function showPeriod(key) {
  period = key;
  const p = PERIODS[key];
  $('stat-row').innerHTML = [
    ['Credits used', cr(p.total), 'prepaid + pay-as-you-go', ''],
    ['Prepaid left', cr(p.remaining), `month end · resets ${p.resets}`, ''],
    ['Agents nearing limit', p.near, 'admins notified', p.near ? 'is-warn' : ''],
    ['Agents over limit', p.over, 'turned off by hard stop', p.over ? 'is-over' : '']
  ].map(([l, v, sub, cls]) => `<div class="stat ${cls}"><strong>${v}</strong><span>${l}</span>${sub ? `<i>${sub}</i>` : ''}</div>`).join('');
  bars($('bars-people'), p.agents);
  showSplit();
  announce(`${p.label}. ${credits(p.total)} used.`);
}
chips($('period-picker'), [{ label: 'October', key: 'oct' }, { label: 'September', key: 'sep' }], p => showPeriod(p.key), 0);
chips($('split-picker'), SPLITS, s => { split = s.key; showSplit(); announce(`Broken down ${s.kicker.toLowerCase()}.`); }, 0);
showPeriod('oct');

const SIGNALS = [
  { name: 'Copilot Studio · Monitor', what: 'Quality per agent', detail: 'Each agent’s Monitor page shows sessions, daily and monthly active users (authenticated agents only), resolved, escalated and abandoned outcomes, CSAT, themes, and the agent’s billed credits over time. Metrics are kept for 360 days, transcripts for 28. Share it read-only with the Analytics Viewer role.' },
  { name: 'Power Platform admin center', what: 'Credits & capacity', detail: 'Licensing > Copilot Studio shows prepaid and pay-as-you-go usage, daily trends for three months, and consumption by environment, agent and user. Manage agents lists every agent that costs credits, with its limit, month-to-date credits and status (Within, Nearing or Over limit), and lets you turn it off.' },
  { name: 'Application Insights', what: 'Your own telemetry', detail: 'Paste a connection string under Settings > Advanced and the agent logs custom events: messages, topics and, if you choose, every node that runs. Query them with KQL in Azure Monitor, and filter out test-canvas traffic using the designMode dimension.' },
  { name: 'Microsoft Purview', what: 'Audit & compliance', detail: 'The audit log records maker and admin activity, such as agents created, published, deleted or renamed, through Audit in the Purview portal or the Office 365 Management API. DSPM for AI shows interaction records to compliance staff. Microsoft Sentinel can raise alerts on the same events.' },
  { name: 'Microsoft 365 admin center', what: 'Agent inventory', detail: 'Agents > All agents > Registry lists every agent in the tenant: Microsoft, partner, published by your org, and shared by creator. It shows totals, agents without owners and unmanaged agents, and lets you block or remove them. Microsoft Agent 365 is the wider control plane.' }
];
SIGNALS.forEach((s, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'signal';
  b.setAttribute('aria-pressed', String(i === 0));
  b.innerHTML = `<strong>${s.name}</strong><span>${s.what}</span>`;
  b.addEventListener('click', () => {
    [...$('signal-grid').children].forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
    $('signal-detail').textContent = s.detail;
  });
  $('signal-grid').appendChild(b);
});
$('signal-detail').textContent = SIGNALS[0].detail;

/* ================= 06 · roles & permissions ================= */
const CAPS = ['Chat with agents shared to them', 'Create agents', 'Co-author an agent (Editor)', 'Publish to channels the data policy allows', 'Open an agent’s Monitor page', 'Read conversation transcripts', 'Write data policies', 'Assign security roles in an environment', 'Allocate credits & set agent limits', 'Environment groups & tenant rules'];
const ROLES = [
  { label: 'Student', source: 'Viewer of the agent, through a security group', on: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0], caption: 'Can chat with agents shared with their group. Can’t build, publish or see analytics.' },
  { label: 'Faculty maker', source: 'Environment Maker in a faculty environment', on: [1, 1, 1, 1, 1, 0, 0, 0, 0, 0], caption: 'Builds course agents in a governed environment and sees their own agent’s Monitor page. Data policies decide which channels they can publish to.' },
  { label: 'Analyst', source: 'Analytics Viewer (agent) + Bot Transcript Viewer (environment)', on: [1, 0, 0, 0, 1, 1, 0, 0, 0, 0], caption: 'Read-only: analytics and transcripts, with no edit access to the agent.' },
  { label: 'Environment admin', source: 'System Administrator Dataverse role', on: [1, 1, 1, 1, 1, 1, 1, 1, 0, 0], caption: 'Runs one environment and its data policies. Gets agent-limit notifications but doesn’t allocate tenant credits.' },
  { label: 'Power Platform admin', source: 'Entra ID role · tenant-wide', on: [1, 0, 0, 0, 0, 0, 1, 1, 1, 1], caption: 'Controls credits, limits, data policies and environment groups across the tenant. Opening transcripts or building inside an environment also needs System Administrator there.' }
];
function showRole(i) {
  const r = ROLES[i];
  $('perm-grid').innerHTML = CAPS.map((c, n) => `<div class="perm${r.on[n] ? ' is-on' : ''}"><span class="perm-tick" aria-hidden="true">${r.on[n] ? '✓' : '—'}</span>${c}</div>`).join('');
  $('role-source').textContent = r.source;
  $('perm-caption').textContent = r.caption;
  announce(`${r.label}. ${r.on.filter(Boolean).length} of ${CAPS.length} capabilities. ${r.caption}`);
}
chips($('role-picker'), ROLES, (r, i) => showRole(i), 0);
showRole(0);

/* ================= 07 · make it yours ================= */
const ACCENTS = ['#087985', '#5b3fb5', '#a8432c', '#1d6b3f', '#0b4d63'];
ACCENTS.forEach((hex, i) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'swatch';
  b.style.background = hex;
  b.setAttribute('aria-label', 'Accent ' + (i + 1) + ' ' + hex);
  b.setAttribute('aria-pressed', String(i === 0));
  b.addEventListener('click', () => {
    [...$('swatches').children].forEach((x, j) => x.setAttribute('aria-pressed', String(j === i)));
    $('preview').style.setProperty('--brand', hex);
    $('teams-hex').textContent = hex;
    announce('Accent changed.');
  });
  $('swatches').appendChild(b);
});
$('preview').style.setProperty('--brand', ACCENTS[0]);
function applyName() {
  const v = $('brand-name').value.trim() || 'Your institution';
  const agent = v + ' Assistant';
  const mark = v.charAt(0).toUpperCase();
  $('preview-name').textContent = agent;
  $('teams-name').textContent = agent;
  $('teams-dev').textContent = v;
  $('teams-dev2').textContent = v;
  $('preview-greeting').textContent = `Hi, I'm the ${agent}. Ask me about admissions, IT or the library.`;
  $('teams-desc').textContent = `Admissions, IT and library help for ${v} students and staff.`;
  document.querySelectorAll('#preview-mark, #teams-icon, .bubble-avatar').forEach(n => { n.textContent = mark; });
}
$('brand-name').addEventListener('input', applyName);
document.querySelectorAll('[data-surface]').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('[data-surface]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  const teams = b.dataset.surface === 'teams';
  $('preview-web').hidden = teams;
  $('preview-teams').hidden = !teams;
  announce(teams ? 'Showing Teams app details.' : 'Showing website web chat.');
}));
applyName();

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
    let id = 'runaway';
    document.querySelectorAll('main section').forEach(s => { if (s.getBoundingClientRect().top <= line) id = s.id; });
    $('section-jump').value = id;
  });
}, { passive: true });
