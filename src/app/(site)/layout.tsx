import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { getPortalSettings } from "@/lib/portal";

/** Always read fresh portal/CMS-backed chrome (apply CTA labels, etc.). */
export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const portal = await getPortalSettings();

  return (
    <SmoothScroll>
      <div className="grain" aria-hidden />
      <Header applyLabel={portal.ctaLabel} applyHref={portal.ctaHref} />
      <main className="page">{children}</main>
      <Footer applyLabel={portal.ctaLabel} applyHref={portal.ctaHref} />
      <ScrollToTop />
    </SmoothScroll>
  );
}
