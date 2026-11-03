'use strict';

/* =========================================================================
   ALL PRICES LIVE IN THIS BLOCK. Every number below was read from a
   Microsoft source on 2026-11-02. If a number could not be verified it is
   not used: the line shows "Quote from Microsoft/partner" instead.

   [G]  Microsoft Copilot Studio Licensing Guide, November 2026
        https://go.microsoft.com/fwlink/?linkid=2320995
        (resolves to cdn-dynmedia-1.microsoft.com/.../MicrosoftCopilotStudioLicensingGuide.pdf)
        p.14  Pay-as-you-go: $0.01 / Copilot Credit
        p.15  Copilot Credit Pre-Purchase Plan (P3): 300,000 credits = 5% discount (tier 1)
        p.16  Capacity pack: $200 per pack / month (billed annually) = 25,000 credits / month
   [R]  Billing rates and management (Learn, last updated 2026-10-31)
        https://learn.microsoft.com/en-us/microsoft-copilot-studio/requirements-messages-management
        Classic answer 1, generative answer 2, agent action 5, tenant graph grounding 10,
        agent flow actions 13 per 100, prompt tools basic 1 / standard 15 per 10 responses,
        premium (reasoning) 10 per 1,000 tokens, content processing 8 per page.
        Microsoft 365 Copilot licensed users (employee-facing, own identity): no charge.
        Enforcement at 125% of prepaid capacity.
   [P]  Pay-as-you-go meters (Learn, last updated 2026-10-14)
        https://learn.microsoft.com/en-us/power-platform/admin/pay-as-you-go-meters
        Copilot Studio $0.01 per credit; Power Automate premium cloud flow run $0.60.
   [F]  Fabric data agent in Copilot Studio (Learn, preview, updated 2026-05-12)
        https://learn.microsoft.com/en-us/fabric/data-science/data-agent-microsoft-copilot-studio
        Needs paid F2 or higher Fabric capacity (or Power BI Premium P1+).
        F SKU = capacity units: https://learn.microsoft.com/en-us/fabric/enterprise/licenses
   [A]  Azure Retail Prices API (prices.azure.com), Microsoft Fabric,
        "Compute Pool Capacity Usage CU", eastus, Consumption: $0.18 per CU-hour.
   [L]  Microsoft Copilot licence options (Learn, updated 2026-10-19)
        https://learn.microsoft.com/en-us/microsoft-365/copilot/copilot-license-options
        Academic offering exists (EES / CSP). No price published there; microsoft.com
        pricing pages returned HTTP 403 to our fetch, so no per-user price is shown.
   ========================================================================= */

