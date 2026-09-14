import type { Metadata } from "next";
import { Header, Footer } from "@/components/ui";
import WaitlistForm from "@/components/waitlist-form";

export const metadata: Metadata = {
  title: "Join the waitlist",
  description:
    "Get a free Accord account first when they open: keep your gateways, connect your real API and see a full audit log.",
  alternates: { canonical: "/waitlist" },
};

export default async function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; from?: string }>;
}) {
  const { plan, from } = await searchParams;
  return (
    <>
      <Header />
      <main id="main">
        <WaitlistForm plan={plan?.slice(0, 20)} from={from?.slice(0, 20)} />
      </main>
      <Footer />
    </>
  );
}
