'use strict';
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];

/* ================= icons ================= */
const icons={
 web:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 email:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
 form:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 phone:'<path d="M7 3h4l2 5-3 2a15 15 0 0 0 4 4l2-3 5 2v4c0 2-2 4-4 4C10 20 4 14 3 7c0-2 2-4 4-4Z"/>',
 teams:'<circle cx="9" cy="7" r="3"/><circle cx="17" cy="8" r="2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c.6-.3 1.3-.5 2-.5 2.2 0 4 1.8 4 4v1"/>'
};

/* ================= audience copy ================= */
const audiences={
 student:{
  label:'Students',
  stageTitles:{interest:'Student interest',record:'Recorded in your CRM',review:'Counselor review'},
  recordCaption:'Conversation context for admissions',
  interestHeading:'Meet student interest wherever it begins.',
  interestIntro:'A question may start on your website, in an inbox, through a form, or after the phones are quiet.',
  expertiseIntro:'The question stays visible while the relevant program agents and approved program information come together.',
  recordIntro:'When interest is captured, an agent flow turns the conversation into useful context for the admissions team.',
  reviewHeading:'Show the counselor what needs judgment.',
  reviewWhyLabel:'Why this reached a counselor',
  reviewNext:'Open counselor review',
  nextNext:'See the student’s next step',
  nextIntro:'The next step reflects the student’s question instead of forcing every conversation into the same journey.',
  branch:['Published information cannot decide an exception.','Bring in a counselor.'],
  flow2:'Explore program fit',flow4:'Bring in a counselor when needed',
  closingQuestion:'Which channel and question would you start with?',
  specialists:{a:'Part-time MBA agent',b:'Specialized master’s agent'},
  record:{kind:'Prospect record · Illustrative',heading:'Recruitment conversation',chip:'Inquiry',dept:'Admissions',interestLabel:'Program interest',questionLabel:'Student’s question',arrow:'Agent flow writes the summary'},
  direction:'the agent flow writes a summary and transcript link to the prospect record. This Lab does not show the agent reading the CRM, and nothing in the record is used to score the student.',
  channels:[
   {icon:'web',label:'Website',sub:'Searching program pages',from:'From the admissions website',summary:'A prospective student is asking the agent embedded on your public program pages.',mech:'Website channel · No authentication · public knowledge only',
    note:'Published to your live website with the Copilot Studio web chat embed and <em>No authentication</em>. Without sign-in the agent can only use public information, so its knowledge is your public admissions and program web pages. Anyone who can reach the page can chat, so keep anything personal out of its knowledge sources.'},
   {icon:'email',label:'Email',sub:'Waiting for a reply',from:'From the admissions inbox',summary:'A prospective student emailed admissions. An event trigger hands the message to the agent to draft a grounded reply.',mech:'Event trigger · Office 365 Outlook connector',
    note:'Built with an event trigger on the shared admissions mailbox (Office 365 Outlook connector). The trigger payload starts the agent autonomously; it drafts a reply from the same program knowledge. Trigger connectors run with the agent author’s connection, and in this Lab the draft goes to a counselor (stage 04) instead of being sent automatically.'},
   {icon:'form',label:'Inquiry form',sub:'Asking for guidance',from:'From an inquiry form',summary:'A new inquiry form arrives. A flow passes it to the agent to prepare a first response.',mech:'Event trigger · Microsoft Forms or a new CRM row',
    note:'Built with an event trigger: either a Microsoft Forms “new response” trigger or a Dataverse “row added” trigger when your inquiry form writes to Dynamics 365. A form that posts to another CRM can call a Power Automate flow over HTTP that then wakes the agent.'},
   {icon:'phone',label:'Phone · after hours',sub:'No one is available',from:'From an after-hours call',summary:'A prospective student calls after hours and reaches the voice-enabled agent.',mech:'Voice agent · Azure Communication Services number',
    note:'Copilot Studio supports voice-enabled agents for interactive voice response. You need a phone number from Azure Communication Services, and the documented integration runs through Dynamics 365 Contact Center. Check voice licensing and which features your agent type supports before you promise an after-hours line.'}
  ],
  systems:[
   {name:'Dynamics 365',sub:'Dataverse',how:'Prebuilt connector: Microsoft Dataverse',detail:'An agent flow adds or updates the contact or lead row and attaches the conversation summary as a note.',note:'Dynamics 365 Sales and Customer Insights store prospects in Dataverse, so the Microsoft Dataverse connector (or the agent’s built-in Dataverse access) covers it with no custom code.'},
   {name:'Salesforce',sub:'Prebuilt connector',how:'Prebuilt connector: Salesforce',detail:'The flow upserts a Lead by external ID and logs the summary as an activity on that record.',note:'The Salesforce connector offers “Create record”, “Get records” and “Insert or Update (Upsert) a Record by External ID (V2)”, which avoids creating duplicates when the same student writes twice.'},
   {name:'Slate',sub:'Custom connector',how:'Custom connector to Slate’s web services',detail:'There is no prebuilt Power Platform connector for Slate today. Wrap its API in a custom connector, or call it from the flow with an HTTP action.',note:'Checked against the Power Platform connector reference (Nov 2026): no Slate admissions connector is listed. A custom connector is reusable across flows and the agent; an MCP server wrapping the same API is another option if your team already runs one.'}
  ],
  routes:{
   fit:{tag:'Program fit',
    question:'I want to keep working. Which program fits my goals and schedule?',
    title:'Compare relevant program options',reason:'The question needs information from more than one program agent.',
    intent:['Program fit','Work schedule'],active:['a','b'],
    a:['Format · Schedule · Workload','MBA program pages (public website)'],b:['Format · Schedule · Workload','Master’s program pages (public website)'],
    result:'A useful program comparison',resultText:'The student can compare study format, schedule, and workload.',points:['Study format','Schedule','Workload'],boundary:'Based on published program information',
    interest:'Part-time MBA · Specialized master’s',recordQuestion:'Program fit · Schedule · Workload',matters:'Keep working while studying',
    reviewWhy:'The student wants help comparing programs around a work schedule.',established:'Relevant formats, schedules, and workloads from both programs.',decision:'Whether one-to-one guidance would help the student compare program fit.',
    draft:'Would it help to talk through which program fits around your work schedule?',
    next:'Book a call with an admissions counselor',nextCopy:'Compare both programs against the student’s work schedule in a short conversation.',nextStatus:'Grounded in approved program information',
    note:'Generative orchestration reads each child agent’s description and calls both, because the question spans two programs. Each child agent is grounded only on its own program’s public pages. The main agent combines their answers and cites the pages it used.'},
   requirements:{tag:'Requirements',
    question:'What do I need to apply for the part-time MBA?',
    title:'Find the relevant application requirements',reason:'This is a published-information question about one program.',
    intent:['Part-time MBA','Application requirements'],active:['a'],
    a:['Requirements · Documents','MBA admissions requirements page'],b:['Not needed for this question',''],
    result:'A clear application checklist',resultText:'The student can see the published requirements and documents to prepare.',points:['Entry requirements','Required documents'],boundary:'Admission remains a separate decision',
    interest:'Part-time MBA',recordQuestion:'Entry requirements · Application documents',matters:'Preparing a complete application',
    reviewWhy:'The student may need help clarifying an application requirement.',established:'Published requirements and required documents for the part-time MBA.',decision:'Whether the open question needs individual clarification from admissions.',
    draft:'Would it help to review the published MBA requirements and documents together?',
    next:'Review the application checklist',nextCopy:'See the published requirements and prepare the required documents.',nextStatus:'Grounded in published application requirements',
    note:'For questions with fixed rules, a topic is more predictable than a generated answer. Here an “Eligibility check” topic asks structured questions (degree held, years of work experience) with question nodes and then shows the matching published checklist. The topic only reports what the published rules say; it never decides admission.'},
   timing:{tag:'Timing',
    question:'When does the specialized master’s start, and when should I apply?',
    title:'Find the relevant intake and deadline',reason:'The timing belongs to one program and one current intake.',
    intent:['Specialized master’s','Dates and deadlines'],active:['b'],
    a:['Not needed for this question',''],b:['Start dates · Deadlines','Master’s intake and deadline pages'],
    result:'Dates for the right program',resultText:'The student can plan around the relevant intake and application deadline.',points:['Start dates','Application deadlines'],boundary:'An unclear date should be confirmed by admissions',
    interest:'Specialized master’s',recordQuestion:'Start dates · Application deadlines',matters:'Planning when to begin studying',
    reviewWhy:'The student may need confirmation if a published date is unclear.',established:'The current published intake dates and application deadlines.',decision:'Whether admissions needs to confirm an unclear or changing date.',
    draft:'Would you like help confirming the relevant intake and application deadline?',
    next:'Attend an information session',nextCopy:'Book a place at the next session, then work backward from the application deadline.',nextStatus:'Grounded in published dates and deadlines',
    note:'Only one child agent is called. Dates go stale fast, so point knowledge at the one page admissions keeps current, rather than uploading a PDF that someone will forget to replace.'},
   judgment:{tag:'Exception',
    question:'My background doesn’t meet a listed part-time MBA requirement. Could an exception be made?',
    title:'Establish what the published requirement says',reason:'The program agent can establish the requirement, but not decide an exception.',
    intent:['Part-time MBA','Exception request'],active:['a'],
    a:['Published requirement','MBA admissions requirements page'],b:['Not needed for this question',''],human:true,
    boundaryStrong:'Published information does not establish an exception.',boundaryP:'The question and conversation context move to an admissions counselor.',
    result:'A decision-ready counselor handoff',resultText:'The published requirement and the student’s question travel together.',points:['Published requirement','Student’s question','Conversation context'],boundary:'The exception decision remains with admissions',
    interest:'Part-time MBA',recordQuestion:'Background · Listed requirement · Exception request',matters:'Understanding whether an individual situation can be reviewed',
    reviewWhy:'The student is asking for an exception to a listed program requirement.',established:'The listed requirement, the student’s stated background, and the conversation context.',decision:'Whether this situation should receive an exception review or be guided to another path.',
    draft:'A counselor can review your background and the listed requirement with you.',
    next:'Continue with an admissions counselor',nextCopy:'Bring the published requirement, the student’s question, and the conversation context into one review.',nextStatus:'Human judgment required',
    note:'The agent’s instructions say it must not grant or predict exceptions. When it recognises one, it redirects to the Escalate system topic. With a Transfer conversation node and an engagement hub such as Dynamics 365 Customer Service, a live counselor gets the full history and a private note. Without a hub, the topic runs an agent flow that creates a follow-up task for the counselor instead.'}
  },
  reviewNote:'Built with an agent flow: it posts the draft to the counselor in Teams with the Approvals connector, and only “Approve” sends it (Office 365 Outlook, “Send an email (V2)”). Nothing reaches the student before a person approves. Multistage and AI approvals in agent flows are in preview, so this Lab uses a standard one-person approval.',
  recordNote:'The write happens in an agent flow the agent calls as a tool, so the field mapping is explicit and auditable. A summary is written, not raw chat, and the transcript stays in Dataverse under your Copilot Studio retention settings.',
  schedule:{kicker:'Scheduling · Microsoft Bookings',title:'The student picks a time on the admissions Bookings page.',steps:['The agent shares the Bookings page for campus visits and counselor calls.','The student books; Bookings sends the invitation and reminders.','A cloud flow on “When an appointment is created” logs the visit on the prospect record.']},
  funnel:{ask:'Of this cycle’s website conversations, how many became applications, by program?',rows:[['Conversations',1240],['Inquiries captured',610],['Started an application',265],['Submitted',182]],foot:'Answered by a Fabric data agent over the admissions lakehouse. Illustrative figures · not product output.'},
  nextNote:'Bookings is the booking engine; the Microsoft Bookings connector provides triggers (appointment created, updated, cancelled), not a “book for me” action, so the agent shares the booking page link and a flow reacts to the booking. Funnel questions go to a Fabric data agent connected to the internal agent (preview; validated only in Microsoft Teams). With user authentication, each counselor sees only the data they are already allowed to see.'
 },
 staff:{
  label:'Staff & faculty',
  stageTitles:{interest:'Candidate interest',record:'Recorded in your ATS',review:'Recruiter review'},
  recordCaption:'Conversation context for the hiring team',
  interestHeading:'Meet candidate interest wherever it begins.',
  interestIntro:'A question about a role may start on your careers site, in the recruiting inbox, after an application, or inside Teams.',
  expertiseIntro:'The question stays visible while the relevant hiring agents and approved HR sources come together.',
  recordIntro:'When interest is captured, an agent flow turns the conversation into useful context for the recruiter, not a verdict on the candidate.',
  reviewHeading:'Show the recruiter what needs judgment.',
  reviewWhyLabel:'Why this reached a recruiter',
  reviewNext:'Open recruiter review',
  nextNext:'See the candidate’s next step',
  nextIntro:'The next step reflects the candidate’s question. Decisions about candidates stay with people.',
  branch:['An agent does not judge candidates.','Bring in the recruiter or search committee.'],
  flow2:'Explore role fit',flow4:'Bring in a recruiter when needed',
  closingQuestion:'Which role, and which question, would you start with?',
  specialists:{a:'Faculty hiring agent',b:'Staff hiring agent'},
  record:{kind:'Candidate note · Illustrative',heading:'Candidate conversation',chip:'Prospect',dept:'Talent acquisition',interestLabel:'Role interest',questionLabel:'Candidate’s question',arrow:'Agent flow writes a note'},
  direction:'the agent flow adds a note to the candidate record. The agent does not read applications, and nothing it writes is a score, ranking, or recommendation.',
  channels:[
   {icon:'web',label:'Careers site',sub:'Browsing open roles',from:'From the careers site',summary:'A job seeker is asking the agent embedded on your public careers pages.',mech:'Website channel · No authentication · public knowledge only',
    note:'Same website channel as admissions, with <em>No authentication</em>. Knowledge is limited to public pages: the careers site, published postings, benefits overview and the institution’s equal-opportunity statement.'},
   {icon:'email',label:'Email',sub:'Question about a posting',from:'From the recruiting inbox',summary:'A candidate emailed HR recruiting. An event trigger hands the message to the agent to draft a reply.',mech:'Event trigger · Office 365 Outlook connector',
    note:'An event trigger on the shared recruiting mailbox (Office 365 Outlook connector) starts the agent autonomously. It drafts a reply from the posting and HR policy pages; the recruiter approves it in stage 04.'},
   {icon:'form',label:'Application',sub:'Just applied',from:'From a new application',summary:'A candidate has just applied and has questions about what happens next.',mech:'Flow from your ATS · custom connector or webhook',
    note:'Most applicant tracking systems can call a webhook when an application arrives. A Power Automate flow with an HTTP request trigger receives it, sends the confirmation, and passes any questions to the agent. The flow does not forward the CV or application content to the agent.'},
   {icon:'teams',label:'Teams · internal',sub:'Hiring managers and staff',from:'From Microsoft Teams',summary:'A hiring manager, search committee member, or internal applicant asks in Teams, signed in with Entra ID.',mech:'Teams channel · Authenticate with Microsoft',
    note:'Internal users get the agent in Teams with <em>Authenticate with Microsoft</em>, so knowledge can include internal SharePoint sites: the hiring handbook, search committee guidance, internal transfer policy. A search committee can add the agent to its group chat; in group chats it only receives messages that @mention it.'}
  ],
  systems:[
   {name:'Workday',sub:'Connector + custom',how:'Workday HCM connector (preview) + custom connector',detail:'The prebuilt connector covers worker and organization data. Candidate and requisition records need a custom connector to Workday’s web services.',note:'The Workday HCM connector (preview, Premium) exposes Human Capital Management data such as employees, contingent workers and organizations. It has no recruiting actions, so candidate notes go through a custom connector your Workday team approves.'},
   {name:'Other ATS',sub:'Custom connector or MCP',how:'Custom connector from the vendor’s REST API, or an MCP server',detail:'Wrap the ATS API in a custom connector, or add an MCP server as a tool if the vendor or your team provides one.',note:'Copilot Studio agents can use MCP servers as tools (GA). Expose only “add note” and “get posting” to the agent. Leave out read-applicant and change-status operations so the agent cannot act on a candidate’s application.'},
   {name:'Dataverse',sub:'Your own table',how:'Prebuilt connector: Microsoft Dataverse',detail:'No ATS yet? Keep a simple candidate-interest table in Dataverse and hand off to the formal process when someone applies.',note:'A Dataverse table works for talent pools and events (for example, faculty job fair sign-ups). Use Dataverse security roles so only the recruiting team can read it.'}
  ],
  routes:{
   fit:{tag:'Role fit',
    question:'I teach part-time at another college. Which of your open roles fit someone with my background?',
    title:'Match the question to published roles',reason:'Open roles sit with both faculty and professional staff hiring.',
    intent:['Open roles','Teaching background'],active:['a','b'],
    a:['Lecturer · Adjunct postings','Faculty postings (careers site)'],b:['Instructional design · Learning support','Staff postings (careers site)'],
    result:'A list of relevant published roles',resultText:'The candidate sees roles whose published duties match what they described, with links to apply.',points:['Published duties','Location and schedule','How to apply'],boundary:'Lists postings; does not assess the candidate',
    interest:'Lecturer (adjunct) · Instructional designer',recordQuestion:'Which roles fit a part-time teaching background',matters:'Continuing to teach while changing institution',
    reviewWhy:'The candidate asked for help choosing between faculty and staff roles.',established:'The published duties, schedule and location of the relevant postings.',decision:'Whether a recruiter conversation would help. Not whether the candidate is suitable.',
    draft:'Thanks for your interest. Would a short call with our recruiting team help you compare these roles?',
    next:'Talk to a recruiter',nextCopy:'A 20-minute call about the roles. A conversation, not a screening interview.',nextStatus:'Grounded in published postings',
    note:'Two child agents, one per hiring area, each grounded on its own postings. The instructions tell the agent to describe published duties and never to say whether a person is a good fit. The candidate decides what to apply for.'},
   requirements:{tag:'Requirements',
    question:'What do I need to submit for the Assistant Professor of Chemistry posting?',
    title:'Find the application materials for one posting',reason:'This is a published-information question about one faculty search.',
    intent:['Assistant Professor · Chemistry','Application materials'],active:['a'],
    a:['Materials · Referees · Portal','Faculty posting and hiring handbook'],b:['Not needed for this question',''],
    result:'A clear materials checklist',resultText:'The candidate sees the published materials and how to submit them.',points:['CV and cover letter','Teaching statement','Referee details'],boundary:'Submission does not imply eligibility',
    interest:'Assistant Professor · Chemistry',recordQuestion:'Application materials · Submission portal',matters:'Submitting a complete application',
    reviewWhy:'The candidate may need help with a materials question the posting does not answer.',established:'The published materials list and the submission route for this search.',decision:'Whether the open question needs an answer from the search coordinator.',
    draft:'Here is the published materials list for this search. Is there anything it doesn’t answer?',
    next:'Prepare the application materials',nextCopy:'Gather the listed materials and submit through the application portal.',nextStatus:'Grounded in the published posting',
    note:'A topic handles fixed questions such as “what do I submit” and “is there a deadline”, reading from the posting. It does not ask about protected characteristics or anything the posting doesn’t require.'},
   timing:{tag:'Timing',
    question:'When will you start reviewing applications for the IT analyst role, and when will I hear back?',
    title:'Find the published timeline',reason:'The timeline belongs to one staff posting and the HR process page.',
    intent:['IT analyst','Review timeline'],active:['b'],
    a:['Not needed for this question',''],b:['Review start · Typical timeline','Staff posting and HR hiring process page'],
    result:'The published timeline for this role',resultText:'The candidate knows when review begins and the typical next stages.',points:['Review start date','Typical stages'],boundary:'Individual status comes from a recruiter',
    interest:'IT analyst',recordQuestion:'Review start date · Response timing',matters:'Planning around a current notice period',
    reviewWhy:'The candidate is asking about timing for their own application.',established:'The published review start date and the typical hiring stages.',decision:'Whether the recruiter should send an individual status update.',
    draft:'Review for this role begins on the published date. We will contact every applicant once the shortlist is decided.',
    next:'Wait for the published review date',nextCopy:'The candidate knows when to expect contact and who to ask.',nextStatus:'Grounded in the published timeline',
    note:'The public agent cannot see application status: it has no sign-in and no access to the ATS. Status questions are answered with the published process and passed to a recruiter, who can answer properly.'},
   judgment:{tag:'Qualifications',
    question:'The posting asks for a PhD. I have ten years of industry research instead. Am I qualified?',
    title:'Establish what the posting says',reason:'The agent can quote the published qualification, but must not judge equivalence.',
    intent:['Assistant Professor · Chemistry','Qualification question'],active:['a'],
    a:['Published qualifications','Faculty posting'],b:['Not needed for this question',''],human:true,
    boundaryStrong:'An agent does not decide whether experience is equivalent.',boundaryP:'The question goes to the recruiter; qualifications are assessed by the search committee.',
    result:'A respectful handoff, not a verdict',resultText:'The candidate is told who decides and how to make their case in the application.',points:['Published qualification','Candidate’s question','Who decides'],boundary:'Assessment remains with the search committee',
    interest:'Assistant Professor · Chemistry',recordQuestion:'Qualification equivalence question',matters:'Knowing whether to apply',
    reviewWhy:'The candidate is asking whether their experience meets a listed qualification.',established:'The published qualification and the candidate’s question, in their own words.',decision:'How to answer. The committee assesses qualifications only once an application is submitted.',
    draft:'Thank you for asking. The search committee reviews every application against the posting. You are welcome to explain your research experience in your cover letter.',
    next:'Continue with a recruiter',nextCopy:'The recruiter answers the question; the committee assesses the application.',nextStatus:'Human judgment required',
    note:'The instructions tell the agent never to assess eligibility, equivalence or fit for a named person, and the Escalate topic routes these questions to a recruiter. In the EU, AI systems used to evaluate candidates are classed as high-risk under the AI Act. Keep this agent informational and get HR and legal review before launch.'}
  },
  reviewNote:'Built with an agent flow that posts the draft to the recruiter in Teams with the Approvals connector; nothing is sent until a person approves. Don’t use AI approval stages (preview) to accept or reject candidates. The agent doesn’t screen, rank or score applicants. Every message is reviewed by a person.',
  recordNote:'The note is written by an agent flow with a fixed field mapping, so HR can audit exactly what leaves the conversation. Don’t write inferred traits or sentiment, only the question the candidate asked.',
  schedule:{kicker:'Scheduling · Outlook',title:'Once the recruiter approves, a flow finds a time that works for the panel.',steps:['The recruiter approves the next step in Teams. The agent never invites anyone by itself.','A flow calls “Find meeting times (V2)” across the panel’s Outlook calendars.','“Create event (V4)” sends the invitation once the recruiter confirms the slot.']},
  funnel:{ask:'What is the median time to fill for open staff roles this term, by department?',rows:[['Library',38],['IT services',52],['Facilities',61],['Student services',44]],unit:'days',foot:'Answered by a Fabric data agent over HR reporting tables, as aggregate figures. Illustrative figures · not product output.'},
  nextNote:'Interview scheduling uses Office 365 Outlook connector actions in an agent flow (“Find meeting times (V2)” and “Create event (V4)”). A recruiter approves first. Hiring metrics come from a Fabric data agent connected to the internal Teams agent (preview; validated only in Teams), with user authentication so a hiring manager sees only their own department. Keep the data agent on aggregate tables, not individual applicant records.'
 }
};

