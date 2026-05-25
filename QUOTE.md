# SoundProof (Verbatim) — Project Quote

**Prepared for:** Client
**Prepared by:** Sameem Amjad
**Date:** 2026-05-07
**Project:** SoundProof — AI Voiceover Accuracy SaaS
**Stated budget range:** $2,000 – $4,000

---

## Overview

This quote presents three delivery tiers within your stated budget. Each tier is fixed-price and broken into five sequential phases with concrete deliverables. You select the tier; the price is locked once we sign.

| Tier | Price | Best for |
|------|-------|----------|
| **Tier A — Core MVP** | **$2,500** | Validating the core idea with paying users. Lean SaaS. |
| **Tier B — Pro (with Admin)** | **$3,500** | Running the product as a managed service with operator visibility. |
| **Tier C — Premium (Admin + Chat + Voice tooling)** | **$4,000** | Full-featured launch with in-product support and engagement tooling. |

All tiers include: source code, deployed production environment, environment variable documentation, and a 30-day post-launch bug-fix window for delivered scope.

---

## Tier A — Core MVP — $2,500

The minimum viable SaaS: users sign up, subscribe, upload audio + script, get a word-level diff with click-to-seek and resolution tracking. No admin tooling, no chatbot.

**What's included**
- Landing page + pricing
- Auth (email/password + Google OAuth + password reset)
- Stripe subscriptions (Starter / Pro tiers, free trial, customer portal)
- Audio upload (MP3 / WAV / M4A) → Whisper transcription
- Word-level diff (Needleman-Wunsch) with timestamps
- Click-to-seek audio player
- Per-error resolve buttons + progress ring + confetti on "Perfect Take"
- Per-session processing (no file persistence)
- Production deploy + handoff doc

### Phase Breakdown

| Phase | Scope | Deliverable | Duration | Cost |
|-------|-------|-------------|----------|------|
| **Phase 1** | Auth, landing page, pricing UI | Live signup/login, pricing page wired up | Week 1 | $500 |
| **Phase 2** | Stripe subscriptions + webhooks | Paid checkout, customer portal, webhook handling for renew/cancel/failed-payment | Week 2 | $500 |
| **Phase 3** | Audio upload + Whisper transcription pipeline | Upload UI, server-side Whisper, transcript display | Week 3 | $600 |
| **Phase 4** | Diff engine + resolution UX | Annotated script, click-to-seek, resolve buttons, progress ring, confetti | Week 4 | $600 |
| **Phase 5** | Polish, edge cases, deployment, handoff | Production deploy, env var doc, handoff video, 30-day bug-fix window opens | Week 5 | $300 |
| | | | **Total** | **$2,500** |

---

## Tier B — Pro (with Admin Panel) — $3,500

Everything in Tier A, plus an **admin panel** so you can see who's signed up, monitor usage, manage subscriptions, and respond to issues without touching the database.

**Adds on top of Tier A**
- Admin authentication (role-based access)
- User dashboard (list users, view subscription status, usage minutes, last activity)
- Subscription management (upgrade/downgrade/refund triggers from admin)
- Usage analytics (active users, monthly minutes processed, churn signals)
- Contact form + feedback inbox (so users can reach you, you can triage)
- Account settings page for end users (change password, manage subscription, view usage)

### Phase Breakdown

| Phase | Scope | Deliverable | Duration | Cost |
|-------|-------|-------------|----------|------|
| **Phase 1** | Auth, landing, pricing, **role-based access (admin vs. user)** | Live signup/login with admin role gating | Week 1 | $600 |
| **Phase 2** | Stripe subscriptions + webhooks + **admin-side subscription view** | Paid checkout, customer portal, webhooks, admin can view all subscriptions | Week 2 | $700 |
| **Phase 3** | Audio upload + Whisper + **usage tracking with admin visibility** | Transcription pipeline, usage minutes table, admin sees per-user usage | Week 3 | $800 |
| **Phase 4** | Diff engine + resolution UX + **user dashboard + account settings** | Full diff/resolve flow, end-user dashboard, account page | Week 4 | $800 |
| **Phase 5** | **Admin panel + contact/feedback inbox**, polish, deploy, handoff | Admin user list, analytics, contact form, feedback inbox, production deploy | Week 5–6 | $600 |
| | | | **Total** | **$3,500** |

