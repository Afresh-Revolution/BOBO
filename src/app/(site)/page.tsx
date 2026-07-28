import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { Timeline } from "@/components/landing/Timeline";
import { HowToApply } from "@/components/landing/HowToApply";
import { Eligibility } from "@/components/landing/Eligibility";
import { Judging } from "@/components/landing/Judging";
import { FAQ } from "@/components/landing/FAQ";
import { Sponsors } from "@/components/landing/Sponsors";
import { getPublishedCms } from "@/lib/cms";
import { getPublishedWinners } from "@/lib/winners";
import { getPublishedNetworkPartners } from "@/lib/partners";
import { siteConfig } from "@/lib/content";

export const revalidate = 60;

export default async function HomePage() {
  const [cms, winners, partners] = await Promise.all([
    getPublishedCms(),
    getPublishedWinners(),
    getPublishedNetworkPartners(),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    name: siteConfig.fullName,
    alternateName: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    areaServed: "NG",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero
        winners={winners}
        brand={cms.hero?.title || siteConfig.name}
        fullName={cms.hero?.subtitle || siteConfig.fullName}
        tagline={cms.hero?.body || siteConfig.tagline}
        ctaLabel={cms.hero?.ctaLabel || "Start Application"}
        ctaHref={cms.hero?.ctaHref || "/apply"}
      />
      <About
        eyebrow={cms.about?.title}
        title={cms.about?.subtitle}
        description={cms.about?.body}
      />
      <Timeline
        eyebrow={cms.timeline?.title}
        title={cms.timeline?.subtitle}
        description={cms.timeline?.body}
      />
      <HowToApply />
      <Eligibility />
      <Judging />
      <FAQ />
      <Sponsors
        eyebrow={cms.sponsors?.title}
        title={cms.sponsors?.subtitle}
        description={cms.sponsors?.body}
        partners={partners}
      />
    </>
  );
}
