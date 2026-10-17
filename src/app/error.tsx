"use client";

import { RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Container>
      <EmptyState
        icon={<RefreshCw size={32} aria-hidden />}
        title="Nimadir xato ketdi"
        text="Sahifani qayta yuklab ko‘ring."
        action={<Button onClick={reset}>Qayta urinish</Button>}
      />
    </Container>
  );
}
