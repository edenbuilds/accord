export const samplePayload = {
  id: "example-issue",
  title: "Review webhook retries",
  state: "open",
  labels: ["reliability"],
  body: "This fictional issue is used only to demonstrate payload projection.",
  repository: {
    name: "sample-project",
    description: "A fictional repository for the Accord workbench",
    owner: {
      login: "sample-team",
      avatar_url: "https://example.com/avatar.png",
    },
    permissions: { admin: false, push: false, pull: true },
  },
  events: [
    { type: "opened", actor: "example-author" },
    { type: "labeled", actor: "example-bot" },
  ],
  links: {
    html: "https://example.com/issues/example-issue",
    comments: "https://example.com/issues/example-issue/comments",
  },
  metadata: {
    node_id: "illustrative-only",
    etag: "example",
    source: "workbench fixture",
  },
};
export const scenarios = [
  {
    name: "Read an issue",
    tool: "github.list_issues",
    description: "An allowed read, inside the budget.",
    callsInWindow: 3,
    payloadBytes: 480,
  },
  {
    name: "Create an issue",
    tool: "github.create_issue",
    description: "A write that needs a human decision.",
    callsInWindow: 3,
    payloadBytes: 640,
  },
  {
    name: "Delete a database",
    tool: "database.drop",
    description: "An action outside the allowlist.",
    callsInWindow: 3,
    payloadBytes: 128,
  },
  {
    name: "Agent retry loop",
    tool: "github.list_issues",
    description: "An allowed tool, called too many times.",
    callsInWindow: 35,
    payloadBytes: 480,
  },
];
