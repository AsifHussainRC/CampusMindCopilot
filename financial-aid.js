'use strict';

const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* Small helper: element with class and text, never innerHTML for content. */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function pressGroup(buttons, active, attr) {
  buttons.forEach((b) => b.setAttribute(attr || 'aria-pressed', String(b === active)));
}

/* ================= presenter notes ================= */
(function notes() {
  const box = $('notes-on');
  const apply = () => document.querySelectorAll('.pnote').forEach((p) => { p.hidden = !box.checked; });
  box.addEventListener('change', apply);
  apply();
})();

/* ================= section nav ================= */
(function sectionNav() {
  const jump = $('section-jump');
  jump.addEventListener('change', (e) => {
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
      document.querySelectorAll('main section').forEach((s) => { if (s.getBoundingClientRect().top <= line) id = s.id; });
      jump.value = id;
    });
  }, { passive: true });
})();

/* ================= thread player ================= */
/* Each step: [kind, who, text, sources[]]. kind: you | ai | sys | staff */
const WHO_CLASS = { you: 'is-you', ai: 'is-ai', sys: 'is-sys', staff: 'is-staff' };
const timersByHost = new WeakMap();

function stopThread(host) {
  (timersByHost.get(host) || []).forEach(clearTimeout);
  timersByHost.set(host, []);
}

function playThread(host, steps, onDone) {
  stopThread(host);
  host.textContent = '';
  const nodes = steps.map(([kind, who, text, srcs]) => {
    const m = el('div', 'msg ' + WHO_CLASS[kind]);
    m.appendChild(el('span', 'msg-who', who));
    m.appendChild(el('p', 'msg-body', text));
    (srcs || []).forEach((s) => m.appendChild(el('span', 'src', s)));
    m.hidden = true;
    host.appendChild(m);
    return m;
  });
  const show = (m) => { m.hidden = false; requestAnimationFrame(() => m.classList.add('is-in')); };
  if (reduceMotion.matches) {
    nodes.forEach((m) => { m.hidden = false; m.classList.add('is-in'); });
    if (onDone) onDone();
    return;
  }
  const timers = [];
  let t = 0;
  nodes.forEach((m, i) => {
    const kind = steps[i][0];
    t += kind === 'sys' ? 380 : kind === 'you' ? 420 : 720;
    timers.push(setTimeout(() => {
      show(m);
      if (i === nodes.length - 1 && onDone) onDone();
    }, t));
  });
  timersByHost.set(host, timers);
}

/* ================= 01 · the route ================= */
(function route() {
  const ROUTES = {
    today: {
      steps: [
        ['Registration portal', '“Hold: see Student Accounts.” No reason given', 'Day 1'],
        ['Student accounts desk', 'The balance is overdue because aid has not paid out', 'Day 2'],
        ['Financial aid office', 'Aid is waiting on a document nobody mentioned', 'Day 4'],
        ['Back to the aid portal', 'Finds the upload page, unsure which form', 'Day 6'],
        ['Registration', 'Hold still there until the document is reviewed', 'Day 9+']
      ],
      note: 'Three offices, five stops, and the student still isn\'t sure what to do next.'
    },
    agent: {
      steps: [
        ['One question in chat', '“Why is there a hold on my account?”', '0 min'],
        ['Agent reads three systems', 'Holds, balance, and aid checklist, for this student only', 'seconds'],
        ['One answer, with owners', 'The hold, why it exists, and the one missing document behind it', '1 min'],
        ['Next step in the same chat', 'Upload the document, or book a counselor', 'same day']
      ],
      note: 'Same rules, same offices. The student just finds out on the first try.'
    }
  };
  const list = $('route');
  const note = $('route-note');
  const buttons = Array.from(document.querySelectorAll('[data-route]'));
  let timers = [];

  function show(key) {
    timers.forEach(clearTimeout);
    timers = [];
    const r = ROUTES[key];
    list.textContent = '';
    list.classList.toggle('is-agent', key === 'agent');
    r.steps.forEach(([title, sub, when], i) => {
      const li = el('li');
      li.appendChild(el('i', null, String(i + 1)));
      const d = el('div');
      d.appendChild(el('strong', null, title));
      d.appendChild(el('span', null, sub));
      li.appendChild(d);
      li.appendChild(el('em', null, when));
      list.appendChild(li);
      if (reduceMotion.matches) li.classList.add('is-in');
      else timers.push(setTimeout(() => li.classList.add('is-in'), 90 * (i + 1)));
    });
    note.textContent = r.note;
    pressGroup(buttons, buttons.find((b) => b.dataset.route === key));
  }
  buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.route)));
  show('today');
})();

