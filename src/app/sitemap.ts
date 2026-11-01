import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BRAND.siteUrl}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BRAND.siteUrl}/app/`, changeFrequency: "monthly", priority: 0.8 },
  ];
}
