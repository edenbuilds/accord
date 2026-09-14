import type { Brand } from "@/components/brand-icon";
import type { PolicyOverrides } from "./pipeline";

// Outcome templates. Endpoints are the vendors' documented public API paths
// (or an obvious "your-company" placeholder for internal APIs). Every id, key
// and email in them is a placeholder, never real data.

export type UseCase = {
  slug: string;
  label: string;
  brands: Brand[];
  headline: string;
  summary: string;
  guardTitle: string;
  guard: string;
  steps: string[];
  ask: string;
  input: string;
  policy: PolicyOverrides;
};

export const useCases: UseCase[] = [
  {
    slug: "devops",
    label: "DevOps and IT",
    brands: ["pagerduty", "github"],
    headline: "Let the agent fix staging. Keep it out of production.",
    summary:
      "Your agent reads PagerDuty incidents and restarts staging servers on its own. The production restart tool is hidden from it, so it cannot even ask.",
    guardTitle: "Role-based access",
    guard: "Tools that touch production are filtered out of the agent’s tool list.",
    steps: ["Reads open incidents", "Restarts the staging server", "Never sees the production tool"],
    ask: "Staging is down. Check PagerDuty and restart the server.",
    input: `# list_incidents: See open PagerDuty incidents
curl https://api.pagerduty.com/incidents \\
  -H "Authorization: Token token=$PAGERDUTY_TOKEN"
# restart_staging_server: Restart a staging server
curl -X POST https://api.your-company.com/v1/staging/servers/{server_id}/restart \\
  -H "Authorization: Bearer $OPS_TOKEN"
# restart_production_server: Restart a production server
curl -X POST https://api.your-company.com/v1/production/servers/{server_id}/restart \\
  -H "Authorization: Bearer $OPS_TOKEN"`,
    policy: {
      roles: {
        agent: { allow: ["*"], deny: ["*/production/*"], readOnly: false },
        viewer: { allow: ["*"], deny: [], readOnly: true },
      },
    },
  },
  {
    slug: "customer-success",
    label: "Customer success",
    brands: ["zendesk", "stripe"],
    headline: "Refund drafts without handing over customer data.",
    summary:
      "Your agent reads the Zendesk ticket and the Stripe charge, then drafts the refund. Emails and phone numbers are removed before the model sees them.",
    guardTitle: "Private fields removed",
    guard: "Emails, phones and addresses are replaced before the response reaches the model.",
    steps: ["Reads the ticket", "Looks up the charge", "Refund waits for your approval"],
    ask: "Read ticket 35436, check the charge and draft a refund.",
    input: `# get_ticket: Read a Zendesk ticket
curl https://your-company.zendesk.com/api/v2/tickets/{ticket_id}.json \\
  -u "you@your-company.com/token:$ZENDESK_TOKEN"
# get_charge: Look up a Stripe charge
curl https://api.stripe.com/v1/charges/{charge_id} \\
  -u "$STRIPE_SECRET_KEY:"
# create_refund: Refund a Stripe charge
curl https://api.stripe.com/v1/refunds \\
  -u "$STRIPE_SECRET_KEY:" \\
  -d charge=ch_sample123 \\
  -d amount=1500`,
    policy: { redact: ["email", "phone", "address"], requireApproval: ["create_refund"] },
  },
  {
    slug: "hr-onboarding",
    label: "HR and onboarding",
    brands: ["google", "slack"],
    headline: "New hire accounts, approved by a person.",
    summary:
      "Your agent prepares the Google Workspace account and the Slack invite. Nothing is created until an admin approves it.",
    guardTitle: "Human approval",
    guard: "Every account change is held until a person approves it. Nothing is sent before that.",
    steps: ["Checks existing accounts", "Prepares the new account", "Waits for an admin"],
    ask: "Set up accounts for our new designer starting Monday.",
    input: `# list_workspace_users: List Google Workspace accounts
curl "https://admin.googleapis.com/admin/directory/v1/users?customer=my_customer" \\
  -H "Authorization: Bearer $GOOGLE_TOKEN"
# create_workspace_user: Create a Google Workspace account
curl -X POST https://admin.googleapis.com/admin/directory/v1/users \\
  -H "Authorization: Bearer $GOOGLE_TOKEN" \\
  --json '{"primaryEmail":"new.hire@your-company.com","name":{"givenName":"New","familyName":"Hire"}}'
# invite_to_slack: Invite someone to Slack
curl -X POST https://slack.com/api/admin.users.invite \\
  -H "Authorization: Bearer $SLACK_TOKEN" \\
  --json '{"email":"new.hire@your-company.com","channel_ids":"C0SAMPLE1","team_id":"T0SAMPLE1"}'`,
    policy: { requireApproval: ["create_*", "invite_*"] },
  },
  {
    slug: "data-bi",
    label: "Data and BI",
    brands: ["snowflake", "datadog"],
    headline: "Ask the same question twice. Pay for it once.",
    summary:
      "Your agent writes SQL against Snowflake. When it runs the same query again, Accord answers from its cache instead of your warehouse.",
    guardTitle: "Cached repeat queries",
    guard: "Identical queries within five minutes are served from the cache.",
    steps: ["Runs the query once", "Serves repeats from cache", "Records every run"],
    ask: "What was revenue by region last quarter? Check it again.",
    input: `# run_sql: Run a SQL query in Snowflake
curl -X POST https://your-account.snowflakecomputing.com/api/v2/statements \\
  -H "Authorization: Bearer $SNOWFLAKE_TOKEN" \\
  --json '{"statement":"select region, sum(revenue) from sales group by region","warehouse":"ANALYTICS_WH","timeout":60}'`,
    policy: { cache: ["run_sql"], cacheSeconds: 300 },
  },
];

export function templateFor(input: string) {
  return useCases.find((u) => u.input.trim() === input.trim());
}

export const quickSamples = [
  {
    label: "Stripe refund",
    input: `curl https://api.stripe.com/v1/refunds \\
  -u "$STRIPE_SECRET_KEY:" \\
  -d charge=ch_sample123 \\
  -d amount=1500`,
  },
  {
    label: "GitHub issues",
    input: `curl https://api.github.com/repos/your-org/your-repo/issues?state=open \\
  -H "Authorization: Bearer $GITHUB_TOKEN"`,
  },
  {
    label: "Delete a contact",
    input: `curl -X DELETE https://api.hubapi.com/crm/v3/objects/contacts/{contact_id} \\
  -H "Authorization: Bearer $HUBSPOT_TOKEN"`,
  },
];