/* ================= 02 · my account ================= */
(function account() {
  const THREADS = {
    out: [
      ['you', 'VISITOR', 'Why is there a hold on my account?'],
      ['sys', 'KNOWLEDGE', 'search · Student accounts pages (public site)'],
      ['ai', 'CAMPUS COPILOT', 'Holds are usually placed for an unpaid balance, a missing document, or an office that needs to see you first. I can\'t see your account until you sign in with your campus account. Want to sign in now?', ['Knowledge · Student accounts FAQ']]
    ],
    in: [
      ['you', 'DANI', 'Why is there a hold on my account?'],
      ['sys', 'TOOLS', 'sis-mcp · get_holds(user = signed-in student)'],
      ['sys', 'TOOLS', 'bursar · get_account_summary · aid · get_checklist'],
      ['ai', 'CAMPUS COPILOT', 'You have one hold, from Student Accounts. It\'s there because $412.50 has been past due since 15 October, and it blocks spring registration.', ['SIS', 'Bursar']],
      ['ai', 'CAMPUS COPILOT', 'The good news: $1,200 of your aid is ready to pay into your account, which would cover the balance. It\'s waiting on one document, your verification worksheet. Want me to show you what\'s missing?', ['Aid system']]
    ]
  };
  const host = $('account-thread');
  const btn = $('account-play');
  const bar = $('auth-bar');
  const ledger = $('ledger');
  const buttons = Array.from(document.querySelectorAll('[data-auth]'));
  let mode = 'in';

  function setMode(m) {
    mode = m;
    stopThread(host);
    host.textContent = '';
    ledger.hidden = true;
    btn.disabled = false;
    btn.textContent = 'Ask the question';
    bar.textContent = m === 'in' ? 'Signed in · Dani Okonkwo · only this student\'s record' : 'Not signed in · public information only';
    bar.parentElement.classList.toggle('is-auth', m === 'in');
    pressGroup(buttons, buttons.find((b) => b.dataset.auth === m));
  }
  buttons.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.auth)));
  btn.addEventListener('click', () => {
    btn.disabled = true;
    ledger.hidden = true;
    playThread(host, THREADS[mode], () => {
      btn.disabled = false;
      btn.textContent = 'Ask again';
      if (mode === 'in') ledger.hidden = false;
    });
  });
  setMode('in');
})();

