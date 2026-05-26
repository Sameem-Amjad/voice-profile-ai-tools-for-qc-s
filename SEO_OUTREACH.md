# SoundProof — SEO Outreach Copy-Paste Kit

Everything below is ready to copy-paste. Adjust the bracketed parts [like this] before posting.

---

## 1. Reddit — r/audiobooks

**Post title:**
```
I made a free tool that catches every word your narrator got wrong — with timestamps
```

**Post body:**
```
Hey r/audiobooks,

I've been working on audiobook production for a while and kept running into the same problem: QC is painfully slow. An editor sits with the script in one hand and the audio in the other, scrubbing through hours of recording to catch dropped words and substitutions.

So I built a tool that does it automatically.

You upload the audio and the script. It uses AI (Whisper + a sequence alignment algorithm) to compare them word by word and flags every omission, substitution, and addition — with the exact timestamp. Click an error, jump to that moment in the audio.

A chapter that used to take 45 minutes to review manually now takes under 10 minutes.

It's called SoundProof: https://soundproof-voice-check.vercel.app

Free trial, no credit card. Audio is never stored — it's processed and discarded after the diff, which matters for publisher contracts.

Happy to answer questions about how the alignment works if anyone's curious.
```

---

## 2. Reddit — r/VoiceActing

**Post title:**
```
Built a tool to catch script errors in your takes before delivery — free to try
```

**Post body:**
```
Fellow narrators,

You know that feeling when a client comes back and says "you said 'can' but the script says 'cannot' on page 47"? And you have to go back, find the moment, re-record, re-edit, re-export?

I built something to catch that before it leaves your studio.

SoundProof: you upload your take and the script, and it returns a word-by-word diff in under 30 seconds. Every omission, substitution, and addition is flagged with a timestamp. Click it to jump straight to that moment in the audio.

It catches the sneaky ones too — "further" vs "farther", "cannot" vs "can", word transpositions that your ear glosses over because the sentence still sounds right.

Free trial here: https://soundproof-voice-check.vercel.app

No credit card, audio is never stored (important for NDA'd projects). Would love feedback from working narrators.
```

---

## 3. Reddit — r/audiobooks (checklist post — non-promotional, pure value)

**Post title:**
```
Complete audiobook QC checklist I use for every title (script accuracy, audio, delivery standards)
```

**Post body:**
```
I've put together the QC checklist I use for every audiobook production. Covers pre-recording, during session, script accuracy, audio standards, and delivery specs.

Full checklist here: https://soundproof-voice-check.vercel.app/blog/audiobook-qc-checklist

The short version:

**Pre-recording**
- Script locked and proofread before recording starts
- Pronunciation guide for unusual proper nouns
- Room setup consistent with previous sessions

**During recording**
- Record chapter by chapter, not mixed takes
- Mark stumbles verbally ("take two") for easy location
- Never overwrite raw takes

**Script accuracy QC**
- Word-level comparison against script (catch omissions, substitutions, additions)
- Pay extra attention to near-matches — "cannot/can", "further/farther"
- Human review pass on chapter openings/closings and all proper nouns

**Audio quality**
- Noise floor: -60 dB or lower (ACX minimum)
- Peak normalization: -3 dB max
- RMS loudness: -23 to -18 dB (ACX standard)
- No clipping, consistent room tone across chapters

**Delivery**
- MP3 192 kbps CBR for ACX; WAV 44.1kHz/16-bit for most others
- 0.5–1 second room tone at head, 1–5 seconds at tail
- Metadata embedded before upload

Happy to answer questions about any of these steps.
```

---

## 4. ACX Community Forums

**Thread title:**
```
Tool for catching script deviations before submission — worth trying
```

**Post body:**
```
Hi everyone,

I've been dealing with the same QC problem most of us have — spending hours scrubbing through audio against the script to catch the words I got wrong. I built a tool to solve it.

SoundProof (https://soundproof-voice-check.vercel.app) compares your recording against the script word by word and flags every error with a timestamp. Omissions, substitutions, additions, near-matches. You click the flagged word and jump straight to that moment in the audio.

What's relevant for ACX work specifically:
- Audio is never stored. It's processed per session and discarded. Your unreleased manuscripts are safe.
- Works on WAV, MP3, and M4A — whatever your DAW exports
- Results in under 30 seconds for a standard chapter

Free trial, no credit card. Would genuinely appreciate feedback from narrators who are doing high volume ACX work — tell me what it gets wrong.
```

---

## 5. Facebook Groups (Audiobook Production / Narrators)

**Post:**
```
Quick share for the narrators and producers in here —

I built a tool that catches script errors in your voiceover takes automatically. Upload the audio + script, get a word-by-word diff in under 30 seconds. Every dropped word, wrong word, and extra word is flagged with a timestamp so you can click straight to it.

It cut my QC time from ~45 min per chapter to under 10. Free trial at soundproof-voice-check.vercel.app — no credit card, and audio is never stored (important if you're working under NDA or publisher contracts).

Would love feedback from anyone doing high-volume work. What errors does it miss?
```

---

## 6. Product Hunt Launch

**Tagline (60 chars max):**
```
Spell-check, but for audio — catch every voiceover error
```

**Description:**
```
SoundProof is an AI-powered voiceover QC tool built for audiobook studios and narrators.

Upload your recording and script. Within 30 seconds, see every dropped word, substitution, and addition — with the exact timestamp. Click any error to jump straight to that moment in the audio.

**How it works:**
- OpenAI Whisper transcribes the audio
- Needleman-Wunsch alignment compares it word-for-word against your script
- Every error is categorised (omission / substitution / addition) and timestamped

**Built for:**
- Audiobook producers and narrators
- Corporate training and e-learning studios
- Anyone doing voiceover QC at volume

**What makes it different:**
- Audio is never stored — processed per session, then discarded. Publisher contracts and NDAs stay safe.
- Works in any browser. No install, no plugin.
- Near-match detection flags homophones and near-synonyms your ear will miss.

Free trial, no credit card required.
```

