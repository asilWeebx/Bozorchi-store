import "server-only";

/** The public address, for absolute links in previews, sitemap.xml and robots.txt. */
export const SITE_URL = (process.env.SITE_URL || "https://kafelbaraka.uz").replace(/\/$/, "");
