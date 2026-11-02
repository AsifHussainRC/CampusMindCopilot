# Campus Copilot · Campus Chat Lab

A static, single-page "Lab" showing how one **Microsoft Copilot Studio** agent can give a whole campus the same AI chat experience. Behind the agent are:

- **Copilot Studio agent** using generative orchestration. Its main model is OpenAI GPT by default, or Anthropic Claude if an admin allows it.
- **Fabric data agents** added as connected agents for questions about institutional data (OneLake, warehouses, semantic models).
- **MCP servers**, connectors and **Power Automate agent flows** as tools (LMS, SIS, ITSM, booking, email).
- **Topics** for guided questions, escalation and system behaviour (start over, feedback).
- Publishing to **Microsoft Teams**, including group chats.

## Sections

1. Everyone, or nobody: individual subscriptions compared with one institution-billed agent (Copilot Credits).
2. Every model: GPT and Claude, plus Azure AI Foundry models (Llama, Mistral, DeepSeek, Phi) in prompt tools.
3. Right model, same thread: the orchestrator sends steps to a connected agent or prompt on another model, and the context carries over.
4. Bring people in: the agent in a Teams group chat.
5. Message mode: the agent only responds when @mentioned; an agent flow reads the recent chat history so it can catch up.
6. One place: web search, Fabric data, MCP tools, SharePoint, file upload, code interpreter, topics, flows.
7. How it's built: the architecture stack.
8. See it live: link to the published Teams agent (set `AGENT_URL` in `campus-chat.js`).

Turn on **Notes** in the header to show presenter notes with the platform details.

## Accuracy notes (checked November 2026)

- A Copilot Studio agent with a connected Fabric data agent (preview) is validated **only in Microsoft Teams**. It isn't supported in Microsoft 365 Copilot. ([docs](https://learn.microsoft.com/microsoft-copilot-studio/add-agent-fabric-data-agent))
- Anthropic models must be allowed by an admin. Some Claude versions are preview or experimental. ([blog](https://www.microsoft.com/en-us/microsoft-copilot/blog/copilot-studio/anthropic-joins-the-multi-model-lineup-in-microsoft-copilot-studio/))
- Azure AI Foundry models are used in **prompts** ("bring your own model"), not as the main orchestration model. ([docs](https://learn.microsoft.com/microsoft-copilot-studio/bring-your-own-model-prompts))
- In Teams group chats and channels the agent receives only the messages that @mention it. Catching up on earlier messages needs an agent flow that reads chat history through Microsoft Graph.
- Code interpreter on uploaded files is turned on under Settings → Generative AI → File processing capabilities. ([docs](https://learn.microsoft.com/microsoft-copilot-studio/knowledge-code-interpreter-structured-data))
- Usage is billed to the tenant in Copilot Credits (prepaid packs or pay-as-you-go). ([docs](https://learn.microsoft.com/microsoft-copilot-studio/copilot-credits-overview))
- Figures and conversations are illustrative, not product output.

## Run locally

```bash
npx serve .
```

Deploy as-is to any static host. `vercel.json` turns on clean URLs, so `/campus-chat` serves `campus-chat.html`.
