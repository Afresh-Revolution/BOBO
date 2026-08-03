/** Default landing CMS payloads for seed / SQL / admin empty states. */

export const LANDING_SECTION_KEYS = [
  "hero",
  "about",
  "timeline",
  "how_to_apply",
  "eligibility",
  "judging",
  "faq",
  "sponsors",
  "gallery",
] as const;

export type LandingSectionKey = (typeof LANDING_SECTION_KEYS)[number];

export const LANDING_SECTION_LABELS: Record<LandingSectionKey, string> = {
  hero: "Hero",
  about: "About",
  timeline: "Timeline",
  how_to_apply: "How To Apply",
  eligibility: "Eligibility",
  judging: "Judging",
  faq: "FAQ",
  sponsors: "Sponsors / Network",
  gallery: "Gallery",
};

export const LANDING_SECTION_HINTS: Record<LandingSectionKey, string> = {
  hero: "Brand, full name, tagline, support line, and CTAs.",
  about: "Eyebrow, heading, body, pillars, and closing statement.",
  timeline: "Season header and milestone dates (opens / closes / show begins).",
  how_to_apply: "Apply steps and primary CTA label.",
  eligibility: "Requirements list, note, and external CTAs.",
  judging: "Judging criteria cards.",
  faq: "Questions and answers accordion.",
  sponsors: "Partners section header (partner cards are below).",
  gallery: "Landing gallery teaser copy and button to /gallery. Albums/images are managed under Admin → Gallery.",
};

