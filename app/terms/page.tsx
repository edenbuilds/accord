import type { Metadata } from "next";
import { Header, Footer } from "@/components/ui";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "The terms for using Accord, the free sandbox and the self-hosted MCP server template.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero">
          <div className="shell">
            <p className="kicker">Legal</p>
            <h1 className="title">Terms of use</h1>
            <p className="lede">Plain rules for using Accord while it is a developer preview.</p>
          </div>
        </section>
        <section className="section">
          <div className="shell prose">
            <p className="updated">Last updated 14-09-2026</p>
            <h2>Who we are</h2>
            <p>
              Accord is made by Eden Builds. By using mcp.edenbuilds.me, the sandbox gateways or the code in our GitHub
              repository, you agree to these terms.
            </p>
            <h2>A developer preview</h2>
            <p>
              Accord is an early product. It is provided as it is, without warranties of any kind. There is no service level
              agreement, no uptime promise and no compliance certification. Features can change or stop without notice.
            </p>
            <h2>The free sandbox</h2>
            <ul>
              <li>Each sandbox gateway allows 1,000 calls and lasts up to 30 days.</li>
              <li>Sandbox calls return sample data. They never reach your real API.</li>
              <li>We may change these limits, or remove a gateway that is being abused.</li>
            </ul>
            <h2>Fair use</h2>
            <ul>
              <li>Do not break the law or help anyone else break it.</li>
              <li>Do not try to get around limits, attack the service, or access data that is not yours.</li>
              <li>Do not paste real secrets or other people’s personal data into the sandbox.</li>
              <li>Do not use Accord to pretend to be someone else.</li>
            </ul>
            <h2>Your content</h2>
            <p>
              You keep the rights to anything you paste or upload. You allow us to store and process it only to run the
              service, as described in our privacy policy.
            </p>
            <h2>Self-hosted code</h2>
            <p>
              The code in our repository is released under the MIT license. When you run it yourself, you are responsible for
              your deployment, your API keys and the calls your server makes.
            </p>
            <h2>Liability</h2>
            <p>
              To the extent the law allows, Eden Builds is not liable for indirect or consequential losses, lost data or lost
              profits from using Accord. Our total liability for any claim is limited to the amount you paid us in the 12
              months before it. During the preview that amount is zero.
            </p>
            <h2>Changes and contact</h2>
            <p>
              We will update this page when these terms change and show the new date above. These terms are governed by the
              laws of India. Questions? Contact us through <a href="https://edenbuilds.me">edenbuilds.me</a>.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