function fmt(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function fmt2(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function num(n) { return Math.round(n).toLocaleString('en-US'); }
function cr(n) { const v = Math.round(n * 10) / 10; return v.toLocaleString('en-US') + (v === 1 ? ' credit' : ' credits'); }

const PAYG_PER_CREDIT = 0.01;                       /* [G] p.14, [P] */
const PACK = { credits: 25000, monthly: 200 };      /* [G] p.16, billed annually */
const P3_TIER1 = { credits: 300000, discount: 0.05 }; /* [G] p.15, shown as a note only */
const RATE = {                                      /* [R] credits */
  classic: 1,
  generative: 2,
  action: 5,
  graph: 10,
  flowPer100: 13,
  promptBasic: 0.1,     /* 1 credit per 10 responses */
  promptStandard: 1.5,  /* 15 credits per 10 responses */
  premiumPer1k: 10,
  contentPage: 8
};
const FLOW_RUN_PAYG = 0.60;                          /* [P] premium cloud flow run */
const FABRIC_CU_HOUR = 0.18;                         /* [A] eastus, pay-as-you-go */
const HOURS_MONTH = 730;                             /* assumption: capacity left running all month */
const FABRIC_SKUS = [2, 4, 8, 16, 32, 64];           /* [F] F2 minimum; CUs = SKU number */
const LICENCE_QUOTE = 'Quote from Microsoft/partner';

const RATE_CARD = [
  ['Classic answer', '1 credit', 'authored topic message'],
  ['Generative answer', '2 credits', 'answer generated from knowledge'],
  ['Agent action', '5 credits', 'tool, connector, MCP tool, trigger, topic transition'],
  ['Tenant graph grounding', '10 credits', 'per grounded message'],
  ['Agent flow actions', '13 credits', 'per 100 actions'],
  ['Prompt tool, basic', '1 credit', 'per 10 responses'],
  ['Prompt tool, standard', '15 credits', 'per 10 responses'],
  ['Premium / reasoning model', '10 credits', 'per 1,000 billed tokens'],
  ['Content processing', '8 credits', 'per page'],
  ['Pay-as-you-go', '$0.01', 'per credit, billed monthly in Azure'],
  ['Capacity pack', '$200 / month', '25,000 credits a month, billed annually'],
  ['Microsoft 365 Copilot user', 'No charge', 'employee-facing, own identity, fair use']
];

const VIEWS = {
  month: { label: 'Per month', mult: 1 },
  year: { label: 'Per year', mult: 12 }
};

const BILLING = {
  packs: { label: 'Prepaid packs', note: '$200 per 25,000 credits a month' },
  payg: { label: 'Pay-as-you-go', note: '$0.01 per credit, no commitment' },
  hybrid: { label: 'Packs + pay-as-you-go', note: 'full packs, overflow on the meter' }
};

const LICENSED = [
  { v: '0', l: 'None', note: 'every conversation billed' },
  { v: '25', l: 'About a quarter', note: 'of staff conversations' },
  { v: '50', l: 'About half', note: 'of staff conversations' },
  { v: '90', l: 'Nearly all', note: 'of staff conversations' }
];

/* Usage questions shared by every conversational agent. Defaults differ per product. */
function convQuestions(d) {
  return [
    { id: 'conv', type: 'slider', label: 'Conversations a month', min: 0, max: 100000, step: 500, def: d.conv },
    { id: 'staff', type: 'slider', label: 'Share from staff in Teams or Copilot Chat', unit: '%', min: 0, max: 100, step: 5, def: d.staff, note: 'the rest are students or guests', when: 'm365' },
    { id: 'classic', type: 'slider', label: 'Classic answers per conversation', min: 0, max: 10, step: 1, def: d.classic, note: '1 credit each' },
    { id: 'gen', type: 'slider', label: 'Generative answers per conversation', min: 0, max: 10, step: 1, def: d.gen, note: '2 credits each' },
    { id: 'graph', type: 'single', label: 'Tenant graph grounding', options: [
      { v: 'off', l: 'Off', note: 'SharePoint / web knowledge only' },
      { v: 'on', l: 'On', note: '+10 credits per generative answer' }
    ], def: d.graph, when: 'm365' },
    { id: 'actions', type: 'slider', label: 'Agent actions per conversation', min: 0, max: 10, step: 1, def: d.actions, note: 'tools, MCP, connectors · 5 credits each' },
    { id: 'flow', type: 'slider', label: 'Agent flow actions per conversation', min: 0, max: 100, step: 5, def: d.flow, note: '13 credits per 100' },
    { id: 'prompts', type: 'slider', label: 'Prompt tool calls per conversation', min: 0, max: 5, step: 1, def: d.prompts },
    { id: 'promptTier', type: 'single', label: 'Prompt tool model', options: [
      { v: 'basic', l: 'Basic', note: '1 credit per 10 responses' },
      { v: 'standard', l: 'Standard', note: '15 credits per 10 responses' }
    ], def: d.promptTier },
    { id: 'reason', type: 'single', label: 'Orchestration model', options: [
      { v: '0', l: 'Non-reasoning', note: 'feature rates only' },
      { v: '10000', l: 'Reasoning, light', note: '~10,000 billed tokens per conversation' },
      { v: '50000', l: 'Reasoning, heavy', note: '~50,000 billed tokens per conversation' }
    ], def: d.reason }
  ];
}

const OFFERINGS = [
  {
    id: 'chat',
    name: 'Campus Chat',
    tagline: 'One Copilot Studio agent for everyone, in Teams and Copilot Chat',
    badge: 'STEP 1',
    tier: 1,
    m365: true,
    includes: ['Copilot Studio agent', 'SharePoint and website knowledge', 'Teams + Microsoft 365 Copilot channels', 'Topics for authored answers', 'Code interpreter and file upload'],
    questions: convQuestions({ conv: 20000, staff: 30, classic: 1, gen: 3, graph: 'off', actions: 0, flow: 0, prompts: 0, promptTier: 'basic', reason: '0' })
  },
  {
    id: 'plus',
    name: 'Campus Chat Plus',
    tagline: 'Tools, MCP servers, agent flows and child agents behind the same chat',
    badge: 'STEP 2',
    tier: 2,
    requires: 'chat',
    m365: true,
    includes: ['Everything in Campus Chat', 'MCP servers and connectors as tools', 'Agent flows (Power Automate)', 'Child and connected agents', 'Prompt tools', 'Dataverse, DLP, managed environments'],
    questions: convQuestions({ conv: 20000, staff: 30, classic: 1, gen: 3, graph: 'off', actions: 2, flow: 20, prompts: 1, promptTier: 'standard', reason: '0' })
  },
  {
    id: 'fabric',
    name: 'Data Bridge',
    tagline: 'A Fabric data agent answering from OneLake, connected to the agent',
    badge: 'STEP 3',
    tier: 3,
    requires: 'plus',
    m365: true,
    includes: ['Fabric data agent (preview)', 'Lakehouse, warehouse, semantic model', 'User auth: people see only their data', 'Published to Teams'],
    questions: [
      { id: 'share', type: 'slider', label: 'Conversations that ask the data agent', unit: '%', min: 0, max: 100, step: 5, def: 20, note: 'counted as one agent action each (assumption)' },
      { id: 'sku', type: 'single', label: 'Fabric capacity', options: FABRIC_SKUS.map(c => ({
        v: String(c), l: 'F' + c, note: fmt(c * FABRIC_CU_HOUR * HOURS_MONTH) + ' a month'
      })), def: '2' }
    ]
  },
  {
    id: 'recruitment',
    name: 'Recruitment',
    tagline: 'A public website agent for prospective students',
    badge: 'USE CASE',
    m365: false,
    includes: ['Website embed (no sign-in)', 'Generative answers from program pages', 'CRM hand-off via agent flow', 'Human hand-off topic'],
    questions: convQuestions({ conv: 8000, staff: 0, classic: 2, gen: 4, graph: 'off', actions: 1, flow: 15, prompts: 0, promptTier: 'basic', reason: '0' }).filter(q => q.when !== 'm365')
  },
  {
    id: 'retention',
    name: 'Retention',
    tagline: 'An autonomous agent that turns early signals into outreach',
    badge: 'USE CASE',
    m365: false,
    autonomous: true,
    includes: ['Event and schedule triggers', 'Agent flows for outreach', 'Prompt tool drafts messages', 'Advisor hand-off in Teams'],
    questions: [
      { id: 'conv', type: 'slider', label: 'Autonomous runs a month', min: 0, max: 20000, step: 250, def: 3000, note: 'one per flagged student' },
      { id: 'gen', type: 'slider', label: 'Generative answers per run', min: 0, max: 10, step: 1, def: 1, note: '2 credits each' },
      { id: 'actions', type: 'slider', label: 'Agent actions per run', min: 0, max: 10, step: 1, def: 3, note: 'trigger, lookups, send · 5 credits each' },
      { id: 'flow', type: 'slider', label: 'Agent flow actions per run', min: 0, max: 100, step: 5, def: 25, note: '13 credits per 100' },
      { id: 'prompts', type: 'slider', label: 'Prompt tool calls per run', min: 0, max: 5, step: 1, def: 1 },
      { id: 'promptTier', type: 'single', label: 'Prompt tool model', options: [
        { v: 'basic', l: 'Basic', note: '1 credit per 10 responses' },
        { v: 'standard', l: 'Standard', note: '15 credits per 10 responses' }
      ], def: 'standard' },
      { id: 'cloudRuns', type: 'slider', label: 'Premium cloud flow runs a month', min: 0, max: 5000, step: 50, def: 60, note: 'nightly student-system sync etc.' },
      { id: 'paLicence', type: 'single', label: 'How are those cloud flows licensed?', options: [
        { v: 'licensed', l: 'Power Automate licences we hold', note: 'no extra cost here' },
        { v: 'payg', l: 'Pay-as-you-go meter', note: '$0.60 per premium run' }
      ], def: 'licensed' }
    ]
  },
  {
    id: 'advising',
    name: 'Advising',
    tagline: 'An advising agent for students and advisors in Teams',
    badge: 'USE CASE',
    m365: true,
    includes: ['Degree-audit lookups via MCP or connector', 'Appointment booking agent flow', 'Advisor notes in Dataverse', 'Teams for students and staff'],
    questions: convQuestions({ conv: 6000, staff: 20, classic: 1, gen: 3, graph: 'off', actions: 2, flow: 10, prompts: 1, promptTier: 'standard', reason: '0' })
  },
  {
    id: 'teaching-assistant',
    name: 'Teaching assistant',
    tagline: 'A course-aware assistant in Teams and on LMS course pages',
    badge: 'USE CASE',
    m365: true,
    includes: ['Course files as SharePoint knowledge', 'LMS data via MCP or custom connector', 'Integrity guardrail topics', 'Instructor escalation flow'],
    questions: convQuestions({ conv: 15000, staff: 5, classic: 1, gen: 3, graph: 'off', actions: 1, flow: 5, prompts: 0, promptTier: 'basic', reason: '0' })
  },
  {
    id: 'student-services',
    name: 'Student services',
    tagline: 'One front door routing to an agent per office',
    badge: 'USE CASE',
    m365: true,
    includes: ['Main agent + connected/child agents per office', 'Public and signed-in answers', 'Handoff with context (Dynamics 365 or ServiceNow case)', 'Per-office analytics'],
    questions: convQuestions({ conv: 25000, staff: 5, classic: 2, gen: 3, graph: 'off', actions: 2, flow: 15, prompts: 0, promptTier: 'basic', reason: '0' })
  },
  {
    id: 'financial-aid',
    name: 'Financial aid',
    tagline: 'Holds, balances, documents and payment plans for signed-in students',
    badge: 'USE CASE',
    m365: true,
    includes: ['SIS / bursar data via MCP or custom connector', 'Document upload to staff review', 'Payment plans the student confirms', 'Scheduled deadline reminders'],
    questions: convQuestions({ conv: 10000, staff: 5, classic: 1, gen: 2, graph: 'off', actions: 3, flow: 20, prompts: 0, promptTier: 'basic', reason: '0' })
  },
  {
    id: 'transfer-credit',
    name: 'Transfer credit',
    tagline: 'Transcript upload, likely equivalencies and an evaluator queue',
    badge: 'USE CASE',
    m365: false,
    includes: ['Transcript upload to an agent flow', 'Document processing (content processing tools)', 'Equivalency table in Dataverse', 'Evaluator approval queue'],
    questions: convQuestions({ conv: 1500, staff: 0, classic: 1, gen: 2, graph: 'off', actions: 3, flow: 40, prompts: 1, promptTier: 'standard', reason: '0' }).filter(q => q.when !== 'm365').concat([{ id: 'pages', type: 'slider', label: 'Transcript pages processed per conversation', min: 0, max: 20, step: 1, def: 3, note: 'content processing · 8 credits per page' }])
  },
  {
    id: 'career-services',
    name: 'Career services',
    tagline: 'Resume coaching, interview practice and counselor prep',
    badge: 'USE CASE',
    m365: true,
    includes: ['Rubric-based resume feedback (prompt)', 'Interview practice topics', 'Listings via custom connector or MCP', 'Bookings-triggered prep flow'],
    questions: convQuestions({ conv: 6000, staff: 5, classic: 1, gen: 3, graph: 'off', actions: 2, flow: 10, prompts: 2, promptTier: 'standard', reason: '0' })
  },
  {
    id: 'research-administration',
    name: 'Research administration',
    tagline: 'Guideline answers, readiness checks and routed approvals for faculty',
    badge: 'USE CASE',
    m365: true,
    includes: ['Sponsor guidelines as SharePoint knowledge', 'Readiness check (prompt)', 'Approvals: chair → dean → research office', 'Deadline reminder flows'],
    questions: convQuestions({ conv: 2000, staff: 100, classic: 1, gen: 3, graph: 'off', actions: 2, flow: 25, prompts: 1, promptTier: 'standard', reason: '0' })
  },
  {
    id: 'campus-operations',
    name: 'Campus operations',
    tagline: 'Work orders from a photo, room booking and on-call escalation',
    badge: 'USE CASE',
    m365: true,
    includes: ['Work orders via ServiceNow, Field Service or CMMS', 'Outlook room booking', 'Fixed safety topic + escalation', 'Status updates in the same chat'],
    questions: convQuestions({ conv: 5000, staff: 30, classic: 1, gen: 2, graph: 'off', actions: 2, flow: 15, prompts: 0, promptTier: 'basic', reason: '0' })
  },
  {
    id: 'alumni-advancement',
    name: 'Alumni & advancement',
    tagline: 'An alumni website agent and donor briefs for gift officers',
    badge: 'USE CASE',
    m365: true,
    includes: ['Alumni website agent (optional sign-in)', 'CRM via Dataverse, Salesforce or custom connector', 'Consent-aware outreach flows', 'Drafts officers edit and send'],
    questions: convQuestions({ conv: 4000, staff: 15, classic: 1, gen: 3, graph: 'off', actions: 2, flow: 15, prompts: 1, promptTier: 'standard', reason: '0' })
  }
];

const SHARED = {
  licensed: {
    id: 'licensed', type: 'single', label: 'Staff with a Microsoft 365 Copilot licence',
    options: LICENSED, def: '0', note: 'their agent use in Microsoft channels is not charged'
  },
  billing: {
    id: 'billing', type: 'single', label: 'How you would buy Copilot Credits',
    options: Object.keys(BILLING).map(k => ({ v: k, l: BILLING[k].label, note: BILLING[k].note })),
    def: 'hybrid'
  },
  view: {
    id: 'view', type: 'single', label: 'Show figures',
    options: Object.keys(VIEWS).map(k => ({ v: k, l: VIEWS[k].label })),
    def: 'month'
  }
};

/* ========================== end of price block ========================== */

const $ = id => document.getElementById(id);
const announce = m => { $('live').textContent = m; };
function offering(id) { return OFFERINGS.find(o => o.id === id); }

const OFFERING_ICONS = {
  chat: '<path d="M21 13a4 4 0 0 1-4 4H8l-5 4V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/>',
  plus: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="4"/><path d="m5.6 5.6 2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/>',
  recruitment: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/>',
  retention: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/><path d="M7 12h3l1-2 2 4 1-2h3"/>',
  advising: '<path d="M4 19V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v13"/><path d="M2 19h20M9 8h6M9 12h4"/>',
  fabric: '<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  'teaching-assistant': '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/>',
  'student-services': '<path d="M3 21V9l9-6 9 6v12"/><path d="M9 21v-6h6v6"/>',
  'financial-aid': '<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M2 10h20M6 15h4"/>',
  'transfer-credit': '<path d="M7 7h11l-3-3M17 17H6l3 3"/>',
  'career-services': '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  'research-administration': '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/>',
  'campus-operations': '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
  'alumni-advancement': '<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/>'
};
function offeringIcon(id) {
  return `<span class="offer-icon" aria-hidden="true"><svg viewBox="0 0 24 24">${OFFERING_ICONS[id] || OFFERING_ICONS.chat}</svg></span>`;
}

const state = { picked: ['chat'], answers: {} };
function seedDefaults() {
  state.answers = {};
  Object.values(SHARED).forEach(q => { state.answers[q.id] = q.def; });
  OFFERINGS.forEach(o => (o.questions || []).forEach(q => {
    state.answers[o.id + '.' + q.id] = q.def;
  }));
}
seedDefaults();

const LADDER = ['chat', 'plus', 'fabric'];
function ladderTier(id) { return LADDER.indexOf(id); }
function topLadderPicked() {
  const picked = LADDER.filter(id => state.picked.includes(id));
  return picked.length ? picked[picked.length - 1] : null;
}
/* The conversational usage of the ladder agent belongs to the highest chat step
   picked (Data Bridge adds to it, it does not replace it). */
function convOwner() {
  const c = ['chat', 'plus'].filter(id => state.picked.includes(id));
  return c.length ? c[c.length - 1] : null;
}
function ans(oid, qid) { return state.answers[oid + '.' + qid]; }
function view() { return VIEWS[state.answers.view] || VIEWS.month; }
function anyM365() { return state.picked.some(id => offering(id).m365); }

function neededShared() {
  const out = [];
  if (anyM365()) out.push('licensed');
  if (state.picked.length) out.push('billing', 'view');
  return out;
}

/* ---------------- offering cards ---------------- */
function offerCard(o) {
  const on = state.picked.includes(o.id);
  const top = topLadderPicked();
  const carried = on && o.tier && top !== o.id;
  const head = o.tier
    ? `<span class="offer-top"><span class="offer-tick" aria-hidden="true">${on ? '✓' : ''}</span></span>`
    : `<span class="offer-top"><span class="offer-badge">${o.badge}</span><span class="offer-tick" aria-hidden="true">${on ? '✓' : ''}</span></span>`;
  return `<button type="button" class="offer${o.tier ? ' is-step' : ''}${carried ? ' is-carried' : ''}" data-offer="${o.id}" aria-pressed="${on}">
    ${offeringIcon(o.id)}
    ${head}
    <strong>${o.name}</strong>
    <span class="offer-tag">${o.tagline}</span>
  </button>`;
}
function renderOfferings() {
  const steps = OFFERINGS.filter(o => o.tier).sort((a, b) => a.tier - b.tier);
  const rest = OFFERINGS.filter(o => !o.tier);
  $('offer-grid').innerHTML =
    '<div class="ladder">' +
    steps.map((o, i) => (i ? '<span class="ladder-arrow" aria-hidden="true">→</span>' : '') + offerCard(o)).join('') +
    '</div><div class="standalones">' + rest.map(offerCard).join('') + '</div>';
}
$('offer-grid').addEventListener('click', ev => {
  const b = ev.target.closest('[data-offer]');
  if (!b) return;
  const id = b.dataset.offer, o = offering(id);
  const t = ladderTier(id);
  if (state.picked.includes(id)) {
    state.picked = t >= 0
      ? state.picked.filter(x => ladderTier(x) < t || ladderTier(x) === -1)
      : state.picked.filter(x => x !== id);
  } else if (t >= 0) {
    LADDER.slice(0, t + 1).forEach(x => { if (!state.picked.includes(x)) state.picked.push(x); });
  } else {
    state.picked.push(id);
  }
  renderAll();
  announce(`${o.name} ${state.picked.includes(id) ? 'added' : 'removed'}.`);
});

/* ---------------- question rendering ---------------- */
function questionHTML(q, key) {
  const val = state.answers[key];
  let body = '';
  if (q.type === 'single') {
    body = `<div class="opts" role="radiogroup" aria-label="${q.label}">` + q.options.map(o =>
      `<button type="button" class="opt" role="radio" data-key="${key}" data-val="${o.v}" aria-checked="${String(val) === String(o.v)}">
        <span class="opt-l">${o.l}</span>${o.note ? `<span class="opt-n">${o.note}</span>` : ''}<span class="control-mark" aria-hidden="true">•</span>
      </button>`).join('') + '</div>';
  } else if (q.type === 'slider') {
    body = `<div class="range-row">
        <input type="range" id="r-${key.replace('.', '-')}" data-key="${key}" min="${q.min}" max="${q.max}" step="${q.step}" value="${val}" aria-label="${q.label}">
        <output for="r-${key.replace('.', '-')}">${num(val)}${q.unit || ''}</output>
      </div>`;
  }
  return `<div class="qblock"><span class="qlabel">${q.label}${q.note ? ` <i>${q.note}</i>` : ''}</span>${body}</div>`;
}

function renderAbout() {
  const needed = neededShared();
  $('about').hidden = needed.length === 0;
  $('about-questions').innerHTML = needed.map(k => questionHTML(SHARED[k], k)).join('');
}

function detailOwners() {
  return OFFERINGS.filter(o => {
    if (!state.picked.includes(o.id)) return false;
    if (o.id === 'chat' || o.id === 'plus') return convOwner() === o.id;
    return true;
  });
}
function visibleQuestions(o) {
  return (o.questions || []).filter(q => q.id !== 'promptTier' || Number(ans(o.id, 'prompts')) > 0);
}

function renderDetail() {
  const owners = detailOwners();
  $('detail').hidden = owners.length === 0;
  $('detail-questions').innerHTML = owners.map(o => {
    const per = o.id === 'fabric' ? null : perConversation(o.id);
    return `<div class="qgroup" data-group="${o.id}"><h3>${o.id === convOwner() && state.picked.includes('fabric') ? o.name + ' + Data Bridge' : o.name}</h3>` +
      `<p class="qgroup-inc">${o.includes.map(i => `<span>${i}</span>`).join('')}</p>` +
      (per ? `<p class="per-conv" data-per="${o.id}">${perConvText(o.id, per)}</p>` : '') +
      visibleQuestions(o).map(q => questionHTML(q, o.id + '.' + q.id)).join('') + '</div>';
  }).join('');
}
function perConvText(oid, per) {
  const unit = offering(oid).autonomous ? 'run' : 'conversation';
  return `≈ <b>${cr(per.total)}</b> per ${unit} (${fmt2(per.total * PAYG_PER_CREDIT)} at pay-as-you-go)`;
}

document.addEventListener('click', ev => {
  const b = ev.target.closest('.opt');
  if (!b) return;
  state.answers[b.dataset.key] = b.dataset.val;
  renderAll();
});
document.addEventListener('input', ev => {
  const r = ev.target;
  if (r.type !== 'range' || !r.dataset.key) return;
  const prev = state.answers[r.dataset.key];
  state.answers[r.dataset.key] = Number(r.value);
  const out = r.parentElement.querySelector('output');
  const q = findQuestion(r.dataset.key);
  if (out) out.textContent = num(r.value) + ((q && q.unit) || '');
  /* Showing or hiding the prompt-model question changes the layout; otherwise
     only refresh numbers so the slider keeps focus while dragging. */
  if (r.dataset.key.endsWith('.prompts') && (Number(prev) > 0) !== (Number(r.value) > 0)) {
    renderAll();
    const again = document.querySelector(`input[data-key="${r.dataset.key}"]`);
    if (again) again.focus();
  } else {
    renderNumbers();
  }
});
function findQuestion(key) {
  if (SHARED[key]) return SHARED[key];
  const [oid, qid] = key.split('.');
  const o = offering(oid);
  return o && o.questions.find(q => q.id === qid);
}

/* ---------------- the maths ---------------- */
/* Credits for one conversation (or autonomous run) of a product, before any
   Microsoft 365 Copilot zero-rating. */
function perConversation(oid) {
  const o = offering(oid);
  const a = id => Number(ans(oid, id) || 0);
  const parts = [];
  const add = (label, credits, detail) => { if (credits > 0) parts.push({ label, credits, detail }); };
  add('Classic answers', a('classic') * RATE.classic, `${a('classic')} × ${RATE.classic}`);
  add('Generative answers', a('gen') * RATE.generative, `${a('gen')} × ${RATE.generative}`);
  if (ans(oid, 'graph') === 'on') add('Tenant graph grounding', a('gen') * RATE.graph, `${a('gen')} × ${RATE.graph}`);
  add('Agent actions', a('actions') * RATE.action, `${a('actions')} × ${RATE.action}`);
  add('Agent flow actions', a('flow') / 100 * RATE.flowPer100, `${a('flow')} actions × ${RATE.flowPer100}/100`);
  if (a('prompts')) {
    const r = ans(oid, 'promptTier') === 'standard' ? RATE.promptStandard : RATE.promptBasic;
    add('Prompt tool', a('prompts') * r, `${a('prompts')} × ${r} (${ans(oid, 'promptTier')})`);
  }
  add('Content processing', a('pages') * RATE.contentPage, `${a('pages')} pages × ${RATE.contentPage}`);
  if (a('reason')) add('Reasoning model tokens', a('reason') / 1000 * RATE.premiumPer1k, `${num(a('reason'))} tokens × ${RATE.premiumPer1k}/1,000`);
  /* Data Bridge rides on the ladder agent's conversations. */
  if ((oid === 'chat' || oid === 'plus') && state.picked.includes('fabric')) {
    const share = Number(ans('fabric', 'share')) / 100;
    add('Fabric data agent calls', share * RATE.action, `${Math.round(share * 100)}% of conversations × ${RATE.action}`);
  }
  if (!o) return { parts, total: 0 };
  return { parts, total: parts.reduce((s, p) => s + p.credits, 0) };
}

/* Fraction of a product's conversations that Microsoft does not charge for. */
function zeroRatedShare(oid) {
  const o = offering(oid);
  if (!o.m365 || o.autonomous) return 0;
  const staff = Number(ans(oid, 'staff') || 0) / 100;
  const licensed = Number(state.answers.licensed) / 100;
  return staff * licensed;
}

function productUsage(oid) {
  const per = perConversation(oid);
  const conv = Number(ans(oid, 'conv') || 0);
  const gross = per.total * conv;
  const free = gross * zeroRatedShare(oid);
  return { per, conv, gross, free, credits: gross - free };
}

function creditCost(credits, mode) {
  const packsUp = Math.ceil(credits / PACK.credits);
  const packsDown = Math.floor(credits / PACK.credits);
  if (mode === 'payg') return { cost: credits * PAYG_PER_CREDIT, detail: `${num(credits)} × $0.01` };
  if (mode === 'packs') return { cost: packsUp * PACK.monthly, packs: packsUp, detail: `${packsUp} pack${packsUp === 1 ? '' : 's'} × $200 (${num(packsUp * PACK.credits)} credits)` };
  const over = credits - packsDown * PACK.credits;
  return {
    cost: packsDown * PACK.monthly + over * PAYG_PER_CREDIT,
    packs: packsDown,
    detail: `${packsDown} pack${packsDown === 1 ? '' : 's'} × $200 + ${num(over)} credits × $0.01`
  };
}

function calculate() {
  const rows = [];
  let credits = 0, free = 0, fabric = 0, flows = 0;

  const owner = convOwner();
  const usageIds = [];
  if (owner) usageIds.push(owner);
  state.picked.filter(id => ladderTier(id) === -1).forEach(id => usageIds.push(id));

  usageIds.forEach(id => {
    const o = offering(id);
    const u = productUsage(id);
    const unit = o.autonomous ? 'runs' : 'conversations';
    const lines = u.per.parts.map(p => ({
      label: p.label, detail: `${p.detail} = ${cr(p.credits)} per ${o.autonomous ? 'run' : 'conversation'}`,
      credits: p.credits * u.conv
    }));
    const extra = [];
    if (u.free > 0) extra.push({ label: 'Microsoft 365 Copilot users', detail: `${Math.round(zeroRatedShare(id) * 100)}% of conversations not charged`, credits: -u.free });
    let fab = 0, pa = 0, name = o.name;
    if (ladderTier(id) >= 0) {
      name = LADDER.filter(x => state.picked.includes(x)).map(x => offering(x).name).join(' + ');
      if (state.picked.includes('fabric')) {
        const cu = Number(ans('fabric', 'sku'));
        fab = cu * FABRIC_CU_HOUR * HOURS_MONTH;
        extra.push({ label: `Fabric capacity F${cu}`, detail: `${cu} CU × $0.18 per CU-hour × ${HOURS_MONTH} h, East US pay-as-you-go`, amount: fab });
      }
    }
    if (id === 'retention') {
      const runs = Number(ans('retention', 'cloudRuns'));
      if (ans('retention', 'paLicence') === 'payg') pa = runs * FLOW_RUN_PAYG;
      if (runs) extra.push({
        label: 'Power Automate cloud flows', detail: ans('retention', 'paLicence') === 'payg'
          ? `${num(runs)} premium runs × $0.60 (pay-as-you-go meter)`
          : `${num(runs)} runs on Power Automate licences you hold, not Copilot Credits`,
        amount: pa
      });
    }
    credits += u.credits; free += u.free; fabric += fab; flows += pa;
    rows.push({ id, name, unit, conv: u.conv, gross: u.gross, credits: u.credits, lines, extra, fab, pa });
  });

  const mode = state.answers.billing;
  const options = {};
  Object.keys(BILLING).forEach(k => { options[k] = creditCost(credits, k); });
  const chosen = options[mode];
  const other = fabric + flows;
  const licensedPicked = anyM365() && Number(state.answers.licensed) > 0;
  return { rows, credits, free, fabric, flows, options, mode, creditCostChosen: chosen.cost, total: chosen.cost + other, licensedPicked };
}

/* ---------------- tier ladder ---------------- */
const VOLUMES = [1000, 10000, 50000, 100000];
function renderTiers() {
  const ids = [];
  if (convOwner()) ids.push(convOwner());
  state.picked.filter(id => ladderTier(id) === -1).forEach(id => ids.push(id));
  $('usage').hidden = ids.length === 0;
  if (!ids.length) { $('tier-grid').innerHTML = ''; return; }
  const m = view().mult;
  $('tier-grid').innerHTML = ids.map(id => {
    const o = offering(id);
    const per = perConversation(id).total * (1 - zeroRatedShare(id));
    const mine = Number(ans(id, 'conv'));
    const vols = (o.autonomous ? [500, 2000, 5000, 20000] : VOLUMES).filter(v => v !== mine).concat([mine]).sort((a, b) => a - b);
    const max = Math.max(...vols) * per * PAYG_PER_CREDIT || 1;
    const unit = o.autonomous ? 'runs' : 'conversations';
    const rows = vols.map(v => {
      const c = v * per * PAYG_PER_CREDIT;
      const on = v === mine;
      return `<div class="tier-row${on ? ' is-on' : ''}">
        <span class="tier-bar"><i style="width:${Math.max(2, (c / max) * 100)}%"></i></span>
        <span class="tier-n">${num(v)} ${unit}${on ? ' · yours' : ''} · ${num(v * per)} credits</span>
        <strong>${fmt(c * m)}</strong>
      </div>`;
    }).join('');
    const title = ladderTier(id) >= 0 ? LADDER.filter(x => state.picked.includes(x)).map(x => offering(x).name).join(' + ') : o.name;
    return `<div class="tier-card"><h3>${title}</h3>${rows}<p class="tier-note">${view().label.toLowerCase()} at pay-as-you-go ($0.01 per credit), with your answers from step 03${zeroRatedShare(id) ? ' and licensed-user savings' : ''}.${ladderTier(id) >= 0 && state.picked.includes('fabric') ? ' Fabric capacity is extra.' : ''}</p></div>`;
  }).join('');
}
function renderRates() {
  $('rates').innerHTML = RATE_CARD.map(([k, v, n]) => `<div><dt>${k}</dt><dd>${v}<i>${n}</i></dd></div>`).join('');
}

/* ---------------- quote ---------------- */
function renderQuote(q) {
  if (!state.picked.length) {
    $('quote-table').innerHTML = '<p class="empty">Pick at least one agent above.</p>';
    $('quote-assumptions').textContent = '';
    return;
  }
  const m = view().mult;
  const per = state.answers.view === 'year' ? 'a year' : 'a month';
  let html = '<div class="lines">';
  q.rows.forEach(r => {
    html += `<div class="line-group"><h3>${r.name}</h3>`;
    html += `<div class="line"><span class="line-l">Volume<i>${num(r.conv)} ${r.unit} a month</i></span><b>${num(r.gross)} credits</b></div>`;
    r.lines.forEach(l => {
      html += `<div class="line"><span class="line-l">${l.label}<i>${l.detail}</i></span><b>${num(l.credits)} cr</b></div>`;
    });
    r.extra.forEach(l => {
      if (l.credits !== undefined) html += `<div class="line"><span class="line-l">${l.label}<i>${l.detail}</i></span><b>${num(l.credits)} cr</b></div>`;
      else html += `<div class="line"><span class="line-l">${l.label}<i>${l.detail}</i></span><b>${l.amount ? fmt(l.amount * m) : 'not in this quote'}</b></div>`;
    });
    html += `<div class="line is-sub"><span class="line-l">Billable Copilot Credits</span><b>${num(r.credits)} / month</b></div>`;
    html += '</div>';
  });

  /* Licences we could not price. */
  if (q.licensedPicked) {
    html += `<div class="line-group"><h3>Microsoft 365 Copilot licences</h3><div class="line"><span class="line-l">Per-user licence (now branded Microsoft Copilot)<i>Academic offering for faculty, staff and students 13+ through EES or CSP. We could not verify a current list price, so none is shown.</i></span><b class="is-quote">${LICENCE_QUOTE}</b></div></div>`;
  }

  /* Three ways to pay for the same credits. */
  const best = Object.keys(q.options).reduce((a, b) => (q.options[b].cost < q.options[a].cost ? b : a));
  html += `<div class="compare" role="group" aria-label="Copilot Credit cost by purchase option">` +
    Object.keys(BILLING).map(k => `<div class="compare-card${k === q.mode ? ' is-chosen' : ''}">
      <span class="c-l">${BILLING[k].label}${k === q.mode ? ' · chosen' : ''}</span>
      <strong>${fmt(q.options[k].cost * m)}</strong>
      <span class="c-n">${q.credits ? q.options[k].detail : 'no billable credits'} ${per === 'a year' ? '× 12' : ''}</span>
      ${k === best && q.credits ? '<span class="c-best">Lowest</span>' : ''}
    </div>`).join('') + '</div>';

  html += `<div class="grand"><span>${view().label}, credits${q.fabric ? ' + Fabric' : ''}${q.flows ? ' + flows' : ''}</span><strong>${fmt(q.total * m)}</strong></div></div>`;
  $('quote-table').innerHTML = html;

  const a = [];
  a.push(`${num(q.credits)} billable Copilot Credits a month${q.free ? `, after ${num(q.free)} credits of Microsoft 365 Copilot licensed use that isn't charged` : ''}.`);
  a.push('Capacity packs are $200 a month for 25,000 credits, billed annually; unused credits don\'t roll over, and agents are blocked at 125% unless the environment also has pay-as-you-go.');
  a.push(`For steady volume, the one-year Copilot Credit pre-purchase plan starts at ${num(P3_TIER1.credits)} credits with a ${Math.round(P3_TIER1.discount * 100)}% discount.`);
  if (state.picked.includes('fabric')) a.push('Fabric capacity is priced at the East US pay-as-you-go rate and assumes it runs all month. Azure bills it per second, prices vary by region and reservations cost less. F2 is the minimum Microsoft lists. Size it to your query load. Each Fabric data agent call is counted here as one agent action, which is our assumption.');
  if (state.picked.includes('retention')) a.push('Retention runs autonomously, so Microsoft 365 Copilot licences never zero-rate it.');
  if (state.picked.includes('recruitment')) a.push('Recruitment visitors are anonymous, so every conversation is billed.');
  if (state.picked.includes('transfer-credit')) a.push('Transfer credit applicants are usually not staff, so no Microsoft 365 Copilot zero-rating applies; transcript pages are billed as content processing (8 credits per page).');
  if (state.picked.includes('alumni-advancement')) a.push('Alumni on the website are always billed; only gift officers using the agent in Teams under their own licensed identity can be zero-rated.');
  if (state.picked.includes('research-administration')) a.push('Research administration users are faculty and staff, so licensed users reduce the bill the most here.');
  if (state.picked.some(id => ['student-services','financial-aid','career-services','teaching-assistant'].includes(id))) a.push('Student-facing agents are billed for student conversations; Microsoft 365 Copilot licences only zero-rate employee-facing use.');
  a.push('Students count as unlicensed. Teams publishing adds no channel fee. Copilot Studio user licences for makers are $0. Partner build and support services are not included.');
  $('quote-assumptions').textContent = a.join(' ');
}

function renderTotalBar(q) {
  const m = view().mult;
  $('tb-total').textContent = state.picked.length ? fmt(q.total * m) : '$0';
  $('tb-label').textContent = state.picked.length ? `${view().label}, ${BILLING[q.mode].label.toLowerCase()}` : 'Nothing selected';
  $('tb-detail').innerHTML = state.picked.length
    ? `<span><i>Credits / month</i>${num(q.credits)}</span><span><i>Credits cost</i>${fmt(q.creditCostChosen * m)}</span><span><i>Fabric capacity</i>${q.fabric ? fmt(q.fabric * m) : '—'}</span><span><i>Licences</i>${q.licensedPicked ? 'quote' : '—'}</span>`
    : '<span>Pick an agent to see a number.</span>';
}
$('tb-toggle').addEventListener('click', () => {
  const open = $('tb-detail').hidden;
  $('tb-detail').hidden = !open;
  $('tb-toggle').setAttribute('aria-expanded', String(open));
});

/* ---------------- notes ---------------- */
$('notes-on').addEventListener('change', e => {
  document.querySelectorAll('.pnote').forEach(p => { p.hidden = !e.target.checked; });
});

/* ---------------- copy, save, reset ---------------- */
/* Saved quotes live in this browser only. Nothing is sent anywhere. */
const SAVED_KEY = 'campus-copilot-quotes';
function readSaved() {
  try { const raw = localStorage.getItem(SAVED_KEY); return raw ? JSON.parse(raw) : []; }
  catch (e) { return []; }
}
function writeSaved(rows) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(rows)); return true; }
  catch (e) { return false; }
}
function renderSaved() {
  const rows = readSaved();
  $('saved-bar').hidden = rows.length === 0;
  $('saved-count').textContent = rows.length === 1 ? '1 quote saved on this device' : `${rows.length} quotes saved on this device`;
}
function csvCell(v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; }

