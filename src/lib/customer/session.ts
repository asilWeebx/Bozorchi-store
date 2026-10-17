import "server-only";

import { cookies } from "next/headers";

/** Mirrors the signed-in customer for the server, which reads it for personal prices. */
export const CUSTOMER_COOKIE = "kb_customer_code";

export async function getCustomerCode() {
  return (await cookies()).get(CUSTOMER_COOKIE)?.value?.trim() || undefined;
}
