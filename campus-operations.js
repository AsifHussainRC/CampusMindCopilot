'use strict';

const $ = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms) => (reduceMotion.matches ? 0 : ms);

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function pressGroup(group, btn) {
  group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
}

/* Presenter notes */
(function notes() {
  const box = $('notes-on');
  const apply = () => document.querySelectorAll('.pnote').forEach((p) => { p.hidden = !box.checked; });
  box.addEventListener('change', apply);
  apply();
})();

/* Sticky section jump */
(function jump() {
  const sel = $('section-jump');
  sel.addEventListener('change', (e) => {
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
      sel.value = id;
    });
  }, { passive: true });
})();

/* 01 · The journey of one leak */
(function journey() {
  const PATHS = {
    today: {
      steps: [
        ['Student emails the residence desk', 'No room number, no photo. "The bathroom sink is leaking."', true],
        ['Desk asks which room, then forwards', 'Two days later, to a shared facilities inbox', true],
        ['Facilities coordinator retypes it', 'Into the work order system, guessing the trade', true],
        ['Technician arrives without the right part', 'Nobody saw the photo the student later replied with', true],
        ['Student emails again: "any update?"', 'A second report for the same leak', true]
      ],
      tally: { touch: '4', days: '3', photo: 'No' }
    },
    copilot: {
      steps: [
        ['Student messages Campus Copilot in Teams', 'Attaches a photo, picks the building and room', false],
        ['Agent drafts the work order', 'Suggests "Plumbing · sink leak" from the photo. Student checks it', false],
        ['Student confirms, an agent flow creates it', 'In the facilities system, with the photo attached', false],
        ['Coordinator assigns a plumber', 'In the facilities system, as today. The agent doesn’t dispatch', false],
        ['Status updates arrive in the same chat', 'Assigned, scheduled, resolved. Nobody has to ask', false]
      ],
      tally: { touch: '0', days: '<1', photo: 'Yes' }
    }
  };
  const list = $('journey');
  const tally = $('tally');
  const group = $('j-today').parentElement;

  function show(key) {
    const p = PATHS[key];
    list.textContent = '';
    p.steps.forEach(([title, sub, pain], i) => {
      const li = el('li', pain ? 'is-pain' : 'is-good');
      li.style.animationDelay = wait(i * 70) + 'ms';
      li.appendChild(el('span', 'n', String(i + 1)));
      const d = el('div');
      d.appendChild(el('strong', null, title));
      d.appendChild(el('em', null, sub));
      li.appendChild(d);
      if (!pain && i === 3) li.appendChild(el('span', 'tag is-gold', 'Staff'));
      list.appendChild(li);
    });
    $('t-touch').textContent = p.tally.touch;
    $('t-days').textContent = p.tally.days;
    $('t-photo').textContent = p.tally.photo;
    tally.classList.toggle('is-good', key === 'copilot');
    pressGroup(group, key === 'today' ? $('j-today') : $('j-copilot'));
  }
  $('j-today').addEventListener('click', () => show('today'));
  $('j-copilot').addEventListener('click', () => show('copilot'));
  show('today');
})();

