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
import { getPortalSettings } from "@/lib/portal";
import { siteConfig, timeline as defaultTimeline, faqs as defaultFaqs } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cms, winners, partners, portal] = await Promise.all([
    getPublishedCms(),
    getPublishedWinners(),
    getPublishedNetworkPartners(),
    getPortalSettings(),
  ]);

  const timelineItems = defaultTimeline.map((item) => {
    if (item.id === "opens") {
      return {
        ...item,
        date: portal.openDateLabel,
        detail: `Applications go live on ${portal.openDateLabel}. Eligibility checklist first.`,
      };
    }
    if (item.id === "closes") {
      return {
        ...item,
        date: portal.closeDateLabel,
        detail: `Final day to submit your entry video and details (${portal.closeDateLabel}).`,
      };
    }
    return { ...item };
  });

  const timelineDescription = `Portal opens ${portal.openDateLabel}. Closes ${portal.closeDateLabel}. The show begins ${siteConfig.show.showBegins}.`;

  const faqItems = defaultFaqs.map((item) => {
    if (item.q === "What happens after I apply?") {
      return {
        ...item,
        a: `You'll receive a confirmation. If approved, a secure single-use email link arrives (valid for 48 hours) to complete registration. The application portal runs ${portal.openDateLabel} to ${portal.closeDateLabel}.`,
      };
    }
    return { ...item };
  });

  const heroCtaLabel = portal.isAccepting
    ? cms.hero?.ctaLabel || "Start Application"
    : portal.ctaLabel;

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
        ctaLabel={heroCtaLabel}
        ctaHref={portal.ctaHref}
      />
      <About
        eyebrow={cms.about?.title}
        title={cms.about?.subtitle}
        description={cms.about?.body}
      />
      <Timeline
        eyebrow={cms.timeline?.title}
        title={cms.timeline?.subtitle}
        description={cms.timeline?.body || timelineDescription}
        items={timelineItems}
      />
      <HowToApply
        applyLabel={
          portal.isAccepting ? "Begin Your Application" : portal.ctaLabel
        }
        applyHref={portal.ctaHref}
      />
      <Eligibility />
      <Judging />
      <FAQ items={faqItems} />
      <Sponsors
        eyebrow={cms.sponsors?.title}
        title={cms.sponsors?.subtitle}
        description={cms.sponsors?.body}
        partners={partners}
      />
    </>
  );
}
