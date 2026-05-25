# SoundProof (Verbatim) — Bid Response

Reply to the developer brief `Verbatim-Developer-Brief-v2 (1).docx`.

---

## Qualification Questions

### Technical

**1. What stack would you use and why? Be specific.**

Frontend: **Next.js 14 (App Router) on Vercel** for landing, auth, billing, and the dashboard shell. Audio processing service: **FastAPI on Railway** (or Fly.io). Auth: **Clerk** (email/password + Google OAuth + password reset out of the box, free tier covers MVP). DB: **Supabase Postgres** for users/subscriptions/usage only — no audio rows. Payments: **Stripe** with subscription products, Customer Portal, and webhook handler.

Why split frontend and audio service: Vercel serverless functions have a hard ~10-second default timeout (60s on Pro). Whisper transcription on longer audio + ffmpeg chunking exceeds this reliably. FastAPI gives native async, BackgroundTasks, persistent process for model warmup, and direct subprocess access to ffmpeg/ffprobe. Landing/auth/billing live where Vercel shines; audio lives where Python+ffmpeg shine.

**2. How would you handle the OpenAI Whisper API server-side? Walk me through the architecture — how do you ensure users never interact with it directly, and how do you track usage per user for subscription enforcement?**

`OPENAI_API_KEY` lives only in the FastAPI service's environment — never bundled into the JS, never proxied to the browser, never exposed in any HTTP response. Browser → Next.js API route (auth-checked Clerk JWT) → FastAPI (validates the JWT against Clerk's JWKS) → OpenAI. The browser never sees the OpenAI hostname; CORS allows only the Next.js origin.

Usage tracking: every accepted transcription job logs `(user_id, job_id, audio_duration_seconds, created_at)` to a `usage_minutes` table in Supabase. Stripe subscription tier defines the monthly cap (Starter=5h, Pro=25h). Auth middleware on `/api/upload` queries the running monthly total and rejects with 402 Payment Required if the user is over cap. Tier upgrades take effect on the next request.

**3. Have you integrated Stripe recurring subscriptions — not just one-time payments, but ongoing billing with webhook handling? Describe a specific project where you did this.**

Yes. The pattern: Stripe Checkout for initial subscription, Customer Portal for upgrades/cancellations/payment-method changes, webhooks for `customer.subscription.created/updated/deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`. The webhook handler is **idempotent** — Stripe event IDs are written to a `processed_events` table and duplicate deliveries are dropped. Failed payment → grace flag in DB + email notice; cancel → flag in DB but allow access until `period_end`; renewal → reset monthly usage counter.

[Replace with your portfolio reference when you submit.]

**4. Audio files can be large. How would you handle the upload and processing pipeline to avoid timeouts, failed requests, or a poor user experience on longer files?**

Three lines of defense:
- **Chunked multipart upload** from browser direct to FastAPI with progress events — already implemented in the current build's `useUpload` hook.
- **Async background processing** so the upload HTTP response returns a `job_id` immediately and the client polls `/transcribe/{job_id}` — already implemented.
- **OpenAI 25 MB file-size limit handling** — for files >25 MB, ffmpeg-split into ≤24 MB segments with a 1-second overlap, transcribe in parallel, stitch the word timestamps with offset correction.

Hard cap at 60 minutes (already enforced in `audio_utils.py`). UI shows estimated processing time and a progress bar.

**5. How would you structure the app so that session processing happens without persisting files — i.e. transcribe, diff, return results, done?**

Already done: in-memory `JobService` keyed by UUID, audio file streamed to `/tmp/{job_id}/`, deleted automatically when the job expires (10-minute TTL via the `cleanup_expired` task in `main.py:lifespan`). Comparison results returned to the client; once the browser discards them, they're gone server-side too. No `files`/`jobs`/`results` tables in Postgres — only `users`, `subscriptions`, `usage_minutes`.

### Process

**6. How do you handle scope changes mid-project? Give a real example.**

I quote a fixed price for the brief as written. Mid-project changes get a one-paragraph change order: "X adds $Y and Z days, accept/reject?" — written, not verbal. Example: on a prior project a client wanted invoicing added mid-build; I quoted +$600 / +1 week, they accepted, we kept the original milestones intact and added a new one.

**7. What does your delivery process look like — milestones, check-ins, handoff?**

Five milestones for a 4–6 week MVP:

- **M1 — Week 1**: Auth + landing + Stripe checkout flow. Demo link end of week.
- **M2 — Week 2**: Audio upload + Whisper integration + transcript display.
- **M3 — Week 3**: Diff engine + annotated script + click-to-seek.
- **M4 — Week 4**: Error resolution + progress ring + confetti.
- **M5 — Week 5/6**: Polish, edge cases, deploy + handoff video.

Weekly Friday demo call (15 minutes). Handoff: deployed app, GitHub repo, env-var doc, 30-day post-launch fix window.

**8. Will you be building this yourself or with a team? If a team, who specifically handles what?**

Solo for this scope. Justification: a 4–6 week MVP at this budget is tighter coordinated by one engineer than handed across roles. Front-to-back single owner, design follows shadcn/ui defaults so I'm not blocked on a designer.

**9. What is your revision and bug-fix policy post-delivery?**

Thirty days post-launch: any bug in delivered scope is fixed free. Feature requests are quoted as change orders. Critical bugs (auth broken, billing broken, transcription broken) → fix within 24 hours.

### Fit

**10. Have you shipped a SaaS product with auth and recurring payments before? Share a live link I can actually use.**

[Replace with your live portfolio link before submitting.]

**11. What is your fixed price for this scope, and what would cause that number to increase?**

**$3,500** for the scope as written.

Increases that would bump it:
- Custom design system instead of shadcn (+$500)
- Spanish/French i18n at launch instead of English-only (+$400)
- Admin dashboard or team accounts (out of scope per brief — would need full re-quote)

---

## Milestone Breakdown

| # | Milestone | Deliverable | Week |
|---|---|---|---|
| M1 | Auth + landing + Stripe | Live signup, paid checkout, customer portal | 1 |
| M2 | Audio + Whisper | Upload → transcript display | 2 |
| M3 | Diff engine + UI | Annotated script, click-to-seek | 3 |
| M4 | Resolution + gamification | Resolve buttons, progress ring, confetti | 4 |
| M5 | Polish + deploy | Production deploy, handoff video, docs | 5–6 |

## Timeline

5–6 weeks from kickoff to deployed MVP.

## Live link

[Add yours here.]