const stages={
 interest:{number:'01',caption:'Four ways a conversation begins'},
 expertise:{number:'02',title:'Coordinated expertise',caption:'Question, child agents, and sources together'},
 record:{number:'03'},
 review:{number:'04',caption:'Decision-ready context and follow-up'},
 next:{number:'05',title:'A clear next step',caption:'One connected recruitment journey'}
};

const state={audience:'student',channel:{student:0,staff:0},route:{student:'fit',staff:'fit'},system:{student:0,staff:0},reviews:{},expanded:false,activeStage:null};
for(const [aud,data] of Object.entries(audiences)){state.reviews[aud]={};for(const [key,route] of Object.entries(data.routes))state.reviews[aud][key]={draft:route.draft,status:'unreviewed',editing:false,feedback:'Awaiting review'};}

const A=()=>audiences[state.audience];
const R=()=>A().routes[state.route[state.audience]];
const reviewState=()=>state.reviews[state.audience][state.route[state.audience]];
function stageTitle(id){return stages[id].title||A().stageTitles[id];}
function stageCaption(id){return id==='record'?A().recordCaption:stages[id].caption;}

function announce(message){$('#announcement').textContent=message;}
function setPressed(selector,value,key){$$(selector).forEach(button=>button.setAttribute('aria-pressed',String(button.dataset[key]===String(value))));}
function fillChips(selector,values){$(selector).replaceChildren(...values.map(value=>{const chip=document.createElement('span');chip.textContent=value;return chip;}));}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}

