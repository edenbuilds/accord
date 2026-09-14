import type { Metadata } from "next";
import { Header, Footer } from "@/components/ui";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "What Accord stores, for how long, and who processes it. No cookies, no analytics, no ads.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero">
          <div className="shell">
            <p className="kicker">Legal</p>
            <h1 className="title">Privacy policy</h1>
            <p className="lede">What we keep, why, and for how long. Written to be read.</p>
          </div>
        </section>
        <section className="section">
          <div className="shell prose">
            <p className="updated">Last updated 14-09-2026</p>
            <h2>The short version</h2>
            <p>
              No cookies, no analytics, no ads. We keep the minimum needed to run a gateway, for 30 days at most, and we never
              sell anything.
            </p>
            <h2>What we store</h2>
            <ul>
              <li>
                <strong>The converter</strong> runs in your browser. What you paste stays there unless you create a gateway.
              </li>
              <li>
                <strong>Sandbox gateways.</strong> When you create one, we store the converted tool definitions for 30 days.
                The converter removes API keys first, so no secret values are stored.
              </li>
              <li>
                <strong>Call receipts.</strong> For each gateway call we keep the tool name, the decision, timing, sizes and a
                fingerprint of the inputs for 30 days. We do not keep response bodies. Repeated reads may be cached for up to
                5 minutes.
              </li>
              <li>
                <strong>Rate limits.</strong> We keep a one-way fingerprint of your IP address for up to one hour to stop
                abuse.
              </li>
              <li>
                <strong>The waitlist.</strong> Your email, and your name, company and note if you add them, so we can tell you
                when accounts open.
              </li>
            </ul>
            <h2>In your browser</h2>
            <p>
              We use session storage to show the intro animation once, and local storage to remember the gateways you created
              and your workbench policy. You can clear both at any time in your browser settings.
            </p>
            <h2>Who processes it</h2>
            <ul>
              <li>Vercel hosts the site and may keep standard server logs.</li>
              <li>Upstash stores gateways, receipts and counters.</li>
              <li>Resend stores waitlist contacts.</li>
            </ul>
            <h2>Your choices</h2>
            <p>
              Sandbox data expires on its own after 30 days. To delete a gateway or your waitlist entry sooner, contact us
              through <a href="https://edenbuilds.me">edenbuilds.me</a> and we will remove it.
            </p>
            <h2>Changes</h2>
            <p>If this policy changes, we will update this page and the date above.</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
