import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { ScrollToTop } from "@/components/layout/ScrollToTop";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SmoothScroll>
      <div className="grain" aria-hidden />
      <Header />
      <main className="page">{children}</main>
      <Footer />
      <ScrollToTop />
    </SmoothScroll>
  );
}
