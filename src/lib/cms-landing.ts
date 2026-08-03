import {
  applySteps as defaultApplySteps,
  eligibility as defaultEligibility,
  faqs as defaultFaqs,
  judging as defaultJudging,
  siteConfig,
  timeline as defaultTimeline,
} from "@/lib/content";
import type { CmsSection } from "@/lib/cms";

export type TimelineItem = {
  id: string;
  label: string;
  date: string;
  detail: string;
};

export type ApplyStep = {
  step: string;
  title: string;
  body: string;
};

export type JudgingCard = {
  title: string;
  body: string;
};

export type FaqItem = {
  q: string;
  a: string;
};

export type LandingCopy = {
  hero: {
    brand: string;
    fullName: string;
    tagline: string;
    support: string;
    ctaLabel: string;
    ctaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  about: {
    eyebrow: string;
    title: string;
    description: string;
    pillars: string[];
    statement: string;
  };
  timeline: {
    eyebrow: string;
    title: string;
    description: string;
    items: TimelineItem[];
  };
  howToApply: {
    eyebrow: string;
    title: string;
    description: string;
    steps: ApplyStep[];
    ctaLabel: string;
  };
  eligibility: {
    eyebrow: string;
    title: string;
    description: string;
    items: string[];
    note: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
  };
  judging: {
    eyebrow: string;
    title: string;
    description: string;
    cards: JudgingCard[];
  };
  faq: {
    eyebrow: string;
    title: string;
    description: string;
    items: FaqItem[];
  };
  sponsors: {
    eyebrow: string;
    title: string;
    description: string;
  };
  gallery: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
    pageTitle: string;
    pageDescription: string;
  };
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter(Boolean);
  return items.length ? items : fallback;
}

function asTimelineItems(value: unknown): TimelineItem[] {
  if (!Array.isArray(value)) return [...defaultTimeline];
  const items = value
    .map((raw, i) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const id = asString(row.id, `item-${i + 1}`);
      const label = asString(row.label);
      const date = asString(row.date);
      const detail = asString(row.detail);
      if (!label && !date && !detail) return null;
      return { id, label, date, detail };
    })
    .filter(Boolean) as TimelineItem[];
  return items.length ? items : [...defaultTimeline];
}

function asApplySteps(value: unknown): ApplyStep[] {
  if (!Array.isArray(value)) return [...defaultApplySteps];
  const items = value
    .map((raw, i) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const title = asString(row.title);
      const body = asString(row.body);
      if (!title && !body) return null;
      return {
        step: asString(row.step, String(i + 1).padStart(2, "0")),
        title,
        body,
      };
    })
    .filter(Boolean) as ApplyStep[];
  return items.length ? items : [...defaultApplySteps];
}

function asJudgingCards(value: unknown): JudgingCard[] {
  if (!Array.isArray(value)) return [...defaultJudging];
  const items = value
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const title = asString(row.title);
      const body = asString(row.body);
      if (!title && !body) return null;
      return { title, body };
    })
    .filter(Boolean) as JudgingCard[];
  return items.length ? items : [...defaultJudging];
}

function asFaqItems(value: unknown): FaqItem[] {
  if (!Array.isArray(value)) return [...defaultFaqs];
  const items = value
    .map((raw) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      const q = asString(row.q);
      const a = asString(row.a);
      if (!q && !a) return null;
      return { q, a };
    })
    .filter(Boolean) as FaqItem[];
  return items.length ? items : [...defaultFaqs];
}

function section(
  cms: Record<string, CmsSection>,
  key: string,
): CmsSection | undefined {
  return cms[key];
}