/* ================= presenter notes ================= */
$('#notes-on').addEventListener('change',e=>{$$('.pnote').forEach(p=>{p.hidden=!e.target.checked;});});

/* ================= journey ================= */
function setExpanded(expanded,{focus=false}={}){
 state.expanded=expanded;
 $('#journey').classList.toggle('is-collapsed',!expanded);
 $('#journey-toggle').setAttribute('aria-expanded',String(expanded));
 $('#journey-toggle').innerHTML=expanded?'Collapse flow <span aria-hidden="true">↙</span>':'Expand flow <span aria-hidden="true">↗</span>';
 $$('[data-stage]').forEach(card=>{
  const cover=card.dataset.stage==='next';
  card.inert=!expanded&&!cover;
  card.setAttribute('aria-expanded','false');
  if(!expanded&&!cover)card.setAttribute('aria-hidden','true');else card.removeAttribute('aria-hidden');
  if(!expanded&&cover){card.removeAttribute('aria-haspopup');card.setAttribute('aria-controls','journey-canvas');card.setAttribute('aria-label','Expand recruitment journey: A clear next step');}
  else{card.setAttribute('aria-haspopup','dialog');card.setAttribute('aria-controls','stage-dialog');card.removeAttribute('aria-label');}
 });
 if(focus)$('[data-stage="next"]').focus({preventScroll:true});
 announce(expanded?'Recruitment journey expanded. Five stages are available.':'Recruitment journey collapsed into A clear next step.');
}

