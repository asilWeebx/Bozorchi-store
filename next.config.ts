import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * The previous site was static files: its privacy page is linked from the
   * mobile app's store listing, and old links may name index.html.
   */
  async redirects() {
    return [
      { source: "/privacy.html", destination: "/privacy", permanent: true },
      { source: "/index.html", destination: "/", permanent: true },
    ];
  },
  images: {
    /*
     * Images are served as-is: Cloudflare Workers has no Next.js image
     * optimizer. The local images are pre-shrunk WebP files instead, and the
     * ERP's product photos are already WebP on its CDN, over https.
     */
    unoptimized: true,
    /*
     * Product images are whatever URL the shop owner pasted into the ERP —
     * the CDN, their own site, or a search-result thumbnail — so the set of
     * hosts is open-ended and cannot be allow-listed up front. An unlisted
     * host makes `next/image` throw during render, which takes the whole page
     * down, so every host is permitted and bad URLs are handled at the
     * component level instead (see SafeImage).
     *
     * If `unoptimized` is ever turned off again, the optimizer will fetch any
     * URL that appears in the catalog. Those URLs come from the authenticated
     * shop owner via the ERP, not from site visitors, so the exposure is
     * limited to whoever can already edit the catalog.
     */
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
