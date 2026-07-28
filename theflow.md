BOBO Reality Show Website - Master Implementation Prompt

You are a Senior Full Stack Engineer, Senior UI/UX Designer, Motion Designer, and System Architect.

Your task is to build a production-ready, scalable reality TV show website called BOBO (Battle Of Baddies On).

DO NOT build everything at once.

Instead, work in phases.

Complete one phase, verify everything works, then continue to the next phase.

Never skip a phase.

Maintain clean architecture, reusable components, scalable backend structure, and enterprise-level code.

TECH STACK

Use ONLY these technologies.

Frontend

Next.js (App Router)
TypeScript
SCSS Modules
Framer Motion
GSAP
Lenis Smooth Scroll
React Hook Form
Zod Validation

Backend

Next.js API Routes
PostgreSQL
Prisma ORM
UploadThing (or equivalent)
Nodemailer
JWT
Cron Jobs

Storage

Entry Videos
Birth Certificate Images

Database

PostgreSQL

Architecture

MVC

PROJECT OBJECTIVE

This is the official website for

BOBO

(Battle Of Baddies On)

A Nigerian Reality TV Show.

The show is redefining what a "Baddie" truly means.

A BOBO Baddie is

Intelligent
Elegant
Purpose Driven
Classy
Stylish
Confident

—not merely attractive.

The tone of the website should feel like a premium Netflix reality show mixed with luxury fashion branding.

BRAND COLORS

Choose only TWO primary colors.

Requirements:

