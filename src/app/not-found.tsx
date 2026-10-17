import { SearchX } from "lucide-react";

import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <Container>
      <EmptyState
        icon={<SearchX size={32} aria-hidden />}
        title="Sahifa topilmadi"
        text="Bu mahsulot sotuvdan olingan yoki havola noto‘g‘ri."
        action={<ButtonLink href="/catalog">Katalogga o‘tish</ButtonLink>}
      />
    </Container>
  );
}
