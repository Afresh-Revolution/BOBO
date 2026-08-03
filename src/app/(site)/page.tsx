import { Hero } from "@/components/landing/Hero";
import { About } from "@/components/landing/About";
import { Timeline } from "@/components/landing/Timeline";
import { HowToApply } from "@/components/landing/HowToApply";
import { Eligibility } from "@/components/landing/Eligibility";
import { Judging } from "@/components/landing/Judging";
import { FAQ } from "@/components/landing/FAQ";
import { Sponsors } from "@/components/landing/Sponsors";
import { GalleryTeaser } from "@/components/landing/GalleryTeaser";
import { getPublishedCms } from "@/lib/cms";
import { resolveLandingCopy } from "@/lib/cms-landing";
import { getPublishedWinners } from "@/lib/winners";
import { getPublishedNetworkPartners } from "@/lib/partners";
import { getGalleryTeaserImages } from "@/lib/gallery";
import { getPortalSettings } from "@/lib/portal";
import { siteConfig } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [cms, winners, partners, portal, galleryPreviews] = await Promise.all([
    getPublishedCms(),
    getPublishedWinners(),
    getPublishedNetworkPartners(),
    getPortalSettings(),
    getGalleryTeaserImages(4),
  ]);

  const landing = resolveLandingCopy(cms);

  const timelineItems = landing.timeline.items.map((item) => {
    if (item.id === "opens") {
      return {
        ...item,
        date: portal.openDateLabel || item.date,
        detail:
          item.detail ||
          `Applications go live on ${portal.openDateLabel}. Eligibility checklist first.`,
      };
    }
    if (item.id === "closes") {
      return {
        ...item,
        date: portal.closeDateLabel || item.date,
        detail:
          item.detail ||
          `Final day to submit your entry video and details (${portal.closeDateLabel}).`,
      };
    }
    return item;
  });

  const timelineDescription =
    cms.timeline?.body ||
    `Portal opens ${portal.openDateLabel}. Closes ${portal.closeDateLabel}. The show begins ${siteConfig.show.showBegins}.`;

  const faqItems = landing.faq.items.map((item) => {
    if (
      item.q === "What happens after I apply?" &&
      !Array.isArray(cms.faq?.meta?.items)
    ) {
      return {
        ...item,
        a: `You'll receive a confirmation. If approved, a secure single-use email link arrives (valid for 48 hours) to complete registration. The application portal runs ${portal.openDateLabel} to ${portal.closeDateLabel}.`,
      };
    }
    return item;
  });

  const heroCtaLabel = portal.isAccepting
    ? landing.hero.ctaLabel
    : portal.ctaLabel;

  const applyCtaLabel = portal.isAccepting
    ? landing.howToApply.ctaLabel
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
        brand={landing.hero.brand}
        fullName={landing.hero.fullName}
        tagline={landing.hero.tagline}
        support={landing.hero.support}
        ctaLabel={heroCtaLabel}
        ctaHref={portal.ctaHref}
        secondaryCtaLabel={landing.hero.secondaryCtaLabel}
        secondaryCtaHref={landing.hero.secondaryCtaHref}
      />
      <About
        eyebrow={landing.about.eyebrow}
        title={landing.about.title}
        description={landing.about.description}
        pillars={landing.about.pillars}
        statement={landing.about.statement}
      />
      <Timeline
        eyebrow={landing.timeline.eyebrow}
        title={landing.timeline.title}
        description={timelineDescription}
        items={timelineItems}
      />
      <HowToApply
        eyebrow={landing.howToApply.eyebrow}
        title={landing.howToApply.title}
        description={landing.howToApply.description}
        steps={landing.howToApply.steps}
        applyLabel={applyCtaLabel}
        applyHref={portal.ctaHref}
      />
      <Eligibility
        eyebrow={landing.eligibility.eyebrow}
        title={landing.eligibility.title}
        description={landing.eligibility.description}
        items={landing.eligibility.items}
        note={landing.eligibility.note}
        primaryCtaLabel={landing.eligibility.primaryCtaLabel}
        primaryCtaHref={landing.eligibility.primaryCtaHref}
        secondaryCtaLabel={landing.eligibility.secondaryCtaLabel}
        secondaryCtaHref={landing.eligibility.secondaryCtaHref}
      />
      <Judging
        eyebrow={landing.judging.eyebrow}
        title={landing.judging.title}
        description={landing.judging.description}
        cards={landing.judging.cards}
      />
      <FAQ
        eyebrow={landing.faq.eyebrow}
        title={landing.faq.title}
        description={landing.faq.description}
        items={faqItems}
      />
      <GalleryTeaser
        eyebrow={landing.gallery.eyebrow}
        title={landing.gallery.title}
        description={landing.gallery.description}
        ctaLabel={landing.gallery.ctaLabel}
        ctaHref={landing.gallery.ctaHref}
        previewUrls={galleryPreviews}
      />
      <Sponsors
        eyebrow={landing.sponsors.eyebrow}
        title={landing.sponsors.title}
        description={landing.sponsors.description}
        partners={partners}
      />
    </>
  );
}
