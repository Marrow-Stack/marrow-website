import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/auth/", "/admin/", "/checkout/"],
      },
    ],
    sitemap: "https://marrowstack.dev/sitemap.xml",
  }
}
