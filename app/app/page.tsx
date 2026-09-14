import type { Metadata } from "next";
import { Header, Footer } from "@/components/ui";
import Converter from "@/components/converter";
import { MyGateways } from "@/components/live-gateway";
import { useCases } from "@/lib/use-cases";

export const metadata: Metadata = {
  title: "Converter: turn any API into MCP tools",
  description:
    "Paste a cURL command, OpenAPI or Swagger spec, or Postman collection. Get MCP tools, test them in a sandbox chat, and create a live gateway URL.",
  alternates: { canonical: "/app" },
};

export default async function AppPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  const { template } = await searchParams;
  const initial = useCases.find((u) => u.slug === template)?.input;
  return (
    <>
      <Header />
      <main id="main" className="page-hero">
        <div className="shell">
          <p className="kicker">The Accord app</p>
          <h1 className="title">
            Turn an API into AI tools.
            <br />
            <span className="soft">Test them. Get a live&nbsp;URL.</span>
          </h1>
          <p className="lede">
            Paste on the left. Your tools appear on the right. Test them in the sandbox chat, then create a URL your agent
            can&nbsp;use.
          </p>
          <div className="hero2-demo" id="converter">
            <Converter initial={initial} />
          </div>
          <div style={{ marginTop: 24 }}>
            <MyGateways />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