export const defaultLandingSections = [
  {
    sectionKey: "hero",
    title: "BOBO",
    subtitle: "Battle Of Baddies On",
    body: "Redefining what a Baddie truly means.",
    ctaLabel: "Start Application",
    ctaHref: "/apply",
    sortOrder: 0,
    meta: {
      support:
        "A Nigerian reality show for the intelligent, elegant, and purpose-driven, not merely the attractive.",
      secondaryCtaLabel: "Discover BOBO",
      secondaryCtaHref: "#about",
    },
  },
  {
    sectionKey: "about",
    title: "The Standard",
    subtitle: "A Baddie is built on substance.",
    body: "BOBO is redefining what a Baddie truly means: intelligence, elegance, purpose, class, style, and confidence. Attractiveness alone never enters the room first.",
    sortOrder: 1,
    meta: {
      pillars: [
        "Intelligent",
        "Elegant",
        "Purpose Driven",
        "Classy",
        "Stylish",
        "Confident",
      ],
      statement:
        "20 baddies, 1 week, 1 crown, 1 winner. A stage for Nigerian excellence, filmed like fashion, judged like character.",
    },
  },
  {
    sectionKey: "timeline",
    title: "The Season",
    subtitle: "Mark the dates.",
    body: "Portal opens August 3. Closes October 31. The show begins December 26.",
    sortOrder: 2,
    meta: {
      items: [
        {
          id: "opens",
          label: "Portal Opens",
          date: "August 3",
          detail:
            "Applications go live on August 3. Eligibility checklist first.",
        },
        {
          id: "closes",
          label: "Portal Closes",
          date: "October 31",
          detail:
            "Final day to submit your entry video and details (October 31).",
        },
        {
          id: "begins",
          label: "Show Begins",
          date: "December 26",
          detail: "20 baddies, 1 week, 1 crown, 1 winner.",
        },
      ],
    },
  },
  {
    sectionKey: "how_to_apply",
    title: "How To Apply",
    subtitle: "Four steps to the stage.",
    body: "From eligibility to a secure registration link. The path is clear, intentional, and fair.",
    ctaLabel: "Begin Your Application",
    ctaHref: "/apply",
    sortOrder: 3,
    meta: {
      steps: [
        {
          step: "01",
          title: "Confirm eligibility",
          body: "CBrilliance account, 2,000+ followers, Nigerian, ages 18-38.",
        },
        {
          step: "02",
          title: "Submit your entry",
          body: "Profile details, birth certificate, and a 2-minute entry video.",
        },
        {
          step: "03",
          title: "Await review",
          body: "Our team reviews every application with care and intention.",
        },
        {
          step: "04",
          title: "Secure your place",
          body: "Approved applicants receive a private 48-hour registration link.",
        },
      ],
    },
  },
  {
    sectionKey: "eligibility",
    title: "Eligibility",
    subtitle: "You must satisfy every requirement.",
    body: "Before the form opens, confirm you meet all four criteria. Incomplete profiles will not proceed.",
    sortOrder: 4,
    meta: {
      items: [
        "Have a CBrilliance Account",
        "Have 2,000+ followers on at least one social platform (except Facebook)",
        "Nigerian by nationality",
        "Age between 18 and 38",
      ],
      note: "Need a CBrilliance account? Create one first. It is required for applications and for voting on Popin.",
      primaryCtaLabel: "Get CBrilliance",
      primaryCtaHref: "https://cbrilliance.io",
      secondaryCtaLabel: "Visit Popin",
      secondaryCtaHref: "https://popin.club",
    },
  },
  {
    sectionKey: "judging",
    title: "Judging Process",
    subtitle: "Presence. Substance. Character. Style.",
    body: "Every applicant is reviewed with the same lens: no shortcuts, no noise.",
    sortOrder: 5,
    meta: {
      cards: [
        {
          title: "Presence",
          body: "How you carry yourself on camera: composure, polish, and poise.",
        },
        {
          title: "Substance",
          body: "Clarity of thought. Purpose. The depth behind the presentation.",
        },
        {
          title: "Character",
          body: "Grace under pressure, integrity, and how you treat the room.",
        },
        {
          title: "Style",
          body: "Personal aesthetic that feels intentional, never try-hard.",
        },
      ],
    },
  },
  {
    sectionKey: "faq",
    title: "FAQ",
    subtitle: "Answers, without the fluff.",
    body: "Everything applicants ask before hitting submit.",
    sortOrder: 6,
    meta: {
      items: [
        {
          q: "Who can apply?",
          a: "Nigerian nationals aged 18-38 with a CBrilliance account and at least 2,000 followers on one social platform (excluding Facebook).",
        },
        {
          q: "What should my entry video include?",
          a: "Introduce yourself (name and state), show a full-body recording, and answer one of the four prompt questions. Max 2 minutes, 100MB, MP4/MOV/AVI only.",
        },
        {
          q: "Is there a registration fee?",
          a: "Only approved applicants can register. The fee is 5 CBC (approx. ₦150,000). Payment is an investment into the CBC exchange ecosystem via cbcnets.com.",
        },
        {
          q: "Where does voting happen?",
          a: "Voting is not on this site. It takes place on popin.club. You need a CBrilliance account to vote.",
        },
        {
          q: "How many contestants make the show?",
          a: "20 baddies, 1 week, 1 crown, 1 winner.",
        },
        {
          q: "What happens after I apply?",
          a: "You'll receive a confirmation. If approved, a secure single-use email link arrives (valid for 48 hours) to complete registration.",
        },
      ],
    },
  },
  {
    sectionKey: "sponsors",
    title: "The Network",
    subtitle: "Powered by the ecosystem.",
    body: "CBrilliance, Popin, and CBC Nets — identity, voting, and registration in one network.",
    sortOrder: 7,
    meta: {},
  },
  {
    sectionKey: "gallery",
    title: "Gallery",
    subtitle: "Moments from the stage.",
    body: "Browse albums from seasons, casting, and behind the scenes.",
    ctaLabel: "Open gallery",
    ctaHref: "/gallery",
    sortOrder: 8,
    meta: {
      pageTitle: "The gallery",
      pageDescription:
        "Albums from the BOBO world — seasons, casting, and moments off-camera.",
    },
  },
] as const;