/* ================= 03 · timeline, checklist, upload ================= */
(function documents() {
  const STAGES = [
    ['Aid application', 'done', 'The student files the aid application (in the US, the FAFSA, plus any institutional form). The aid office receives the record.'],
    ['Record received', 'done', 'The aid system loads the application and builds the student\'s checklist for the aid year.'],
    ['Documents requested', 'now', 'The school asks for what\'s still needed. If an application is selected for verification, that includes verification documents. Dani has one item open.'],
    ['Staff review', 'next', 'Aid staff check each document. Only staff can accept a document or complete verification.'],
    ['Aid offer', 'next', 'Once the file is complete, the office sends or updates the aid offer. Amounts are decided by staff and the aid system, never by the agent.'],
    ['Accept or decline', 'next', 'The student reviews the offer and accepts or declines each part in the aid portal.'],
    ['Paid to account', 'next', 'Aid pays out against charges. If aid exceeds charges, the credit balance is refunded on the institution\'s schedule.']
  ];
  const tl = $('timeline');
  const detail = $('stage-detail');
  const stageButtons = [];
  STAGES.forEach(([name, state, text], i) => {
    const li = el('li', 'is-' + state);
    const b = el('button');
    b.type = 'button';
    b.appendChild(el('span', null, String(i + 1)));
    b.appendChild(el('span', null, name));
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', name + (state === 'done' ? ', complete' : state === 'now' ? ', current stage' : ', upcoming'));
    b.addEventListener('click', () => select(i));
    li.appendChild(b);
    tl.appendChild(li);
    stageButtons.push(b);
  });
  function select(i) {
    pressGroup(stageButtons, stageButtons[i]);
    detail.textContent = '';
    detail.appendChild(el('b', null, STAGES[i][0] + '. '));
    detail.appendChild(document.createTextNode(STAGES[i][2]));
  }
  select(2);

  const ITEMS = [
    ['Aid application on file', 'Received from the aid system', 'ok'],
    ['Statement of educational purpose', 'Signed online in September', 'ok'],
    ['Verification worksheet', 'Requested 2 October · due 1 December', 'miss'],
    ['Entrance counseling (loans)', 'Completed', 'ok']
  ];
  const PIPE = [
    ['01', 'Attach in chat', 'PDF or photo, in Teams or the portal', false],
    ['02', 'Topic checks it', 'File type and size, which checklist item', false],
    ['03', 'Agent flow files it', 'SharePoint library, tagged by student, aid year, document', false],
    ['04', 'Review queue', 'Dataverse row: ready for review', false],
    ['05', 'Aid staff decide', 'Accept, or ask for something else', true]
  ];
  const list = $('checklist');
  const pipe = $('pipeline');
  const status = $('upload-status');
  const pipeNodes = PIPE.map(([n, t, s, staff]) => {
    const li = el('li', staff ? 'is-staff' : '');
    li.appendChild(el('b', null, n));
    li.appendChild(el('strong', null, t));
    li.appendChild(document.createTextNode(s));
    pipe.appendChild(li);
    return li;
  });
  let timers = [];

  ITEMS.forEach(([name, sub, state]) => {
    const li = el('li');
    const d = el('div');
    d.appendChild(el('strong', null, name));
    d.appendChild(el('small', null, sub));
    li.appendChild(d);
    const act = el('div', 'row-actions');
    const pill = el('span', 'pill ' + state, state === 'ok' ? 'Complete' : 'Missing');
    act.appendChild(pill);
    if (state === 'miss') {
      const b = el('button', null, 'Upload in chat');
      b.type = 'button';
      b.addEventListener('click', () => upload(b, pill, d.querySelector('small')));
      act.appendChild(b);
    }
    li.appendChild(act);
    list.appendChild(li);
  });

  function upload(btn, pill, small) {
    timers.forEach(clearTimeout);
    timers = [];
    btn.disabled = true;
    pipeNodes.forEach((n) => n.classList.remove('is-on'));
    status.textContent = 'verification-worksheet.pdf attached…';
    const finish = () => {
      pill.className = 'pill review';
      pill.textContent = 'Under review · staff';
      small.textContent = 'Received 3 November · waiting for aid staff';
      btn.hidden = true;
      status.textContent = 'Filed for review. The agent told Dani it\'s received, not that it\'s approved.';
    };
    if (reduceMotion.matches) {
      pipeNodes.forEach((n) => n.classList.add('is-on'));
      finish();
      return;
    }
    pipeNodes.forEach((n, i) => {
      timers.push(setTimeout(() => {
        n.classList.add('is-on');
        if (i === pipeNodes.length - 1) finish();
      }, 520 * (i + 1)));
    });
  }
})();

