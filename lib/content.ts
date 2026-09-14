// Shared plain-language copy. Used by the homepage, JSON-LD and llms.txt so
// search engines and AI answer engines read exactly what visitors read.

export const SITE = "https://mcp.edenbuilds.me";
export const TAGLINE = "Connect your AI to any API. Safely.";
export const SUMMARY =
  "Accord turns any API into tools an AI agent can call, then checks every call before it runs: which tools each agent may use, whether it is stuck in a loop, whether a person must approve it, and which fields the model should never see.";

export const faqs = [
  {
    q: "What does Accord do, in plain words?",
    a: "It turns an API into tools an AI agent can call, then sits between the agent and the API. Every call is checked: is this agent allowed to use this tool, is it stuck in a loop, does a person need to approve it, and which fields should the model never see.",
  },
  {
    q: "Do I need an account to try it?",
    a: "No. The converter, the sandbox chat and a live sandbox gateway all work without signing up. Accounts that keep gateways and audit logs for longer are coming. Join the waitlist to get one first.",
  },
  {
    q: "Does Accord add latency?",
    a: "A little, and we show you exactly how much. Every receipt records the time Accord spent on the call. Repeated read calls are served from cache, which skips your API entirely. We have not published a latency guarantee yet.",
  },
  {
    q: "Do you store our API payloads?",
    a: "The sandbox never calls your API, so there is nothing to store. We keep call receipts for 30 days: tool name, decision, timing and sizes, never response bodies. Servers you deploy yourself send nothing to us. Streaming receipts to Datadog or Splunk is on the roadmap.",
  },
  {
    q: "How are API keys handled?",
    a: "Keys never go into the tool definition. The converter removes them when you paste a command. When you deploy your own server, it adds your key to each request on the server, so the agent never sees it.",
  },
  {
    q: "Is it ready for enterprise production?",
    a: "Not yet. Accord is a developer preview. The checks run today. SSO, identity mapping, Slack approvals and audit export are on the roadmap. There is no SOC 2 report or SLA yet.",
  },
  {
    q: "What do sandbox calls return?",
    a: "Realistic sample data built from the API's own schema. You see the whole flow, including the checks, without connecting a real system.",
  },
];