function renderHeader(){
 if(!state.activeStage)return;
 const id=state.activeStage;
 $('#panel-number').textContent=stages[id].number;
 $('#panel-title').textContent=stageTitle(id);
 $('#panel-caption').textContent=stageCaption(id);
}

function openStage(id){
 if(!stages[id])return;
 if(!state.expanded){setExpanded(true,{focus:true});return;}
 const dialog=$('#stage-dialog');
 state.activeStage=id;
 $$('[data-panel]').forEach(panel=>panel.hidden=panel.dataset.panel!==id);
 $$('[data-stage]').forEach(card=>{const active=card.dataset.stage===id;card.setAttribute('aria-expanded',String(active));if(active)card.setAttribute('aria-current','step');else card.removeAttribute('aria-current');});
 renderHeader();
 $('.panel-header').classList.toggle('is-human',id==='review');
 if(!dialog.open)dialog.showModal();
 $('.panel-body').scrollTop=0;
 $('#panel-title').focus({preventScroll:true});
 announce(`${stageTitle(id)} opened.`);
}

function closeStage({returnFocus=true}={}){
 const dialog=$('#stage-dialog'),id=state.activeStage;
 if(!dialog.open)return;
 dialog.close();
 state.activeStage=null;
 $$('[data-stage]').forEach(card=>{card.setAttribute('aria-expanded','false');card.removeAttribute('aria-current');});
 if(returnFocus&&id)$(`[data-stage="${id}"]`).focus({preventScroll:true});
 announce('Back to the recruitment journey. Your selections are retained.');
}