Primary:
Deep Royal Purple (#4A148C)

Secondary:
Luxury Gold (#D4AF37)

Background:
Whitesmoke (#F5F5F5)

Text:
Near Black (#111111)

Accent:
White

Do NOT introduce random colors.

Everything must follow this design system.

TYPOGRAPHY

Use visually captivating fonts.

Recommended:

Headings

Clash Display

Body

Satoshi

Buttons

General Sans

Create a typography system.

DESIGN STYLE

Luxury

Modern

Premium

Editorial

Fashion

Reality TV

Cinematic

Use

glassmorphism
animated gradients
blurred cards
floating effects
smooth transitions
page animations
scroll animations
hover animations
reveal animations
micro interactions

Every section should feel alive.

WEBSITE STRUCTURE

Implement pages in this exact order.

Phase 1

Landing Page

Contains

Hero

About BOBO

Timeline

How To Apply

Eligibility

Judging Process

FAQ

Sponsors

Footer

Phase 2

Contestant Submission

Before the form,

show an eligibility checklist.

Applicants must satisfy ALL requirements.

✔ Have a CBrilliance Account

✔ Have 2,000+ followers on at least ONE social media platform except Facebook

✔ Nigerian by nationality

✔ Age between 18 and 38

Users must acknowledge these criteria before proceeding.

Phase 3

Submission Form

Fields

Full Name

Email

Phone Number

Age

Birth Certificate Upload

Mother's Maiden Name

NIN

Blood Group

Genotype

History of Ailments

Current Health Challenge / Allergies

Entry Video Upload

Rules

Video must be uploaded directly.

NOT a URL.

Maximum duration

2 Minutes

Maximum size

100MB

Accepted formats

MP4

MOV

AVI

Validation required.

ENTRY VIDEO INSTRUCTIONS

Above the upload component display

Your entry video MUST include:

Introduce yourself

(Name and State)

Show a full body recording.

Answer ONE of the following questions.

Questions

A

What does success look like to you?

B

How would you handle failure?

C

What is something society accepts that should be questioned?

D

Which is a greater sign of strength:

Changing your mind

OR

Standing by your beliefs?

REALITY SHOW DETAILS

Only ONE winner.

Contestants

15

Reality Show Duration

1 Week

Portal Opens

August 1

Portal Closes

October 31

Reality Show Begins

December 26

Display these dates beautifully on a Timeline component.

APPLICATION FLOW

User submits application.

↓

Admin reviews.

↓

Admin approves or rejects.

↓

Approved applicants receive an email.

↓

Email contains a secure button.

↓

Button links back to BOBO website.

↓

Link expires after 48 hours.

↓

Link is single-use.

↓

Cannot be shared.

↓

After expiry,

access denied.

Implement signed JWT-based magic links stored in the database with expiry and one-time-use tracking.

ACCEPTANCE PAGE

Only accessible through the secure email link.

Features

Acceptance message

Contestant Guidelines

Registration Payment

Countdown

Status

After successful payment

Mark contestant as Registered.

REGISTRATION PAYMENT

Only accepted contestants can pay.

Fee

3 CBC

Display

Approximately ₦82,000

Explain

CBC purchase is also an investment into the CBC exchange ecosystem.

Provide CTA buttons linking users to:

https://cbcnets.com

Do NOT allow payment before approval.

VOTING

Voting is NOT hosted on BOBO.

Voting takes place on

https://popin.club

Users must have

CBrilliance Account

to vote.

Provide informative CTA buttons directing users to:

https://popin.club

and

https://cbrilliance.io

ADMIN PANEL

Create a secure Admin Dashboard.

Modules

Dashboard

Applications

Contestants

Payments

Email Management

Website CMS

Media

Settings

Analytics

Admins

APPLICATION MANAGEMENT

Admin can

Approve

Reject

View Video

View Birth Certificate

View Health Info

Search

Filter

Export CSV

Bulk Actions

WEBSITE CMS

The landing page should be editable WITHOUT coding.

Admin should be able to edit

Hero

About

Timeline

FAQ

Sponsors

Gallery

Homepage sections

Images

Buttons

Texts

Store all editable content in PostgreSQL.

EMAIL SYSTEM

Implement

Application Received

Application Approved

Application Rejected

Registration Reminder

Link Expired

Payment Confirmation

Responsive HTML templates.

DATABASE

Design Postgres schema first (not with prisma).

Include

Users

Applications

Videos

Payments

Admins

Website Content

Magic Links

Email Logs

Audit Logs

Media

Settings

SECURITY

Use

JWT

Rate Limiting

Server Validation

Zod

CSRF Protection

Sanitize uploads

Secure headers

Role-based permissions

Magic link expiration

One-time links

SEO

Implement

Metadata

OpenGraph

Twitter Cards

Structured Data

Dynamic sitemap

Robots.txt

Canonical URLs

Performance optimization

ANIMATIONS

Use

Framer Motion

GSAP

Lenis

Examples

Hero reveal

Text splitting

Parallax

Scroll fade

Image masks

Animated buttons

Hover effects

Card transitions

Loading screens

Page transitions

Everything should feel premium.

RESPONSIVENESS

Perfect on

Desktop

Laptop

Tablet

Mobile

Large Screens

PERFORMANCE

Lazy loading

Image optimization

Code splitting

Caching

Streaming

Suspense

Server Components where appropriate

ACCESSIBILITY

Keyboard navigation

ARIA labels

Proper contrast

Screen reader support

Focus states

DEVELOPMENT PHASES

Do NOT jump ahead.

Follow this exact order.

Phase 1

Initialize project

Configure architecture

Setup theme

Setup fonts

Create design system

Configure Prisma

Configure PostgreSQL

Phase 2

Landing Page

Phase 3

Submission System

Phase 4

Video Upload

Phase 5

Admin Dashboard

Phase 6

CMS

Phase 7

Authentication

Phase 8

Magic Email Links

Phase 9

Payment Flow

Phase 10

Testing

Phase 11

Optimization

Phase 12

Production Deployment

IMPORTANT

At the end of each phase:

Explain what was completed.
List all files created or modified.
Identify any remaining tasks.
Wait for approval before proceeding to the next phase.

Never skip phases. Build this like an enterprise-grade product with clean, maintainable, scalable code, polished UI/UX, and production-ready architecture.