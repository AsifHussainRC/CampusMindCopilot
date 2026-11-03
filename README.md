# Campus Copilot · Campus Chat Lab

A static, single-page "Lab" showing how one **Microsoft Copilot Studio** agent can give a whole campus the same AI chat experience. Behind the agent are:

- **Copilot Studio agent** using generative orchestration. Its main model is GPT Chat Latest by default, or Claude Sonnet 4.6 or Opus 4.6–4.8 once an admin allows Anthropic.
- **Fabric data agents** added as connected agents for questions about institutional data (OneLake, warehouses, semantic models).
- **MCP servers**, connectors and **Power Automate agent flows** as tools (LMS, SIS, ITSM, booking, email).
- **Topics** for guided questions, escalation and system behaviour (start over, feedback).
- Publishing to **Microsoft Teams**, including group chats.

Designed and delivered by **Royal Cyber**, implementation partner for agentic solutions built on Microsoft Copilot Studio. Every page shows a partner strip under the navigation (`assets/copilot-studio-icon.png`, `assets/royal-cyber-logo.png`, styled in `labs-navigation.css`).

## Labs

| Page | What it shows |
|---|---|
| `/` | Labs home |
| `/campus-chat` | One institution-wide agent in Teams, model choice, group chats |
| `/campus-chat-plus` | Agent Store sharing, multi-source answers, child/connected/Fabric agents, website channel |
| `/ontology` (Data Bridge) | OneLake ingestion, Fabric IQ ontology (preview), Fabric data agents, row security, Work IQ |
| `/admin-console` | Copilot Credits capacity and limits, DLP, consumption reports, observability, roles, branding |
| `/virtual-teaching-assistant` | Course TA in Teams, an LMS page (web chat embed) and Microsoft 365 Copilot |
| `/retention` | Early-alert signals in Fabric, thresholds, outreach flows, advisor context |
| `/recruitment` | Student and staff/faculty recruitment, with human-only decisions |
| `/advising` | Advisor brief, cross-system checks, confirmed follow-up flows |
| `/pricing` | Copilot Credits estimator: prepaid packs vs pay-as-you-go, with sources |

Each page has a **Notes** toggle (or a "How it's built" box) naming the exact Microsoft component, setting and preview caveat behind each section.

## Campus Chat sections

1. Everyone, or nobody: individual subscriptions compared with one institution-billed agent (Copilot Credits).
2. Every model: only models offered in Copilot Studio. GPT Chat Latest (default), Claude Sonnet 4.6 and Opus 4.8 (also 4.7 and 4.6), Mistral (preview), Grok 4.2 (experimental), plus Llama, DeepSeek and the rest of the Azure AI Foundry catalog in prompt tools.
3. Right model, same thread: the orchestrator sends steps to a connected agent or prompt on another model, and the context carries over.
4. Bring people in: the agent in a Teams group chat.
5. Message mode: the agent only responds when @mentioned; an agent flow reads the recent chat history so it can catch up.
6. One place: web search, Fabric data, MCP tools, SharePoint, file upload, code interpreter, topics, flows.
7. How it's built: the architecture stack.

Turn on **Notes** in the header to show presenter notes with the platform details.

## Accuracy notes (checked November 2026)

- A Copilot Studio agent with a connected Fabric data agent (preview) is validated **only in Microsoft Teams**. It isn't supported in Microsoft 365 Copilot. ([docs](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-fabric-data-agent))
- Primary model list ([docs](https://learn.microsoft.com/microsoft-copilot-studio/authoring-select-agent-model), updated 2026-10-23):
  - GPT Chat Latest is the default.
  - GPT-5.3 Chat and GPT-5.5 Chat retired in October 2026, and GPT-4.1 and GPT-5 Chat, Auto and Reasoning retire on 12 November 2026. All are replaced by GPT Chat Latest, so the site doesn't list them.
  - Claude Sonnet 4.6 and Claude Opus 4.6, 4.7 and 4.8 are GA. Grok 4.2 is experimental, in US early-access environments only.
- External models (Anthropic, Mistral, xAI) need an admin to turn on external models in the Power Platform admin center and allow each provider in the Microsoft 365 admin center. Mistral and xAI models are pre-release. ([docs](https://learn.microsoft.com/microsoft-copilot-studio/authoring-select-external-response-model))
- In prompt builder, Claude Sonnet 4.6 and Opus 4.6 are offered but treated as experimental there. ([docs](https://learn.microsoft.com/ai-builder/prompt-modelsettings))
- Azure AI Foundry models are used in **prompts** ("bring your own model": Llama, DeepSeek and 1,800+ catalog models), not as the main orchestration model. ([docs](https://learn.microsoft.com/microsoft-copilot-studio/bring-your-own-model-prompts))
- In Teams group chats and channels the agent receives only the messages that @mention it. Catching up on earlier messages needs an agent flow that reads chat history through Microsoft Graph.
- Code interpreter on uploaded files is turned on under Settings → Generative AI → File processing capabilities. ([docs](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-code-interpreter-structured-data))
- Usage is billed to the tenant in Copilot Credits (prepaid packs or pay-as-you-go). ([docs](https://learn.microsoft.com/microsoft-copilot-studio/copilot-credits-overview))
- Figures and conversations are illustrative, not product output.

## Run locally

```bash
npx serve .
```

Deploy as-is to any static host. `vercel.json` turns on clean URLs, so `/campus-chat` serves `campus-chat.html`.