$('download-saved').addEventListener('click', () => {
  const rows = readSaved();
  if (!rows.length) return;
  const head = ['Saved at', 'Name', 'Contact', 'Agents', 'Credits per month', 'Billing', 'Credits cost per month', 'Fabric per month', 'Flows per month', 'Total per month', 'Licences'];
  const body = rows.map(r => [r.savedAt, r.name, r.contact, r.agents, r.credits, r.billing, r.creditCost, r.fabric, r.flows, r.total, r.licences].map(csvCell).join(','));
  const blob = new Blob([[head.map(csvCell).join(','), ...body].join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'campus-copilot-quotes.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
  announce(`${rows.length} quotes downloaded.`);
});
$('clear-saved').addEventListener('click', () => {
  if (!window.confirm('Delete every saved quote on this device? This cannot be undone.')) return;
  try { localStorage.removeItem(SAVED_KEY); } catch (e) { /* storage unavailable */ }
  renderSaved();
  announce('Saved quotes cleared.');
});

$('copy-quote').addEventListener('click', () => {
  const q = calculate();
  if (!state.picked.length) { announce('Pick an agent first.'); return; }
  const name = $('lead-name').value.trim();
  const contact = $('lead-contact').value.trim();
  const lines = ['Campus Copilot on Microsoft Copilot Studio: indicative quote', ''];
  if (name) lines.push(`Prepared for: ${name}`);
  if (contact) lines.push(`Contact: ${contact}`);
  if (name || contact) lines.push('');
  q.rows.forEach(r => {
    lines.push(`${r.name}: ${num(r.conv)} ${r.unit}/month, ${num(r.credits)} billable credits/month`);
    if (r.fab) lines.push(`  Fabric capacity: ${fmt(r.fab)}/month`);
    if (r.pa) lines.push(`  Power Automate runs: ${fmt(r.pa)}/month`);
  });
  lines.push('');
  lines.push(`Copilot Credits: ${num(q.credits)}/month`);
  Object.keys(BILLING).forEach(k => lines.push(`  ${BILLING[k].label}: ${fmt(q.options[k].cost)}/month`));
  lines.push(`Total (${BILLING[q.mode].label}): ${fmt(q.total)}/month, ${fmt(q.total * 12)}/year`);
  if (q.licensedPicked) lines.push(`Microsoft 365 Copilot licences: ${LICENCE_QUOTE}`);
  lines.push('');
  lines.push('Indicative, list prices (USD), excl. tax; academic and enterprise agreements differ.');
  lines.push('Sources: Microsoft Copilot Studio Licensing Guide (Nov 2026); learn.microsoft.com billing rates (updated 31 Oct 2026).');
  const text = lines.join('\n');

  const saved = readSaved();
  saved.push({
    savedAt: new Date().toISOString(), name, contact,
    agents: q.rows.map(r => r.name).join('; '),
    credits: Math.round(q.credits), billing: BILLING[q.mode].label,
    creditCost: Math.round(q.creditCostChosen), fabric: Math.round(q.fabric), flows: Math.round(q.flows),
    total: Math.round(q.total), licences: q.licensedPicked ? LICENCE_QUOTE : ''
  });
  writeSaved(saved);
  renderSaved();

  const done = () => {
    const b = $('copy-quote');
    b.textContent = 'Copied and saved';
    setTimeout(() => { b.textContent = 'Copy quote'; }, 1600);
    announce('Quote copied and saved on this device.');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, () => announce('Quote saved. Copying is blocked in this browser.'));
  } else {
    announce('Quote saved. Copying is not available in this browser.');
  }
});

$('reset-all').addEventListener('click', () => {
  state.picked = ['chat'];
  seedDefaults();
  $('lead-name').value = '';
  $('lead-contact').value = '';
  renderAll();
  announce('Builder reset.');
  $('offerings').scrollIntoView();
});

/* ---------------- render ---------------- */
/* Light refresh while a slider moves: numbers only, no DOM rebuild of the
   question being dragged. */
function renderNumbers() {
  document.querySelectorAll('[data-per]').forEach(p => {
    p.innerHTML = perConvText(p.dataset.per, perConversation(p.dataset.per));
  });
  const q = calculate();
  renderTiers();
  renderQuote(q);
  renderTotalBar(q);
}
function renderAll() {
  renderOfferings();
  renderAbout();
  renderDetail();
  const q = calculate();
  renderTiers();
  renderQuote(q);
  renderTotalBar(q);
  renderSaved();
}
renderRates();
renderAll();