/* 02 · Report with a photo, then status updates */
(function report() {
  const SYS = {
    snow: {
      id: 'WO0048213',
      tools: ['ServiceNow · Create Record (facilities request table)', 'ServiceNow · Upload a binary file as an attachment']
    },
    d365: {
      id: 'WO-00482',
      tools: ['Dataverse · Add a new row (Work Order)', 'Dataverse · Add a new row (Note, photo attached)']
    },
    cmms: {
      id: 'MR-118204',
      tools: ['cmms-connector · createWorkOrder (custom connector)', 'cmms-connector · addAttachment']
    }
  };
  let sys = 'snow';

  const PHOTO = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 120"><rect width="180" height="120" fill="#dfe9ec"/>' +
    '<rect x="20" y="10" width="140" height="36" rx="4" fill="#f7fafa" stroke="#9fb7bd"/>' +
    '<rect x="78" y="46" width="12" height="30" fill="#8aa1a8"/><path d="M84 76 q0 14 18 14 h22" stroke="#8aa1a8" stroke-width="10" fill="none"/>' +
    '<circle cx="96" cy="92" r="4" fill="#3d8fbf"/><path d="M96 97 q-3 8 0 10 q3 -2 0 -10z" fill="#3d8fbf"/>' +
    '<ellipse cx="96" cy="113" rx="26" ry="4" fill="#3d8fbf" opacity=".45"/>' +
    '<text x="8" y="116" font-family="sans-serif" font-size="8" fill="#566570">IMG_2231.jpg</text></svg>');

  const chat = $('report-chat');
  const trace = $('report-trace');
  const next = $('report-next');
  let step = 0;

  function bubble(kind, who, text, extra) {
    const b = el('div', 'bubble is-' + kind);
    if (who) b.appendChild(el('span', 'who', who));
    if (text) b.appendChild(el('p', null, text));
    if (extra) b.appendChild(extra);
    chat.appendChild(b);
    return b;
  }
  function tool(text, cls) {
    const empty = trace.querySelector('.is-empty');
    if (empty) empty.remove();
    trace.appendChild(el('li', cls || '', text));
  }
  function summaryCard(confirmed) {
    const c = el('div', 'card');
    c.appendChild(el('strong', null, 'New maintenance request'));
    const dl = el('dl');
    [['Issue', 'Plumbing · leak at sink trap'], ['Where', 'Harlow Hall · floor 3 · room 314 bathroom'],
      ['Spreading?', 'No · slow drip into a bucket'], ['Photo', '1 attached'], ['Priority', 'Standard (staff may change it)']]
      .forEach(([k, v]) => { dl.appendChild(el('dt', null, k)); dl.appendChild(el('dd', null, v)); });
    c.appendChild(dl);
    const btns = el('div', 'card-btns');
    btns.appendChild(el('span', confirmed ? 'is-on' : '', confirmed ? 'Submitted ✓' : 'Submit'));
    btns.appendChild(el('span', null, 'Edit'));
    c.appendChild(btns);
    return c;
  }

  const STEPS = [
    () => {
      const img = el('img', 'photo');
      img.src = PHOTO;
      img.alt = 'Photo of a pipe under a sink, dripping into a puddle';
      img.width = 180; img.height = 120;
      bubble('user', 'Leilani · student', 'The pipe under our bathroom sink is leaking', img);
      tool('File input · First(System.Activity.Attachments) → IMG_2231.jpg');
      return 'Next: the agent reads the photo';
    },
    () => {
      bubble('bot', 'Campus Copilot', 'Thanks, Leilani. From the photo it looks like a leak at the sink trap (plumbing). Which building and room is it in?');
      bubble('user', 'Leilani · student', 'Harlow Hall, room 314, the bathroom');
      tool('Question node · building (choices from the buildings list) · room');
      return 'Next: safety check';
    },
    () => {
      bubble('bot', 'Campus Copilot', 'Is water spreading across the floor, or near outlets or lights?');
      bubble('user', 'Leilani · student', 'No, it’s a slow drip into a bucket');
      bubble('sys', null, 'If yes: Escalate topic · on-call number + card to the on-call channel (section 04)');
      return 'Next: the draft';
    },
    () => {
      bubble('bot', 'Campus Copilot', 'Here’s what I’ll send to Facilities. Check it before I submit:', summaryCard(false));
      tool('Ask the end user before running · waiting for Leilani', 'is-confirm');
      return 'Leilani taps Submit';
    },
    () => {
      chat.lastElementChild.querySelector('.card-btns span').className = 'is-on';
      chat.lastElementChild.querySelector('.card-btns span').textContent = 'Submitted ✓';
      tool('agent flow · Create facilities work order');
      SYS[sys].tools.forEach((t) => tool(t));
      bubble('bot', 'Campus Copilot', 'Done. Your request is ' + SYS[sys].id + '. I’ll post updates in this chat. You don’t need to email anyone.');
      next.disabled = true;
      return 'Submitted';
    }
  ];

  function reset() {
    chat.textContent = '';
    trace.textContent = '';
    trace.appendChild(el('li', 'is-empty', 'No tool calls yet. Press Start.'));
    bubble('sys', null, 'Signed in with Microsoft Entra ID · photos up to 15 MB');
    step = 0;
    next.disabled = false;
    next.textContent = '▶ Start';
  }
  next.addEventListener('click', () => {
    if (step >= STEPS.length) return;
    next.textContent = '▶ ' + STEPS[step++]();
    chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });
  $('report-reset').addEventListener('click', reset);

  $('sys-pick').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-sys]');
    if (!b) return;
    sys = b.dataset.sys;
    pressGroup($('sys-pick'), b);
    reset();
    renderStatus();
  });
  reset();

  /* Status updates back to the requester */
  const track = $('status-track');
  const play = $('status-play');
  const STATUS = [
    ['Submitted', 'Mon 09:12', 'Your request is logged. Facilities usually assigns standard requests within one working day.'],
    ['Assigned', 'Mon 10:40', 'A plumber from the Facilities team has your request, with your photo.'],
    ['Scheduled', 'Tue 08:00–10:00', 'A visit is booked for Tuesday between 08:00 and 10:00. You don’t need to be in the room.'],
    ['Resolved', 'Tue 09:25', 'The technician replaced the trap seal and marked it resolved. Still leaking? Tell me here and I’ll add a note to the request.']
  ];
  let timers = [];
  function renderStatus(upto) {
    track.textContent = '';
    STATUS.forEach(([t, when], i) => {
      const li = el('li', i <= (upto == null ? -1 : upto) ? 'is-done' : '');
      li.appendChild(el('strong', null, t));
      li.appendChild(el('span', null, when));
      track.appendChild(li);
    });
    if (upto != null && upto >= 0) {
      const m = el('li', 'status-msg');
      m.textContent = 'Campus Copilot · ' + SYS[sys].id + ': ' + STATUS[upto][2];
      track.appendChild(m);
    }
  }
  play.addEventListener('click', () => {
    timers.forEach(clearTimeout); timers = [];
    play.disabled = true;
    if (reduceMotion.matches) { renderStatus(3); play.disabled = false; return; }
    STATUS.forEach((_, i) => timers.push(setTimeout(() => {
      renderStatus(i);
      if (i === STATUS.length - 1) { play.disabled = false; play.textContent = '▶ Play again'; }
    }, 900 * i)));
  });
  renderStatus();
})();

