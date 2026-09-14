import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check, ShieldCheck } from "lucide-react";
import { Header, Footer } from "@/components/ui";
import { BrandIcon, brandTitle } from "@/components/brand-icon";
import LiveDemo from "@/components/live-demo";
import { useCases } from "@/lib/use-cases";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return useCases.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const u = useCases.find((x) => x.slug === slug);
  if (!u) return {};
  return {
    title: `${u.label}: ${u.headline}`,
    description: u.summary,
    alternates: { canonical: `/use-cases/${u.slug}` },
  };
}

export default async function UseCasePage({ params }: Props) {
  const { slug } = await params;
  const u = useCases.find((x) => x.slug === slug);
  if (!u) notFound();
  return (
    <>
      <Header />
      <main id="main">
        <section className="page-hero">
          <div className="shell">
            <p className="kicker">
              {u.label} with {u.brands.map((b) => brandTitle(b)).join(" and ")}
            </p>
            <h1 className="title">{u.headline}</h1>
            <p className="lede">{u.summary}</p>
            <div className="hero2-clients">
              {u.brands.map((b) => (
                <span className="client" key={b}>
                  <BrandIcon name={b} size={22} /> {brandTitle(b)}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="shell faq2">
            <div>
              <p className="kicker">What the agent does</p>
              <ol className="plan" style={{ listStyle: "none" }}>
                {u.steps.map((s) => (
                  <li key={s}>
                    <Check size={15} /> {s}
                  </li>
                ))}
              </ol>
              <div className="uc-guard" style={{ marginTop: 16 }}>
                <ShieldCheck size={16} />
                <span>
                  <strong>{u.guardTitle}.</strong> {u.guard}
                </span>
              </div>
            </div>
            <div>
              <p className="kicker">The API calls behind it</p>
              <pre className="code-line" style={{ whiteSpace: "pre-wrap" }}>
                {u.input}
              </pre>
              <p className="fine">
                These are the vendors’ documented API paths. Every id, key and email above is a placeholder.
              </p>
              <Link className="btn" href={`/app?template=${u.slug}`}>
                Open this in the converter <ArrowUpRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section className="section dark" id="live">
          <div className="shell live">
            <div>
              <p className="kicker">Try it live</p>
              <h2 className="title">
                Connect your agent
                <br />
                <span className="soft">to this exact setup.</span>
              </h2>
              <p className="lede">
                Create a sandbox URL, add it to your agent, and ask: “{u.ask}” Every call shows up with the decision
                Accord&nbsp;made.
              </p>
            </div>
            <LiveDemo initial={u.slug} />
          </div>
        </section>

        <section className="section">
          <div className="shell">
            <p className="kicker">More use cases</p>
            <div className="uc-grid">
              {useCases
                .filter((x) => x.slug !== u.slug)
                .map((x) => (
                  <Link key={x.slug} href={`/use-cases/${x.slug}`} className="uc">
                    <div className="uc-brands">
                      {x.brands.map((b) => (
                        <BrandIcon key={b} name={b} size={22} />
                      ))}
                      <span className="uc-label">{x.label}</span>
                    </div>
                    <h3>{x.headline}</h3>
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
