import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteConfig.url;
  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/apply`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];
}