/* ================= renderers ================= */
function renderAudience(){
 const a=A();
 setPressed('[data-audience]',state.audience,'audience');
 $$('[data-stage-title]').forEach(n=>{n.textContent=a.stageTitles[n.dataset.stageTitle];});
 $$('[data-stage-caption]').forEach(n=>{n.textContent=a.recordCaption;});
 $('#interest-heading').textContent=a.interestHeading;
 $('#interest-intro').textContent=a.interestIntro;
 $('#expertise-intro').textContent=a.expertiseIntro;
 $('#record-intro').textContent=a.recordIntro;
 $('#review-heading').textContent=a.reviewHeading;
 $('#review-why-label').textContent=a.reviewWhyLabel;
 $('#review-next-label').textContent=a.reviewNext;
 $('#next-next-label').textContent=a.nextNext;
 $('#next-intro').textContent=a.nextIntro;
 $('#branch-strong').textContent=a.branch[0];
 $('#branch-span').textContent=a.branch[1];
 $('#flow-2').textContent=a.flow2;
 $('#flow-4').textContent=a.flow4;
 $('#closing-question').textContent=a.closingQuestion;
 $('#fairness').hidden=state.audience!=='staff';
 const rec=a.record;
 $('#record-kind').textContent=rec.kind;$('#record-heading').textContent=rec.heading;$('#record-chip').textContent=rec.chip;
 $('#crm-dept').textContent=rec.dept;$('#record-interest-label').textContent=rec.interestLabel;$('#record-question-label').textContent=rec.questionLabel;
 $('#record-arrow-text').textContent=rec.arrow;
 $('#direction-text').textContent=a.direction;
 $('#review-note').textContent=a.reviewNote;
 $('#next-note').textContent=a.nextNote;
 // channel buttons
 $$('[data-channel]').forEach((b,i)=>{const c=a.channels[i];b.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[c.icon]}</svg><strong></strong><span></span>`;b.querySelector('strong').textContent=c.label;b.querySelector('span').textContent=c.sub;});
 // question buttons
 $$('[data-route]').forEach(b=>{const r=a.routes[b.dataset.route];b.querySelector('span').textContent=r.tag;b.querySelector('strong').textContent=r.question;});
 // system buttons
 $$('[data-system]').forEach((b,i)=>{const s=a.systems[i];b.replaceChildren(el('strong',null,s.name),el('span',null,s.sub));});
 // specialists
 $('#a-specialist h3').textContent=a.specialists.a;
 $('#b-specialist h3').textContent=a.specialists.b;
 // schedule + funnel
 $('#schedule-kicker').textContent=a.schedule.kicker;
 $('#schedule-title').textContent=a.schedule.title;
 $('#schedule-steps').replaceChildren(...a.schedule.steps.map(s=>el('li',null,s)));
 $('#funnel-ask').textContent=`“${a.funnel.ask}”`;
 const max=Math.max(...a.funnel.rows.map(r=>r[1]));
 $('#funnel-rows').replaceChildren(...a.funnel.rows.map(([label,v])=>{
  const row=el('div','funnel-row');row.setAttribute('role','img');row.setAttribute('aria-label',`${label}: ${v.toLocaleString('en-US')}${a.funnel.unit?' '+a.funnel.unit:''}`);
  const track=el('div','funnel-track');const bar=el('div','funnel-bar');bar.style.width=`${Math.round(v/max*100)}%`;track.append(bar);
  row.append(el('span',null,label),track,el('b',null,v.toLocaleString('en-US')+(a.funnel.unit?' d':'')));return row;}));
 $('#funnel-foot').textContent=a.funnel.foot;
 renderHeader();
 renderChannel();renderSystem();renderRoute();
}

function renderChannel(){
 const c=A().channels[state.channel[state.audience]];
 setPressed('[data-channel]',state.channel[state.audience],'channel');
 $('#channel-summary').textContent=c.summary;
 $('#channel-mech').textContent=c.mech;
 $('#channel-note').innerHTML=c.note;
 $('#question-channel').textContent=c.from;
 $('#record-channel').textContent=c.label;
 $('#next-channel').textContent=c.from;
}

function renderSystem(){
 const s=A().systems[state.system[state.audience]];
 setPressed('[data-system]',state.system[state.audience],'system');
 $('#crm-system').textContent=s.name;
 $('#system-how').textContent=s.how;
 $('#system-detail').textContent=s.detail;
 $('#record-note').textContent=`${A().recordNote} ${s.note}`;
}

function renderSpecialist(key,route){
 const card=$(`#${key}-specialist`);
 const active=route.active.includes(key);
 card.classList.toggle('is-active',active);
 card.querySelector('.status').textContent=active?'Consulted':'Not needed';
 card.querySelector('.contribution').textContent=route[key][0];
 card.querySelector('.source').hidden=!active;
 card.querySelector('.source strong').textContent=route[key][1];
}

function renderReview(){
 const route=R(),review=reviewState();
 $('#review-why').textContent=route.reviewWhy;
 $('#review-established').textContent=route.established;
 $('#review-decision').textContent=route.decision;
 $('#draft-message').textContent=review.draft;
 $('#draft-message').hidden=review.editing;
 $('#editor-wrap').hidden=!review.editing;
 $('#draft-editor').value=review.draft;
 $('#review-feedback').textContent=review.feedback;
 $$('[data-action]').forEach(button=>{
  const selected=(button.dataset.action==='approve'&&review.status==='approved')||(button.dataset.action==='hold'&&review.status==='held')||(button.dataset.action==='edit'&&review.editing);
  button.setAttribute('aria-pressed',String(selected));
  button.disabled=review.editing&&button.dataset.action!=='edit';
 });
}

function renderRoute(){
 const route=R();
 setPressed('[data-route]',state.route[state.audience],'route');
 $('#selected-question').textContent=`“${route.question}”`;
 $('#route-title').textContent=route.title;
 $('#route-reason').textContent=route.reason;
 fillChips('#route-intent',route.intent);
 renderSpecialist('a',route);
 renderSpecialist('b',route);
 $('#human-boundary').hidden=!route.human;
 if(route.human){$('#boundary-strong').textContent=route.boundaryStrong;$('#boundary-p').textContent=route.boundaryP;}
 $('#result-title').textContent=route.result;
 $('#result-text').textContent=route.resultText;
 fillChips('#result-points',route.points);
 $('#result-boundary').textContent=route.boundary;
 $('#route-note').textContent=route.note;
 $('#record-interest').textContent=route.interest;
 $('#record-question').textContent=route.recordQuestion;
 $('#record-matters').textContent=route.matters;
 $('#next-title').textContent=route.next;
 $('#next-copy').textContent=route.nextCopy;
 $('#next-status').textContent=route.nextStatus;
 renderReview();
}

/* ================= events ================= */
$$('[data-audience]').forEach(button=>button.addEventListener('click',()=>{
 if(state.audience===button.dataset.audience)return;
 state.audience=button.dataset.audience;
 renderAudience();
 announce(`${A().label} selected. Every stage now shows the ${A().label.toLowerCase()} journey.`);
}));

$$('[data-channel]').forEach(button=>button.addEventListener('click',()=>{
 state.channel[state.audience]=Number(button.dataset.channel);
 renderChannel();
 announce(`${A().channels[state.channel[state.audience]].label} selected. The conversation context has been updated.`);
}));

$$('[data-system]').forEach(button=>button.addEventListener('click',()=>{
 state.system[state.audience]=Number(button.dataset.system);
 renderSystem();
 announce(`${A().systems[state.system[state.audience]].name} selected.`);
}));

$$('[data-route]').forEach(button=>button.addEventListener('click',()=>{
 state.route[state.audience]=button.dataset.route;
 renderRoute();
 announce(`Question selected: ${R().question}`);
}));

$$('[data-action]').forEach(button=>button.addEventListener('click',()=>{
 const review=reviewState();
 const who=state.audience==='staff'?'candidate':'student';
 if(button.dataset.action==='edit'){
  review.editing=true;review.status='unreviewed';review.feedback='Editing · Review again after saving';
 }else if(button.dataset.action==='approve'){
  review.status='approved';review.feedback=`Approved · the flow would now email the ${who} · Nothing sent in this Lab`;
 }else{
  review.status='held';review.feedback='Follow-up held · Resolve the open question first';
 }
 renderReview();
 if(review.editing)$('#draft-editor').focus();
}));

$('#draft-editor').addEventListener('input',event=>{reviewState().draft=event.target.value;});
$('#save-edit').addEventListener('click',()=>{
 const review=reviewState();
 if(!review.draft.trim()){
  review.feedback='Add wording before saving.';
  $('#review-feedback').textContent=review.feedback;
  $('#draft-editor').focus();
  return;
 }
 review.editing=false;review.status='edited';review.feedback='Edit saved · Needs review';
 renderReview();
 $('[data-action="edit"]').focus();
});

$('#journey-toggle').addEventListener('click',()=>setExpanded(!state.expanded,{focus:state.expanded}));
$$('[data-stage]').forEach(card=>card.addEventListener('click',()=>openStage(card.dataset.stage)));
$$('[data-open-stage]').forEach(button=>button.addEventListener('click',()=>openStage(button.dataset.openStage)));
$('#close-stage').addEventListener('click',()=>closeStage());
$('#stage-dialog').addEventListener('cancel',event=>{event.preventDefault();closeStage();});
$('#stage-dialog').addEventListener('click',event=>{if(event.target===$('#stage-dialog'))closeStage();});
$('#collapse-journey').addEventListener('click',()=>{
 closeStage({returnFocus:false});
 setExpanded(false,{focus:true});
 $('#journey').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
});

renderAudience();
setExpanded(false);
