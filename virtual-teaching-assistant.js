const tabList = document.querySelector('.lms-tabs');
const tabs = [...document.querySelectorAll('[role="tab"]')];
const panels = [...document.querySelectorAll('[role="tabpanel"]')];
const status = document.getElementById('platform-status');

/* Presenter notes */
const notesToggle = document.getElementById('notes-on');
function applyNotes() {
  document.querySelectorAll('.pnote').forEach((note) => { note.hidden = !notesToggle.checked; });
}
notesToggle.addEventListener('change', applyNotes);
applyNotes();

/* Where the assistant runs: Teams, LMS page, Microsoft 365 Copilot */
function selectPlatform(nextTab, announce = true) {
  tabs.forEach((tab) => {
    const selected = tab === nextTab;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  panels.forEach((panel) => {
    panel.hidden = panel.getAttribute('aria-labelledby') !== nextTab.id;
  });
  if (announce) status.textContent = `${nextTab.textContent.trim()} selected.`;
}

tabs.forEach((tab) => tab.addEventListener('click', () => selectPlatform(tab)));

tabList.addEventListener('keydown', (event) => {
  const currentIndex = tabs.indexOf(document.activeElement);
  if (currentIndex < 0) return;
  let nextIndex = currentIndex;
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = tabs.length - 1;
  if (nextIndex === currentIndex) return;
  event.preventDefault();
  tabs[nextIndex].focus();
  selectPlatform(tabs[nextIndex]);
});

/* Copy a question so it can be pasted into the agent's test chat or a Teams pilot. */
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

document.addEventListener('click', (event) => {
  const button = event.target.closest('.try-copy');
  if (!button) return;
  const text = button.closest('li').querySelector('span').textContent.trim();
  const done = () => {
    button.textContent = 'Copied';
    button.setAttribute('data-done', '');
    status.textContent = 'Question copied.';
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
    navigator.clipboard.writeText(text).then(done, () => { if (fallbackCopy(text)) done(); else fail(); });
  } else if (fallbackCopy(text)) {
    done();
  } else {
    fail();
  }
});

/* Sample courses and questions to paste into a pilot agent.
   Add a course by adding an entry here; the picker builds itself. */
const SAMPLE_COURSES = [
  {
    name: 'Introduction to Art History',
    hint: 'Knowledge: syllabus, lecture slides and the research-paper brief in the course SharePoint library.',
    questions: [
      'How did Egyptian tombs develop from early mastabas to the pyramids?',
      'Explain the research paper: what can I choose, what must it cover, and what’s due when?',
      'How is my grade calculated, and what happens if I submit the paper late?',
      'What is style analysis, and which elements should I discuss for an Egyptian work?'
    ]
  },
  {
    name: 'Machine Learning Operations',
    hint: 'Knowledge: course notes and assignment briefs. Due dates come from the LMS through an MCP tool.',
    questions: [
      'What is a feature store, and what problem does it solve? Cite the course notes.',
      'What does Assignment 1 require, and when is it due?',
      'What are the Final Project deliverables, deadline and presentation format?',
      'Explain the main sources of bias in machine learning and how fairness is measured.'
    ]
  },
  {
    name: 'Time Series Analysis',
    hint: 'Knowledge: weekly modules and data-file readmes. Try the integrity guardrail with a homework question.',
    questions: [
      'What’s due in Week 4, and which data files do I need for the traffic assignment?',
      'When is each assignment due, and what does each one cover?',
      'How do I use the ACF and PACF to choose between an AR, MA or ARMA model?',
      'When should I use a GARCH model instead of ARIMA?'
    ]
  }
];

const coursePicker = document.getElementById('course-picker');
const courseHint = document.getElementById('course-hint');
const courseQuestions = document.getElementById('course-questions');

function showCourse(index, announce = true) {
  const course = SAMPLE_COURSES[index];
  [...coursePicker.children].forEach((button, i) => {
    button.setAttribute('aria-pressed', String(i === index));
  });
  courseHint.textContent = course.hint;
  courseQuestions.innerHTML = '';
  course.questions.forEach((question) => {
    const item = document.createElement('li');
    const text = document.createElement('span');
    text.textContent = question;
    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'try-copy';
    copy.textContent = 'Copy';
    copy.setAttribute('aria-label', `Copy question: ${question}`);
    item.append(text, copy);
    courseQuestions.appendChild(item);
  });
  if (announce) status.textContent = `${course.name} selected.`;
}

SAMPLE_COURSES.forEach((course, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'course-chip';
  button.textContent = course.name;
  button.setAttribute('aria-pressed', String(index === 0));
  button.addEventListener('click', () => showCourse(index));
  coursePicker.appendChild(button);
});

showCourse(0, false);

/* Guardrail playback: guide instead of answer, then escalate to the instructor. */
const REPLIES = {
  guide: [
    ['bubble user', 'Can you just give me the correct answers for my quiz on thermochemistry?'],
    ['bubble agent', 'I can’t share quiz answers, but I can help you get there. Which part feels shakiest: enthalpy, Hess’s law or calorimetry? I’ll walk through a practice problem from Week 7 with you.'],
    ['step', 'Topic', 'Academic integrity · fixed reply, then offers practice'],
    ['step', 'Source', 'Week 7 practice set (SharePoint)']
  ],
  escalate: [
    ['bubble user', 'Ask the instructor: is Hess’s law on Friday’s quiz?'],
    ['bubble agent', 'I’ve sent your question to Dr. Lindqvist. You’ll get a reply in Teams; office hours are Tuesday 2–4 pm.'],
    ['step', 'Flow', 'Agent flow posts an adaptive card to the instructor in Teams'],
    ['step', 'Log', 'Question saved to the course’s SharePoint list']
  ]
};

const replyPanel = document.getElementById('reply-panel');
const replyButtons = [...document.querySelectorAll('.reply-btn')];

replyButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.reply;
    const wasOn = button.getAttribute('aria-pressed') === 'true';
    replyButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
    replyPanel.innerHTML = '';
    if (wasOn) { replyPanel.hidden = true; return; }
    button.setAttribute('aria-pressed', 'true');
    REPLIES[key].forEach(([kind, a, b]) => {
      const row = document.createElement('p');
      if (kind === 'step') {
        row.className = 'step';
        const label = document.createElement('b');
        label.textContent = a;
        row.append(label, document.createTextNode(b));
      } else {
        row.className = kind;
        row.textContent = a;
      }
      replyPanel.appendChild(row);
    });
    replyPanel.hidden = false;
  });
});