/* ================= 04 · plans, refunds, tax forms ================= */
(function money() {
  const SCENES = {
    plan: {
      bar: 'Payment plan · enrolment needs the student\'s yes',
      steps: [
        ['you', 'DANI', 'Spring is $2,940 after aid. Can I pay that in parts?'],
        ['sys', 'TOOLS', 'bursar · get_plan_options(term = spring)'],
        ['ai', 'CAMPUS COPILOT', 'Yes. The spring plan splits it into four monthly payments, starting 15 January. Here are the terms. I\'ll only enrol you if you confirm.', ['Bursar', 'Knowledge · Payment plan policy']]
      ],
      confirm: true
    },
    refund: {
      bar: 'Refund · read only',
      steps: [
        ['you', 'DANI', 'When do I get my refund?'],
        ['sys', 'TOOLS', 'bursar · get_refund_status · get_refund_method'],
        ['ai', 'CAMPUS COPILOT', 'You don\'t have a credit balance yet, so there\'s no refund scheduled. Once your $1,200 in aid pays out, it will first cover the $412.50 you owe. Any amount left is refunded by direct deposit, the method on file, following the student-accounts refund schedule.', ['Bursar', 'Knowledge · Refund schedule']],
        ['ai', 'CAMPUS COPILOT', 'I can\'t promise a date until staff finish reviewing your document. Want a message when the aid pays out?']
      ]
    },
    tax: {
      bar: 'Tax form · answered from the institution\'s FAQ',
      steps: [
        ['you', 'DANI', 'My parents are asking for my 1098-T. What is it and where do I get it?'],
        ['sys', 'KNOWLEDGE', 'search · Student accounts › Tax forms FAQ'],
        ['ai', 'CAMPUS COPILOT', 'The 1098-T is the annual tuition statement the university issues for US tax purposes. It reports amounts related to qualified tuition and scholarships for the calendar year. You can download yours from the student portal under Account › Tax forms once it\'s posted.', ['Knowledge · Tax forms FAQ']],
        ['ai', 'CAMPUS COPILOT', 'I can\'t tell you how to use it on a tax return. For that, a tax professional or the IRS guidance linked in the FAQ is the right place.']
      ]
    }
  };
  const host = $('money-thread');
  const bar = $('money-bar');
  const btn = $('money-play');
  const panel = $('money-panel');
  const confirm = $('plan-confirm');
  const status = $('money-status');
  const tabs = Array.from(document.querySelectorAll('[data-money]'));
  let current = 'plan';

  function select(key, focus) {
    current = key;
    stopThread(host);
    host.textContent = '';
    confirm.hidden = true;
    status.textContent = '';
    btn.disabled = false;
    btn.textContent = 'Play the conversation';
    bar.textContent = SCENES[key].bar;
    tabs.forEach((t) => {
      const on = t.dataset.money === key;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on) { panel.setAttribute('aria-labelledby', t.id); if (focus) t.focus(); }
    });
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t.dataset.money, false));
    t.addEventListener('keydown', (e) => {
      const last = tabs.length - 1;
      let n = null;
      if (e.key === 'ArrowRight') n = tabs[i === last ? 0 : i + 1];
      else if (e.key === 'ArrowLeft') n = tabs[i === 0 ? last : i - 1];
      if (n) { e.preventDefault(); select(n.dataset.money, true); }
    });
  });

  btn.addEventListener('click', () => {
    btn.disabled = true;
    confirm.hidden = true;
    status.textContent = '';
    const scene = SCENES[current];
    playThread(host, scene.steps, () => {
      btn.disabled = false;
      btn.textContent = 'Play again';
      if (scene.confirm) {
        confirm.hidden = false;
        $('plan-yes').disabled = false;
        $('plan-no').disabled = false;
        status.textContent = 'Waiting for Dani to confirm. Nothing has been written to the bursar system.';
      }
    });
  });

  function answer(yes) {
    $('plan-yes').disabled = true;
    $('plan-no').disabled = true;
    const m = el('div', 'msg is-ai is-in');
    m.appendChild(el('span', 'msg-who', 'CAMPUS COPILOT'));
    m.appendChild(el('p', 'msg-body', yes
      ? 'Done. You\'re enrolled in the spring plan, and a confirmation is on its way to your campus email. Your first payment is due 15 January.'
      : 'No problem, nothing has changed. The plan is open until the enrolment deadline if you change your mind.'));
    if (yes) m.appendChild(el('span', 'src', 'Bursar · enrol_payment_plan'));
    host.appendChild(m);
    confirm.hidden = true;
    status.textContent = yes
      ? 'Enrolled after Dani confirmed. Plan terms came from the bursar system, not from the agent.'
      : 'Declined. No tool ran.';
  }
  $('plan-yes').addEventListener('click', () => answer(true));
  $('plan-no').addEventListener('click', () => answer(false));
  select('plan', false);
})();

