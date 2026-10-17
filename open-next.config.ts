import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache: the storefront client keeps ERP responses in memory
// itself (src/lib/storefront/swr-cache.ts). If cold isolates ever make that
// too thin, add the R2 cache: https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig();
