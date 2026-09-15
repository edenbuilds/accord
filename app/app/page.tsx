import type { Metadata } from "next";
import { Header, Footer } from "@/components/ui";
import AppWorkspace from "@/components/app-workspace";
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
      <main id="main" className="app-surface"><AppWorkspace initial={initial}/></main>
      <Footer />
    </>
  );
}
