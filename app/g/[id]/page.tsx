import type { Metadata } from "next";
import { Header, Footer } from "@/components/ui";
import GatewayDashboard from "@/components/gateway-dashboard";

export const metadata: Metadata = {
  title: "Your sandbox gateway",
  robots: { index: false, follow: false },
};

export default async function GatewayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <Header />
      <main id="main" className="page-hero">
        <div className="shell">
          <GatewayDashboard id={id} />
        </div>
      </main>
      <Footer />
    </>
  );
}
