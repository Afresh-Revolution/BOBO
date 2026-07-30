export const siteConfig = {
  name: "BOBO",
  fullName: "Battle Of Baddies On",
  tagline: "Redefining what a Baddie truly means.",
  description:
    "BOBO is a Nigerian reality TV show celebrating intelligence, elegance, purpose, and class, not merely attractiveness.",
  url: "https://bobo.show",
  links: {
    apply: "/apply",
    cbrilliance: "https://cbrilliance.io",
    popin: "https://popin.club",
    cbc: "https://cbcnets.com",
    tiktok: "https://www.tiktok.com/@popin_club",
    instagram: "https://www.instagram.com/popin_club",
  },
  show: {
    contestants: 15,
    winners: 1,
    duration: "1 Week",
    portalOpens: "August 1",
    portalCloses: "October 31",
    showBegins: "December 26",
    registrationFee: "5 CBC",
    registrationApprox: "₦150,000",
  },
  pillars: [
    "Intelligent",
    "Elegant",
    "Purpose Driven",
    "Classy",
    "Stylish",
    "Confident",
  ],
} as const;

export const timeline = [
  {
    id: "opens",
    label: "Portal Opens",
    date: "August 1",
    detail: "Applications go live. Eligibility checklist first.",
  },
  {
    id: "closes",
    label: "Portal Closes",
    date: "October 31",
    detail: "Final day to submit your entry video and details.",
  },
  {
    id: "begins",
    label: "Show Begins",
    date: "December 26",
    detail: "15 contestants. One week. One BOBO winner.",
  },
] as const;

export const applySteps = [
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
] as const;

export const eligibility = [
  "Have a CBrilliance Account",
  "Have 2,000+ followers on at least one social platform (except Facebook)",
  "Nigerian by nationality",
  "Age between 18 and 38",
] as const;

export const judging = [
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
] as const;

export const faqs = [
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
    a: "15 contestants. One week. One winner.",
  },
  {
    q: "What happens after I apply?",
    a: "You'll receive a confirmation. If approved, a secure single-use email link arrives (valid for 48 hours) to complete registration.",
  },
] as const;

export const sponsors = [
  { name: "CBrilliance", href: "https://cbrilliance.io" },
  { name: "Popin", href: "https://popin.club" },
  { name: "CBC Nets", href: "https://cbcnets.com" },
] as const;