/* 03 · Rooms and event setup */
(function booking() {
  const ROOMS = [
    ['Lindell 204', 12, true, true, 'Lindell Building'],
    ['Lindell 310 Seminar', 26, true, true, 'Lindell Building'],
    ['Okafor Library Room C', 30, true, false, 'Okafor Library'],
    ['Harbor Hall 118', 40, false, true, 'Harbor Hall'],
    ['Science Hall Lecture 2', 90, true, true, 'Science Hall'],
    ['Student Union Ballroom', 220, true, true, 'Student Union'],
    ['Okafor Library Room A', 8, false, false, 'Okafor Library']
  ];
  const BUSY = new Set(['Okafor Library Room C']);
  const get = (id) => $(id).querySelector('[aria-pressed=true]');
  const out = $('rooms');
  const confirm = $('b-confirm');
  const trace = $('book-trace');
  let findLines = [];

  ['b-size', 'b-setup'].forEach((id) => $(id).addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (b) pressGroup($(id), b);
  }));
  $('b-needs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true'));
  });

  function setTrace(lines) {
    trace.textContent = '';
    lines.forEach(([t, c]) => trace.appendChild(el('li', c || '', t)));
  }

  function find() {
    const size = Number(get('b-size').dataset.v);
    const needs = Array.from($('b-needs').querySelectorAll('[aria-pressed=true]')).map((b) => b.dataset.v);
    const fits = ROOMS.filter(([, cap, proj, acc]) => cap >= size && (!needs.includes('proj') || proj) && (!needs.includes('access') || acc))
      .sort((a, b) => a[1] - b[1]);
    const free = fits.filter((r) => !BUSY.has(r[0])).slice(0, 3);
    out.textContent = '';
    confirm.hidden = true;
    findLines = [
      ['Outlook · Get rooms in room list (V2) · "Teaching spaces"'],
      ['Room details · capacity and features (Dataverse)'],
      ['Outlook · Find meeting times (V2) · ' + fits.length + ' rooms as resource attendees']
    ];
    setTrace(findLines);
    if (!free.length) {
      out.appendChild(el('li', 'empty', 'No room fits that time. The agent offers other times from Find meeting times, or the scheduling office.'));
      return;
    }
    free.forEach(([name, cap, proj, acc, bld], i) => {
      const li = el('li');
      li.style.animationDelay = wait(i * 80) + 'ms';
      const b = el('button', 'room');
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(el('strong', null, name));
      b.appendChild(el('span', null, bld + ' · seats ' + cap + (proj ? ' · projector' : '') + (acc ? ' · step-free' : '')));
      b.appendChild(el('span', 'tag', 'Free'));
      b.addEventListener('click', () => { pressGroup(out, b); pick(name); });
      li.appendChild(b);
      out.appendChild(li);
    });
    if (fits.length > free.length && fits.some((r) => BUSY.has(r[0]))) {
      out.appendChild(el('li', 'empty', 'Okafor Library Room C fits but is busy at that time.'));
    }
  }

  function pick(name) {
    const setup = get('b-setup').dataset.v === 'setup';
    confirm.hidden = false;
    confirm.textContent = '';
    const c = el('div', 'card');
    c.appendChild(el('strong', null, 'Book ' + name + '?'));
    c.appendChild(el('span', null, 'Thursday 19 November, 14:00–15:30 · "Study group: Thermodynamics"'));
    if (setup) c.appendChild(el('span', null, 'Plus an event setup request: 24 chairs in rows, AV technician, coffee for 24.'));
    confirm.appendChild(c);
    const ctr = el('div', 'controls');
    const go = el('button', 'primary-button', setup ? 'Book and send setup request' : 'Book it');
    go.type = 'button';
    ctr.appendChild(go);
    confirm.appendChild(ctr);
    const base = findLines;
    setTrace(base.concat([['Ask the end user before running · waiting', 'is-confirm']]));
    go.addEventListener('click', () => {
      go.disabled = true;
      const lines = base.concat([['Requester confirmed', 'is-confirm'], ['Outlook · Create event (V4) · room as attendee']]);
      if (setup) lines.push(['agent flow · Event setup request → Events team (Approvals · Start and wait for an approval)']);
      setTrace(lines);
      const done = el('div', 'card');
      done.appendChild(el('strong', null, 'Booked. The invite is in your Outlook calendar.'));
      done.appendChild(el('span', null, 'The room mailbox accepted the booking under its own booking policy.'));
      if (setup) {
        const s = el('span', null, 'Setup request EV-2291 sent to the Events team. Catering has a cost, so a coordinator approves it and will message you.');
        done.appendChild(s);
        done.appendChild(el('span', 'tag is-gold', 'Staff approve the setup'));
      }
      confirm.appendChild(done);
    });
  }

  $('b-find').addEventListener('click', find);
  setTrace([['No tool calls yet. Choose the needs and press Find rooms.', 'is-empty']]);
  out.appendChild(el('li', 'empty', 'Choose the group size and needs, then Find rooms.'));
})();