/** Resolve fully editable landing copy from CMS with content.ts fallbacks. */
export function resolveLandingCopy(
  cms: Record<string, CmsSection>,
): LandingCopy {
  const hero = section(cms, "hero");
  const about = section(cms, "about");
  const timeline = section(cms, "timeline");
  const howToApply = section(cms, "how_to_apply");
  const eligibility = section(cms, "eligibility");
  const judging = section(cms, "judging");
  const faq = section(cms, "faq");
  const sponsors = section(cms, "sponsors");
  const gallery = section(cms, "gallery");

  const heroMeta = hero?.meta ?? {};
  const aboutMeta = about?.meta ?? {};
  const timelineMeta = timeline?.meta ?? {};
  const howMeta = howToApply?.meta ?? {};
  const eligibilityMeta = eligibility?.meta ?? {};
  const judgingMeta = judging?.meta ?? {};
  const faqMeta = faq?.meta ?? {};
  const galleryMeta = gallery?.meta ?? {};

  return {
    hero: {
      brand: hero?.title || siteConfig.name,
      fullName: hero?.subtitle || siteConfig.fullName,
      tagline: hero?.body || siteConfig.tagline,
      support: asString(
        heroMeta.support,
        "A Nigerian reality show for the intelligent, elegant, and purpose-driven, not merely the attractive.",
      ),
      ctaLabel: hero?.ctaLabel || "Start Application",
      ctaHref: hero?.ctaHref || siteConfig.links.apply,
      secondaryCtaLabel: asString(heroMeta.secondaryCtaLabel, "Discover BOBO"),
      secondaryCtaHref: asString(heroMeta.secondaryCtaHref, "#about"),
    },
    about: {
      eyebrow: about?.title || "The Standard",
      title: about?.subtitle || "A Baddie is built on substance.",
      description:
        about?.body ||
        "BOBO is redefining what a Baddie truly means: intelligence, elegance, purpose, class, style, and confidence. Attractiveness alone never enters the room first.",
      pillars: asStringArray(aboutMeta.pillars, [...siteConfig.pillars]),
      statement: asString(aboutMeta.statement, siteConfig.statement),
    },
    timeline: {
      eyebrow: timeline?.title || "The Season",
      title: timeline?.subtitle || "Mark the dates.",
      description:
        timeline?.body ||
        `Portal opens ${siteConfig.show.portalOpens}. Closes ${siteConfig.show.portalCloses}. The show begins ${siteConfig.show.showBegins}.`,
      items: asTimelineItems(timelineMeta.items),
    },
    howToApply: {
      eyebrow: howToApply?.title || "How To Apply",
      title: howToApply?.subtitle || "Four steps to the stage.",
      description:
        howToApply?.body ||
        "From eligibility to a secure registration link. The path is clear, intentional, and fair.",
      steps: asApplySteps(howMeta.steps),
      ctaLabel: howToApply?.ctaLabel || "Begin Your Application",
    },
    eligibility: {
      eyebrow: eligibility?.title || "Eligibility",
      title: eligibility?.subtitle || "You must satisfy every requirement.",
      description:
        eligibility?.body ||
        "Before the form opens, confirm you meet all four criteria. Incomplete profiles will not proceed.",
      items: asStringArray(eligibilityMeta.items, [...defaultEligibility]),
      note: asString(
        eligibilityMeta.note,
        "Need a CBrilliance account? Create one first. It is required for applications and for voting on Popin.",
      ),
      primaryCtaLabel: asString(eligibilityMeta.primaryCtaLabel, "Get CBrilliance"),
      primaryCtaHref: asString(
        eligibilityMeta.primaryCtaHref,
        siteConfig.links.cbrilliance,
      ),
      secondaryCtaLabel: asString(eligibilityMeta.secondaryCtaLabel, "Visit Popin"),
      secondaryCtaHref: asString(
        eligibilityMeta.secondaryCtaHref,
        siteConfig.links.popin,
      ),
    },
    judging: {
      eyebrow: judging?.title || "Judging Process",
      title: judging?.subtitle || "Presence. Substance. Character. Style.",
      description:
        judging?.body ||
        "Every applicant is reviewed with the same lens: no shortcuts, no noise.",
      cards: asJudgingCards(judgingMeta.cards),
    },
    faq: {
      eyebrow: faq?.title || "FAQ",
      title: faq?.subtitle || "Answers, without the fluff.",
      description:
        faq?.body || "Everything applicants ask before hitting submit.",
      items: asFaqItems(faqMeta.items),
    },
    sponsors: {
      eyebrow: sponsors?.title || "The Network",
      title: sponsors?.subtitle || "Powered by the ecosystem.",
      description:
        sponsors?.body ||
        "CBrilliance, Popin, and CBC Nets — identity, voting, and registration in one network.",
    },
    gallery: {
      eyebrow: gallery?.title || "Gallery",
      title: gallery?.subtitle || "Moments from the stage.",
      description:
        gallery?.body ||
        "Browse albums from seasons, casting, and behind the scenes.",
      ctaLabel: gallery?.ctaLabel || "Open gallery",
      ctaHref: gallery?.ctaHref || "/gallery",
      pageTitle: asString(galleryMeta.pageTitle, "The gallery"),
      pageDescription: asString(
        galleryMeta.pageDescription,
        "Albums from the BOBO world — seasons, casting, and moments off-camera.",
      ),
    },
  };
}
