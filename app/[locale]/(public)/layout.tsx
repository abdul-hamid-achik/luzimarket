import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import CartSheet from "@/components/cart/cart-sheet";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main id="main">
        {children}
      </main>
      <Footer />
      <CartSheet />
    </>
  );
}