/* 04 · FAQs and what the agent never handles */
(function answers() {
  const SAFETY = 'Campus Safety · 555-0100';
  const FAQ = [
    { q: 'Where can a visitor park overnight?', s: 'Parking', type: 'faq',
      a: 'Overnight visitor parking is in the North Garage, levels 3–4, with a day pass from the pay stations or the parking app. Residence lots are permit-only after 18:00.',
      cite: 'parking.example.edu/visitors' },
    { q: 'When does the late-night shuttle run?', s: 'Transport', type: 'faq',
      a: 'The Night Loop runs every 20 minutes from 18:30 to 01:30, Sunday to Thursday, and until 02:30 on Friday and Saturday. Stops include the Library, Student Union and Harlow Hall.',
      cite: 'transport.example.edu/night-loop' },
    { q: 'Is the dining hall open on Saturday?', s: 'Dining', type: 'faq',
      a: 'Weston Dining Hall serves brunch 10:00–14:00 and dinner 17:00–20:00 on Saturdays. The Union café is open 09:00–22:00.',
      cite: 'dining.example.edu/hours' },
    { q: 'Water is pouring through my ceiling', s: 'Urgent maintenance', type: 'urgent' },
    { q: 'There’s smoke coming from the lab', s: 'Emergency', type: 'emergency' },
    { q: 'I smell gas in the kitchen', s: 'Emergency', type: 'emergency' }
  ];
  const host = $('faq-chips');
  const box = $('answer');

  function botMsg(text, extra) {
    const b = el('div', 'bubble is-bot');
    b.appendChild(el('span', 'who', 'Campus Copilot'));
    if (text) b.appendChild(el('p', null, text));
    if (extra) b.appendChild(extra);
    box.appendChild(b);
  }

  function show(item) {
    box.textContent = '';
    const u = el('div', 'bubble is-user');
    u.appendChild(el('span', 'who', 'Student'));
    u.appendChild(el('p', null, item.q));
    box.appendChild(u);
    if (item.type === 'faq') {
      const b = el('div', 'bubble is-bot');
      b.appendChild(el('span', 'who', 'Campus Copilot · generated from website knowledge'));
      const p = el('p', null, item.a);
      p.appendChild(document.createElement('br'));
      p.appendChild(el('span', 'cite', '[1] ' + item.cite));
      b.appendChild(p);
      box.appendChild(b);
    } else if (item.type === 'emergency') {
      const s = el('div', 'safety');
      s.appendChild(el('span', 'kicker', 'FIXED TOPIC · EMERGENCY'));
      s.appendChild(el('strong', null, 'Call ' + SAFETY + ' now.'));
      s.appendChild(el('p', null, 'If anyone is in danger, call your local emergency number. Leave the area and pull the fire alarm if you can do it safely. Don’t wait for a reply here.'));
      s.appendChild(el('span', 'fixed', 'Fixed message · not generated · conversation ends here'));
      box.appendChild(s);
    } else {
      const c = el('div', 'card is-urgent');
      c.appendChild(el('strong', null, 'This needs a person now.'));
      c.appendChild(el('span', null, 'Call the Facilities on-call line: 555-0142 (24 hours). Move belongings away from the water and stay clear of outlets and lights.'));
      c.appendChild(el('span', null, 'I’ve alerted the on-call team with your building and room. If anyone is hurt or you see sparks, call ' + SAFETY + '.'));
      botMsg(null, c);
      const t = el('div', 'bubble is-sys');
      t.appendChild(el('p', null, 'Escalate topic · agent flow → Teams · Post card in a chat or channel (Facilities on-call)'));
      box.appendChild(t);
    }
  }

  FAQ.forEach((item, i) => {
    const b = el('button', 'faq' + (item.type === 'faq' ? '' : ' is-urgent'));
    b.type = 'button';
    b.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    b.appendChild(el('strong', null, item.q));
    b.appendChild(el('span', null, item.s));
    b.addEventListener('click', () => { pressGroup(host, b); show(item); });
    host.appendChild(b);
  });
  show(FAQ[0]);
})();