/* ================= 05 · nudges + handoff ================= */
(function nudges() {
  const MODES = {
    blast: {
      steps: [
        ['Oct 1', 'One email to every aid applicant', '“If you have outstanding documents, please submit them.” Most don\'t apply.', ''],
        ['Nov 20', 'Same email again', 'Lands next to the exam timetable.', 'is-dim'],
        ['Dec 1', 'Deadline passes', 'Aid stays unpaid; the balance hold stays on.', 'is-dim'],
        ['Jan', 'Student finds out at registration', 'The front desk queue starts here.', 'is-dim']
      ],
      note: 'Everyone gets the same message, so the students who need it can\'t tell.'
    },
    flow: {
      steps: [
        ['Day −45', 'Personal message in Teams', '“Your verification worksheet is the one item left. Upload it here.” Email as backup.', ''],
        ['Day −14', 'Reminder, only if still missing', 'Names the document, the deadline, and what it unlocks.', ''],
        ['Day −5', 'Aid counselor gets a short list', 'Students still missing an item, to call personally.', 'is-person'],
        ['Day 0', 'Stops on its own', 'The flow skips anyone whose item is filed or under review.', '']
      ],
      note: 'Each student hears only about their own missing item, and a person steps in near the deadline.'
    }
  };
  const track = $('nudge-track');
  const note = $('nudge-note');
  const buttons = Array.from(document.querySelectorAll('[data-nudge]'));
  function show(key) {
    track.textContent = '';
    MODES[key].steps.forEach(([when, title, sub, cls]) => {
      const li = el('li', cls);
      li.appendChild(el('em', null, when));
      const d = el('div');
      d.appendChild(el('strong', null, title));
      d.appendChild(el('span', null, sub));
      li.appendChild(d);
      track.appendChild(li);
    });
    note.textContent = MODES[key].note;
    pressGroup(buttons, buttons.find((b) => b.dataset.nudge === key));
  }
  buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.nudge)));
  show('blast');

  const HANDOFF = [
    ['you', 'DANI', 'Honestly if I can\'t sort the balance I\'ll just sit out spring.'],
    ['ai', 'CAMPUS COPILOT', 'That\'s worth talking through with a person before you decide. A financial aid counselor can look at options I can\'t, like emergency funds or a review of your situation. Want me to connect you now?'],
    ['you', 'DANI', 'Yes please.'],
    ['sys', 'TOPIC', 'Escalate → Transfer conversation · summary + variables passed'],
    ['staff', 'TAMSIN HALE · AID COUNSELOR', 'Hi Dani, I\'ve read the conversation, so you don\'t have to repeat anything. Your worksheet is in my queue now, and I\'d like to go through spring with you. Are you free at 2 today?']
  ];
  const host = $('handoff-thread');
  const btn = $('handoff-play');
  const card = $('handoff-card');
  btn.addEventListener('click', () => {
    btn.disabled = true;
    card.hidden = true;
    playThread(host, HANDOFF, () => {
      card.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Play again';
    });
  });
})();

/* ================= 06 · aid office view ================= */
(function office() {
  const CUTS = {
    cohort: {
      caption: 'Students with incomplete verification, by cohort',
      rows: [['Entering first-year', 186, true], ['Continuing', 94], ['Transfer-in', 61, true], ['Graduate', 23]],
      note: 'Entering and transfer students carry most of it. Their first term is when a stuck file costs the most.'
    },
    item: {
      caption: 'Open verification items, by document',
      rows: [['Verification worksheet', 171, true], ['Income documentation', 118], ['Identity / statement', 47], ['Household details', 28]],
      note: 'One form is the largest share of the backlog. That can be a wording problem as much as a student problem.'
    },
    deadline: {
      caption: 'Students with open items, by days to the aid deadline',
      rows: [['Under 7 days', 38, true], ['7–21 days', 112], ['22–45 days', 141], ['Over 45 days', 73]],
      note: 'The 38 under seven days go to counselors to call. The scheduled flow keeps reminding the rest.'
    }
  };
  const bars = $('cut-bars');
  const cap = $('cut-caption');
  const note = $('cut-note');
  const buttons = Array.from(document.querySelectorAll('[data-cut]'));
  function show(key) {
    const c = CUTS[key];
    const max = Math.max.apply(null, c.rows.map((r) => r[1]));
    bars.textContent = '';
    cap.textContent = c.caption;
    c.rows.forEach(([label, v, hot]) => {
      const row = el('div');
      row.appendChild(el('span', null, label));
      const i = el('i', hot ? 'is-hot' : '');
      i.style.width = Math.round((v / max) * 100) + '%';
      row.appendChild(i);
      row.appendChild(el('b', null, String(v)));
      bars.appendChild(row);
    });
    note.textContent = c.note;
    pressGroup(buttons, buttons.find((b) => b.dataset.cut === key));
  }
  buttons.forEach((b) => b.addEventListener('click', () => show(b.dataset.cut)));
  show('cohort');

  const OUT = {
    before: [['9 days', 'from hold to first clear explanation'], ['58%', 'of files complete by the aid deadline'], ['1 in 3', 'front-desk visits that were a status question']],
    after: [['Same day', 'from hold to first clear explanation'], ['81%', 'of files complete by the aid deadline'], ['1 in 8', 'front-desk visits that were a status question']]
  };
  const tiles = $('tiles');
  const outButtons = Array.from(document.querySelectorAll('[data-out]'));
  function out(key) {
    tiles.textContent = '';
    OUT[key].forEach(([v, l]) => {
      const t = el('div', 'tile' + (key === 'after' ? ' is-better' : ''));
      t.appendChild(el('strong', null, v));
      t.appendChild(el('span', null, l));
      tiles.appendChild(t);
    });
    pressGroup(outButtons, outButtons.find((b) => b.dataset.out === key));
  }
  outButtons.forEach((b) => b.addEventListener('click', () => out(b.dataset.out)));
  out('before');
})();

