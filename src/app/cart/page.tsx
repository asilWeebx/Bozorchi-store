import type { Metadata } from "next";

import { Container } from "@/components/ui/Container";
import { CartView } from "@/features/cart/CartView";

export const metadata: Metadata = { title: "Savat" };

export default function CartPage() {
  return (
    <Container>
      <CartView />
    </Container>
  );
}