/* 05 · Facilities manager: Fabric data agent + Activator */
(function manager() {
  const Q = {
    building: {
      ask: 'Open work orders by building',
      answer: '186 open work orders across campus. Harlow Hall has the most, mostly plumbing.',
      rows: [['Harlow Hall', 41, true], ['Science Hall', 33], ['Lindell Building', 28], ['Student Union', 24], ['Okafor Library', 19], ['Harbor Hall', 15], ['Other (9 buildings)', 26]],
      unit: '',
      take: 'Harlow Hall: 18 of 41 are plumbing. Worth a look at the 1960s risers?'
    },
    response: {
      ask: 'Median first response, by trade',
      answer: 'Median hours from submitted to assigned, last 30 days.',
      rows: [['HVAC', 19, true], ['Electrical', 11], ['Plumbing', 7], ['Carpentry', 26, true], ['Custodial', 3], ['Locks and keys', 5]],
      unit: ' h',
      take: 'Carpentry and HVAC are slowest. HVAC is waiting on two contractor visits.'
    },
    aging: {
      ask: 'Oldest open, over 14 days',
      answer: '12 work orders have been open more than 14 days. Days open:',
      rows: [['Science Hall · fume hood airflow', 38, true], ['Harlow Hall · window latch 2F', 27], ['Union · loading dock door', 22], ['Lindell · ceiling tiles 3F', 19], ['Library · elevator chime', 16]],
      unit: ' d',
      take: 'The fume hood order is waiting on a part. The agent read this; any change happens in the facilities system.'
    }
  };
  const bars = $('mgr-bars');
  function show(key) {
    const q = Q[key];
    $('mgr-answer').textContent = q.answer;
    $('mgr-take').textContent = q.take;
    bars.textContent = '';
    const max = Math.max.apply(null, q.rows.map((r) => r[1]));
    q.rows.forEach(([label, v, hot], i) => {
      const r = el('div', 'bar' + (hot ? ' is-hot' : ''));
      r.style.animationDelay = wait(i * 50) + 'ms';
      r.appendChild(el('span', 'bar-l', label));
      r.appendChild(el('b', null, v + q.unit));
      const t = el('div', 'bar-track');
      const fill = el('i');
      fill.style.width = Math.round((v / max) * 100) + '%';
      t.appendChild(fill);
      r.appendChild(t);
      bars.appendChild(r);
    });
  }
  $('mgr-q').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-q]'); if (!b) return;
    pressGroup($('mgr-q'), b); show(b.dataset.q);
  });
  show('building');

  /* Sensor → Activator → flow → work order → person */
  const STEPS = [
    ['Eventstream', 'Reading −14.6 °C arrives from the building sensor', false],
    ['Activator', 'Rule "freezer above −15 °C" fires for B-112', false],
    ['Power Automate', 'Custom action flow creates work order WO0048290 · source: sensor · high', false],
    ['Teams', 'Card posted to the Facilities on-call channel', false],
    ['Technician', 'Checks the freezer, moves samples, closes the order', true]
  ];
  const list = $('sensor-steps');
  const gauge = document.querySelector('.sensor-gauge');
  const temp = $('s-temp');
  const fill = $('s-fill');
  const run = $('sensor-run');
  let timers = [];
  function render(upto) {
    list.textContent = '';
    STEPS.forEach(([tag, text, human], i) => {
      const li = el('li', (human ? 'is-human ' : '') + (i <= upto ? 'is-done' : ''));
      li.appendChild(el('span', 'tag', tag));
      li.appendChild(el('strong', null, text));
      li.appendChild(el('span', null, human ? 'A person decides' : 'Automatic'));
      list.appendChild(li);
    });
  }
  function setTemp(t) {
    temp.textContent = (t < 0 ? '−' : '') + Math.abs(t).toFixed(1) + ' °C';
    /* Scale −25 … −5 °C onto the track; the −15 °C line sits at 50%. */
    fill.style.width = Math.max(4, Math.min(100, ((t + 25) / 20) * 100)) + '%';
    gauge.classList.toggle('is-alert', t > -15);
  }
  run.addEventListener('click', () => {
    timers.forEach(clearTimeout); timers = [];
    run.disabled = true;
    render(-1);
    const temps = [-20.4, -18.9, -17.2, -15.8, -14.6];
    if (reduceMotion.matches) { setTemp(-14.6); render(4); run.disabled = false; return; }
    temps.forEach((t, i) => timers.push(setTimeout(() => setTemp(t), 350 * i)));
    const base = 350 * temps.length;
    STEPS.forEach((_, i) => timers.push(setTimeout(() => {
      render(i);
      if (i === STEPS.length - 1) { run.disabled = false; run.textContent = '▶ Run again'; }
    }, base + 700 * i)));
  });
  setTemp(-20.4);
  render(-1);
})();