/* ================= 07 · how it's built ================= */
(function built() {
  const PARTS = [
    ['Copilot Studio agent', 'Instructions, topics, tools, generative orchestration', 'One student-facing agent in Teams and the student portal, with Entra ID sign-in. Topics handle the fixed paths (document upload, escalation); generative orchestration picks tools for everything else.', ['Topics', 'Generative orchestration', 'Authenticate with Microsoft', 'File uploads on'], true],
    ['SIS and bursar tools', 'MCP server or custom connector', 'Holds, balance, refunds and payment-plan enrolment. Most SIS and bursar platforms have no Power Platform connector, so these come from an MCP server or a custom connector over the vendor API.', ['MCP server (GA)', 'Custom connector', '“Ask the end user before running”']],
    ['Aid system tools', 'Checklist, offer status, deadlines', 'Read-only tools for the aid checklist and offer status. Writes to aid records stay in the aid system, done by staff.', ['MCP server', 'Custom connector', 'Read only']],
    ['Knowledge', 'SharePoint and public pages', 'Student-accounts FAQ, refund schedule, payment-plan policy, tax-form FAQ. Answers come with citations.', ['SharePoint', 'Public website']],
    ['Agent flows', 'Power Automate', 'File the uploaded document, create the review row, enrol a confirmed payment plan, send confirmations.', ['SharePoint connector', 'Microsoft Dataverse', 'Office 365 Outlook']],
    ['Scheduled reminders', 'Cloud flow · Recurrence', 'Finds students with open items near a deadline and messages each one in Teams, with email as backup.', ['Microsoft Teams connector', 'Post as Copilot Studio agent', 'Office 365 Outlook']],
    ['Review queue', 'Dataverse + staff app', 'Every uploaded document lands as a row aid staff work through. Optional approval step for exceptions.', ['Microsoft Dataverse', 'Approvals']],
    ['Counselor handoff', 'Escalate topic', 'Transfer conversation to a live engagement hub, or book a counselor and post the summary to the aid team.', ['Transfer conversation', 'Microsoft Teams']],
    ['Fabric data agent', 'Connected agent · preview', 'For aid-office staff only: verification backlog, deadlines, cohorts. Validated in Teams only. User authentication.', ['Microsoft Fabric', 'OneLake', 'Teams only']],
    ['Governance', 'Admin and audit', 'Who can use which agent, where data can flow, and what happened.', ['Entra ID groups', 'DLP policies', 'Copilot Studio analytics', 'Microsoft Purview audit'], true]
  ];
  const host = $('stack');
  const detail = $('stack-detail');
  const buttons = [];
  PARTS.forEach(([name, sub, text, chips, core], i) => {
    const wrap = el('div', core ? 'is-core' : '');
    wrap.setAttribute('role', 'listitem');
    const b = el('button');
    b.type = 'button';
    b.appendChild(el('strong', null, name));
    b.appendChild(el('span', null, sub));
    b.addEventListener('click', () => select(i));
    wrap.appendChild(b);
    host.appendChild(wrap);
    buttons.push(b);
  });
  function select(i) {
    const [name, , text, chips] = PARTS[i];
    pressGroup(buttons, buttons[i]);
    detail.textContent = '';
    detail.appendChild(el('strong', null, name + '. '));
    detail.appendChild(document.createTextNode(text));
    const row = el('div', 'chip-row');
    chips.forEach((c) => row.appendChild(el('span', 'gchip', c)));
    detail.appendChild(row);
  }
  select(0);

  const DUTIES = [
    ['Agent does', '', ['Explains holds, balance and aid status', 'Shows what\'s missing and why it matters', 'Files uploads for review', 'Reminds before deadlines', 'Hands off with a summary']],
    ['Student confirms', 'is-student', ['Enrolling in a payment plan', 'Changing refund method (in the portal)', 'Accepting or declining aid (in the portal)']],
    ['Staff decide', 'is-staff', ['Accepting documents and completing verification', 'Aid eligibility and amounts', 'Releasing holds and fee exceptions', 'Professional-judgment and appeal reviews']]
  ];
  const dHost = $('duties');
  DUTIES.forEach(([title, cls, items]) => {
    const d = el('div', 'duty ' + cls);
    d.appendChild(el('h3', null, title));
    const ul = el('ul');
    items.forEach((t) => ul.appendChild(el('li', null, t)));
    d.appendChild(ul);
    dHost.appendChild(d);
  });
})();
