import { MetadataRoute } from "next";
import { BLOCKS, BUNDLES } from "@/lib/blocks/registry";

const BASE = "https://marrowstack.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${BASE}/blocks`,                  lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${BASE}/cli`,                     lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/changelog`,               lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/docs`,                    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/docs/getting-started`,    lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/docs/faq`,                lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`,                   lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${BASE}/terms`,                   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];

  const blockRoutes: MetadataRoute.Sitemap = BLOCKS.map((block) => ({
    url:             `${BASE}/blocks/${block.slug}`,
    lastModified:    now,
    changeFrequency: "monthly" as const,
    priority:        block.status === "available" ? 0.8 : 0.6,
  }));

  const bundleRoutes: MetadataRoute.Sitemap = BUNDLES.map((bundle) => ({
    url:             `${BASE}/bundles/${bundle.slug}`,
    lastModified:    now,
    changeFrequency: "monthly" as const,
    priority:        0.7,
  }));

  return [...staticRoutes, ...blockRoutes, ...bundleRoutes];
}