/* 06 · How it's built */
(function stack() {
  const LAYERS = [
    ['Channels', [
      ['teams', 'Microsoft Teams', 'Students and staff', 'CHANNEL', 'Microsoft Teams', 'Where most requests start, and where status updates come back. File upload works here. Fabric data agent answers are validated only in Teams.', 'GA'],
      ['web', 'Campus website', 'Web chat, Entra sign-in', 'CHANNEL', 'Website (custom website channel)', 'Public FAQs can run without sign-in. Reporting a problem or booking needs the authenticated website channel, so the agent knows who is asking.', 'GA']
    ]],
    ['Agent', [
      ['agent', 'Copilot Studio agent', 'Instructions · generative orchestration', 'AGENT', 'Campus Copilot (Copilot Studio)', 'One agent with instructions, topics and tools. Generative orchestration picks the right tool or topic from its description and can call several in one turn.', 'GA', true],
      ['topics', 'Topics', 'Emergency · Escalate · Report a problem', 'TOPICS', 'Fixed topics', 'Emergency is a fixed Message node that never generates text. Escalate is the system topic for people. Report a problem gathers the photo, location and safety check.', 'GA'],
      ['knowledge', 'Website knowledge', 'Parking · transport · dining pages', 'KNOWLEDGE', 'Public website knowledge source', 'The campus parking, transport and dining pages are knowledge sources. Answers cite the page they came from.', 'GA']
    ]],
    ['Tools', [
      ['flows', 'Agent flows', 'Power Automate', 'TOOL', 'Agent flows', 'Create the work order and attach the photo, send status updates, and route event setup to an approval. Each change runs only after the requester confirms.', 'GA'],
      ['snow', 'ServiceNow connector', 'Create Record · attachments', 'CONNECTOR', 'ServiceNow (Premium)', 'Create Record, Upload a binary file as an attachment, Get Record and List Records, against your facilities tables.', 'GA'],
      ['dv', 'Dataverse', 'Field Service work orders', 'CONNECTOR', 'Microsoft Dataverse', 'If you run Dynamics 365 Field Service, work orders are Dataverse rows: Add a new row, and the "row modified" trigger for updates. It also holds room metadata if you don’t use Places.', 'GA'],
      ['cmms', 'Custom connector / MCP', 'Any other CMMS', 'TOOL', 'Custom connector or MCP server', 'For another CMMS, wrap its REST API in a custom connector, or add the vendor’s MCP server as a tool if one exists.', 'GA'],
      ['outlook', 'Office 365 Outlook', 'Rooms and bookings', 'CONNECTOR', 'Office 365 Outlook', 'Get rooms in room list (V2), Find meeting times (V2) with rooms as resource attendees, and Create event (V4).', 'GA'],
      ['teamsc', 'Microsoft Teams connector', 'Updates and on-call cards', 'CONNECTOR', 'Microsoft Teams', 'Post message in a chat or channel, posting as the agent, sends status updates to the requester. Post card in a chat or channel alerts on-call.', 'GA']
    ]],
    ['Insight', [
      ['fabric', 'Fabric data agent', 'Manager questions', 'CONNECTED AGENT', 'Microsoft Fabric data agent', 'Connected to a manager-facing agent. Answers questions about work order history in the lakehouse, with user authentication.', 'Preview'],
      ['activator', 'Activator', 'Real-Time Intelligence', 'FABRIC', 'Fabric Activator', 'Watches sensor streams. When a rule fires, a custom action calls a Power Automate flow that creates the work order.', 'Optional']
    ]],
    ['Identity and governance', [
      ['entra', 'Microsoft Entra ID', 'Sign-in · groups', 'IDENTITY', 'Microsoft Entra ID', 'Requesters see only their own requests. Only the facilities managers’ group can use the manager agent.', 'GA'],
      ['admin', 'Admin and audit', 'PPAC · Purview · analytics', 'GOVERNANCE', 'Power Platform admin center, Purview, analytics', 'Environments and DLP, Copilot Studio analytics (sessions, escalations, satisfaction), Purview audit, Copilot Credits consumption.', 'GA']
    ]]
  ];
  const host = $('stack');
  const all = [];
  LAYERS.forEach(([name, parts]) => {
    const layer = el('div', 'layer');
    layer.appendChild(el('span', 'layer-name', name));
    const row = el('div', 'layer-row');
    parts.forEach((p) => {
      const b = el('button', 'part' + (p[7] ? ' is-core' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.appendChild(document.createTextNode(p[1]));
      b.appendChild(el('small', null, p[2]));
      b.addEventListener('click', () => select(b, p));
      row.appendChild(b);
      all.push([b, p]);
    });
    layer.appendChild(row);
    host.appendChild(layer);
  });
  function select(btn, p) {
    all.forEach(([b]) => b.setAttribute('aria-pressed', String(b === btn)));
    $('sd-kicker').textContent = p[3];
    $('sd-title').textContent = p[4];
    $('sd-body').textContent = p[5];
    const tag = $('sd-tag');
    tag.textContent = p[6];
    tag.className = 'tier-tag' + (p[6] === 'GA' ? '' : ' is-preview');
  }
  const core = all.find(([, p]) => p[0] === 'agent');
  select(core[0], core[1]);
})();

/* 07 · Who decides, and the outcome */
(function control() {
  const ITEMS = [
    ['Answer parking, shuttle and dining questions', 'From website knowledge, with citations', 'agent'],
    ['Suggest the trade from the photo', 'The requester can change it before submitting', 'agent'],
    ['Find free rooms', 'Reads room calendars, books nothing', 'agent'],
    ['Create the work order', 'Requester checks the draft and taps Submit', 'user'],
    ['Book the room', '"Ask the end user before running" on Create event', 'user'],
    ['Send an event setup request', 'Requester confirms, then it goes to the Events team', 'user'],
    ['Set the final priority and dispatch', 'Facilities coordinator, in the facilities system', 'staff'],
    ['Approve setup costs and catering', 'Events coordinator, through Approvals', 'staff'],
    ['Triage sensor-created work orders', 'On-call technician', 'staff'],
    ['Close a work order', 'The technician who did the work', 'staff'],
    ['Respond to fire, smoke, gas or injury', 'Fixed topic: call Campus Safety', 'never'],
    ['Decide whether a space is safe to enter', 'Campus Safety and Facilities', 'never']
  ];
  const LABEL = { agent: 'Agent alone', user: 'Requester confirms', staff: 'Staff decide', never: 'Never the agent' };
  const list = $('decide');
  function show(f) {
    list.textContent = '';
    ITEMS.filter((i) => f === 'all' || i[2] === f).forEach(([t, s, k], n) => {
      const li = el('li', k === 'never' ? 'is-never' : '');
      li.style.animationDelay = wait(n * 30) + 'ms';
      li.appendChild(el('strong', null, t));
      li.appendChild(el('span', null, s));
      li.appendChild(el('span', 'tag' + (k === 'never' ? ' is-warn' : k === 'staff' ? ' is-gold' : ''), LABEL[k]));
      list.appendChild(li);
    });
  }
  $('who-filter').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-f]'); if (!b) return;
    pressGroup($('who-filter'), b); show(b.dataset.f);
  });
  show('all');

  const OUT = [
    ['Minutes to report a problem', 12, 3, ''],
    ['Hours to first status update', 52, 1, ''],
    ['Reports per issue (duplicates)', 2.4, 1.3, ''],
    ['Requests that arrive with a photo', 18, 71, '%'],
    ['Room booking emails to scheduling, per week', 140, 35, '']
  ];
  const host = $('outcome');
  const rows = OUT.map(([label]) => {
    const r = el('div', 'o-row');
    r.appendChild(el('span', null, label));
    const b = el('b');
    r.appendChild(b);
    const t = el('div', 'bar-track');
    const i = el('i');
    t.appendChild(i);
    r.appendChild(t);
    host.appendChild(r);
    return [b, i];
  });
  function out(which) {
    host.classList.toggle('is-after', which === 'after');
    OUT.forEach(([, before, after, unit], n) => {
      const v = which === 'after' ? after : before;
      rows[n][0].textContent = v + unit;
      rows[n][1].style.width = Math.round((v / Math.max(before, after)) * 100) + '%';
    });
  }
  $('out-pick').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-o]'); if (!b) return;
    pressGroup($('out-pick'), b); out(b.dataset.o);
  });
  out('before');
})();