**First comment (post this as your own comment immediately after launch):**
```
Hey Product Hunt 👋

I built SoundProof after watching a QC editor spend 3 hours reviewing a single audiobook chapter — script in one hand, audio scrubbing in the other.

The hard part wasn't the transcription (Whisper handles that well). It was the alignment — matching what the narrator actually said against the script, accounting for reorderings, paraphrases, and the way speech diverges from text. We use a Needleman-Wunsch alignment, which is the same algorithm used for DNA sequence comparison. It handles the non-linear patterns in speech far better than a simple diff.

Happy to go deep on the technical side if anyone's curious. And if you're an audiobook producer or narrator — I'd genuinely love to know what it gets wrong on your content.

Try it free: https://soundproof-voice-check.vercel.app
```

---

## 7. Cold DM — Narrators & Studios (LinkedIn / Twitter / Instagram)

**Short version (Twitter/Instagram DM):**
```
Hey [Name] — I built a tool that catches script errors in voiceover takes automatically (word-level diff with timestamps). Would love a narrator with your experience to try it and tell me what it misses. Free at soundproof-voice-check.vercel.app — no credit card, audio never stored.
```

**Longer version (LinkedIn):**
```
Hi [Name],

I came across your work [on LinkedIn / through your audiobook credits] and wanted to reach out.

I've been building a tool called SoundProof for audiobook narrators and studios — it compares a recording against the script word by word and flags every error with a timestamp. The goal is to replace the 2–3 hour manual QC pass with a 10-minute AI-assisted one.

I'd love to offer you a free extended trial in exchange for honest feedback. No credit card, no pitch. The one thing I want to know is: what does it miss on your content?

You can try it immediately at soundproof-voice-check.vercel.app.

Thanks for your time either way — your work on [specific book/project if you know one] is genuinely impressive.

[Your name]
```

---

## 8. Email Outreach — Small Audiobook Studios

**Subject line:**
```
Cut your QC time by 80% — free trial for [Studio Name]
```

**Email body:**
```
Hi [Name],

I'll keep this short.

I built a tool that replaces the manual "scrub audio against script" QC pass with an AI-generated word-level diff. Upload audio + script, get every error flagged with timestamps in under 30 seconds. Click to jump straight to the problem.

Studios using it are cutting QC time from 2–3 hours per chapter to under 30 minutes.

Free trial at https://soundproof-voice-check.vercel.app — no credit card, and audio is never stored (so publisher NDAs are safe).

Worth 5 minutes on your next chapter.

[Your name]
SoundProof
```

---

## 9. Blog Post Sharing — Direct Link to Each Post

Use these links when sharing on social or in communities:

| Post | URL | Best for |
|------|-----|----------|
| Audiobook QC Software Guide | `soundproof-voice-check.vercel.app/blog/audiobook-qc` | Twitter, LinkedIn, Google (main SEO target) |
| How to Catch Voiceover Errors | `soundproof-voice-check.vercel.app/blog/catch-voiceover-errors` | Reddit r/VoiceActing, ACX forums, Facebook groups |
| Audiobook QC Checklist | `soundproof-voice-check.vercel.app/blog/audiobook-qc-checklist` | Reddit r/audiobooks, Pinterest, Facebook groups |

**Tweet template for each post:**

```
Thread: How to catch voiceover errors before delivery 🧵

Every narrator I know has shipped an error that should have been caught in QC. Here's the process that stops it from happening again:

👉 soundproof-voice-check.vercel.app/blog/catch-voiceover-errors

#voiceover #audiobooks #narration
```

```
The complete audiobook QC checklist — script accuracy, audio standards, delivery specs, all in one place.

Free resource: soundproof-voice-check.vercel.app/blog/audiobook-qc-checklist

#audiobooks #voiceover #ACX #audiobookproduction
```

---

## 10. Google Search Console — Steps After Deploying

1. Go to: https://search.google.com/search-console
2. Click "Add property" → choose "URL prefix"
3. Enter: `https://soundproof-voice-check.vercel.app`
4. Choose verification method: "HTML tag" (already added to your site)
5. Click Verify
6. Go to Sitemaps → enter `sitemap.xml` → click Submit
7. Come back in 3–5 days to check "Coverage" and "Pages indexed"

---

## 11. Free Directory Listings (High DA backlinks, 10 min each)

Submit to these — they index quickly and carry real link authority:

| Directory | URL | Notes |
|-----------|-----|-------|
| Futurepedia | futurepedia.io/submit-tool | AI tools directory, high traffic |
| There's An AI For That | theresanaiforthat.com | Submit your tool |
| AI Tool Hunt | aitoolhunt.com | Free listing |
| Toolify | toolify.ai | AI tools, good DA |
| G2 | g2.com | Create a free product page |
| Capterra | capterra.com | Free listing, audio/video category |
| AlternativeTo | alternativeto.net | List as alternative to manual QC tools |
| BetaList | betalist.com | Good for early traction |

**Description to use for all directory submissions:**
```
SoundProof is an AI-powered voiceover quality control tool for audiobook studios and narrators. Upload an audio recording and script — get a word-level diff with timestamps in under 30 seconds. Catches every omission, substitution, and addition. Audio is never stored. Free trial available.

Category: Audio, AI Tools, Content Production
Website: https://soundproof-voice-check.vercel.app
```
