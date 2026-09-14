import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";
import { useCases } from "@/lib/use-cases";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ["", 1],
    ["/app", 0.9],
    ["/compare", 0.8],
    ["/docs", 0.8],
    ...useCases.map((u) => [`/use-cases/${u.slug}`, 0.7] as const),
    ["/workbench", 0.5],
    ["/roadmap", 0.5],
    ["/waitlist", 0.6],
    ["/terms", 0.2],
    ["/privacy", 0.2],
  ] as const;
  return paths.map(([path, priority]) => ({
    url: `${SITE}${path}`,
    lastModified: new Date("2026-09-14"),
    priority,
  }));
}