---

## Tier C — Premium (Admin + Chatbot + Admin↔User Chat) — $4,000

Everything in Tier B, plus an **AI chatbot** for self-serve support and an **admin↔user direct chat** so you can talk to users in-product. Includes in-browser **voice recorder** so users can record straight into the app instead of uploading a file.

**Adds on top of Tier B**
- AI chatbot widget (handles common questions: "how do I upload?", "what formats?", "billing help") — falls back to a "talk to a human" button
- Admin↔user direct chat (admin sees a list of conversations; users see a chat widget; messages persist for the conversation)
- Email notification to admin when a user opens a new conversation
- In-browser voice recorder (record audio directly in the app, no file upload required)
- Notification system (user gets notified when admin replies; admin gets notified on new contact/feedback/chat)

### Phase Breakdown

| Phase | Scope | Deliverable | Duration | Cost |
|-------|-------|-------------|----------|------|
| **Phase 1** | Auth, landing, pricing, role-based access | Live signup/login, admin gating, pricing page | Week 1 | $650 |
| **Phase 2** | Stripe subscriptions + webhooks + admin subscription view | Checkout, portal, webhooks, admin subscription dashboard | Week 2 | $750 |
| **Phase 3** | Audio upload + **in-browser voice recorder** + Whisper + usage tracking | Upload + record-in-browser, transcription, usage table, admin visibility | Week 3 | $900 |
| **Phase 4** | Diff engine + resolution UX + user dashboard + account settings | Full diff/resolve flow, end-user dashboard, account page | Week 4 | $850 |
| **Phase 5** | **AI chatbot + admin↔user chat + notifications**, contact/feedback, polish, deploy, handoff | Chatbot widget, two-way chat, notifications, admin panel, production deploy | Week 5–6 | $850 |
| | | | **Total** | **$4,000** |

---

## What's Not Included (in any tier)

To keep within budget, the following are explicitly **out of scope** unless quoted separately:
- Native mobile apps (iOS/Android)
- Multi-language UI (i18n) at launch — English only
- Team accounts / multi-seat billing
- White-label / reseller features
- Custom design system (we use shadcn/ui defaults)
- File / session persistence beyond a session (per the brief)
- SOC2 / HIPAA compliance work

If any of these become required, we'll quote them as a written change order before starting.

---

## Payment Schedule (all tiers)

- **40% on contract signing** — kicks off Phase 1
- **30% on completion of Phase 3** — mid-project checkpoint
- **30% on production deploy + handoff** — final delivery

---

## Tech Stack (all tiers)

- **Frontend:** Next.js 14 (App Router) + Tailwind, deployed on Vercel
- **Audio service:** FastAPI on Railway (justified deviation from brief — Vercel's 10s serverless timeout cannot reliably handle Whisper + ffmpeg on longer audio)
- **Auth:** Clerk (email/password + Google OAuth + password reset out of the box)
- **DB:** Supabase Postgres (users, subscriptions, usage_minutes — no audio/results persisted per brief)
- **Payments:** Stripe (subscriptions, customer portal, idempotent webhook handler)
- **Transcription:** OpenAI Whisper API (server-side only — API key never exposed to browser)

---

## Timeline (all tiers)

5–6 weeks from contract signing to deployed production app, with a weekly 15-minute Friday demo call.

---

## Recommended Tier

**Tier B — $3,500** is the recommended option. The admin panel pays for itself within the first month: without it, every billing question, refund, or support issue requires database access. It's the difference between running a product and babysitting one.

Pick **Tier C** if customer support volume will be high (chatbot + in-app chat reduces email load) or if you want users recording directly in the app.

Pick **Tier A** only if you're testing demand before committing to operations work.

---

*This quote is valid for 14 days from the date above. Prices are fixed once the contract is signed. Mid-project scope changes are handled via written change orders.*
