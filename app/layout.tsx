import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./site.css";
import SiteLoader from "@/components/site-loader";
import { SITE, SUMMARY } from "@/lib/content";

const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
const DESCRIPTION =
  "Paste a cURL command or OpenAPI spec and get an MCP tool your AI agent can call. Accord checks every call: role-based tool lists, loop breakers, approvals, caching, payload trimming and redaction. Free sandbox, no signup.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Accord: connect your AI to any API, safely", template: "%s | Accord" },
  description: DESCRIPTION,
  applicationName: "Accord",
  authors: [{ name: "Eden Builds", url: "https://edenbuilds.me" }],
  creator: "Eden Builds",
  publisher: "Eden Builds",
  keywords: [
    "MCP gateway",
    "cURL to MCP",
    "OpenAPI to MCP",
    "Model Context Protocol",
    "MCP server generator",
    "AI agent guardrails",
    "AI agent security",
    "MCP control plane",
  ],
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Accord",
    title: "Accord: connect your AI to any API, safely",
    description: DESCRIPTION,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: "Accord: connect your AI to any API, safely", description: DESCRIPTION },
  robots: { index: true, follow: true },
  category: "technology",
};

export const viewport: Viewport = { themeColor: "#111a14" };

const orgLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://edenbuilds.me/#org",
      name: "Eden Builds",
      url: "https://edenbuilds.me",
    },
    {
      "@type": "SoftwareApplication",
      name: "Accord",
      url: SITE,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      description: SUMMARY,
      publisher: { "@id": "https://edenbuilds.me/#org" },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Free sandbox, 1,000 calls" },
    },
    { "@type": "WebSite", name: "Accord", url: SITE, publisher: { "@id": "https://edenbuilds.me/#org" } },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(sessionStorage.getItem("accord.seen"))document.documentElement.dataset.seen="1"}catch(e){}`,
          }}
        />
      </head>
      <body className={`${sans.variable} ${mono.variable}`}>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SiteLoader />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
