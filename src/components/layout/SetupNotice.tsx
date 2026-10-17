"use client";

import { CircleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import type { FailureReason } from "@/lib/storefront/store";

/** Shown instead of the catalog when the API refused the key or was unreachable. */
export function SetupNotice({ reason }: { reason?: FailureReason; error?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const auth = reason === "auth";
  return (
    <EmptyState
      icon={<CircleAlert size={32} aria-hidden />}
      title={auth ? "Do‘kon hali sozlanmagan" : "Katalog vaqtincha ochilmadi"}
      text={auth ? "Do‘kon katalogi hozircha tayyor emas. Birozdan so‘ng qayta urinib ko‘ring." : "Internet aloqasini tekshirib, sahifani yangilang."}
      action={
        <Button variant="secondary" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
          {pending ? "Yuklanmoqda..." : "Qayta urinish"}
        </Button>
      }
    />
  );
}
