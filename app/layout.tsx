import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
export const metadata: Metadata = {
  metadataBase: new URL("https://mcp.edenbuilds.me"),
  title: {
    default: "Accord | Give agents access. Keep control.",
    template: "%s | Accord",
  },
  description:
    "The MCP gateway taking shape around explicit policies, bounded execution, and a record of every decision. Explore the workbench and run the developer preview.",
  openGraph: {
    title: "Give agents access. Keep control.",
    description: "Accord. An MCP gateway and control plane by Eden Builds.",
    images: ["/og.svg"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        <a className="skip" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
