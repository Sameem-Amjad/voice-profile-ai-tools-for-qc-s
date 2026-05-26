import React from 'react';
import { Link } from 'react-router-dom';
import { Check, AlertTriangle, Clipboard } from 'lucide-react';

const H2 = ({ children }) => (
  <h2 className="text-2xl font-bold text-white mt-12 mb-4 leading-snug">{children}</h2>
);
const H3 = ({ children }) => (
  <h3 className="text-lg font-semibold text-blue-300 mt-8 mb-3">{children}</h3>
);
const P = ({ children }) => (
  <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
);

const CheckItem = ({ children, warning = false }) => (
  <li className="flex items-start gap-2.5 text-gray-300 text-sm py-1 border-b border-white/[0.05]">
    {warning
      ? <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
      : <Check size={15} className="text-green-400 mt-0.5 shrink-0" />
    }
    <span>{children}</span>
  </li>
);

const Section = ({ emoji, title, children }) => (
  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 my-6">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-2xl">{emoji}</span>
      <h3 className="text-white font-bold text-lg">{title}</h3>
    </div>
    <ul className="space-y-1">{children}</ul>
  </div>
);

export default function QCChecklist() {
  return (
    <article>
      <P>
        Good audiobook production is 50% narration and 50% quality control. A brilliant performance
        with a missed word in chapter two will still draw a one-star review and a re-record request.
        This checklist covers every checkpoint — from pre-recording setup through final delivery — so
        nothing ships broken.
      </P>
      <P>
        Use it as a per-title production checklist. It's designed for both solo narrators and
        studio production teams.
      </P>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 my-6 flex gap-3 text-blue-200">
        <Clipboard size={18} className="shrink-0 mt-0.5" />
        <p className="text-sm leading-relaxed">
          <strong>How to use this checklist:</strong> Complete each section before moving to the
          next. The script accuracy section (Section 3) works best when paired with an automated
          QC tool — trying to do it manually adds 2–3 hours per chapter and still misses errors.
        </p>
      </div>

      <H2>Section 1: Pre-Recording</H2>
      <P>
        Problems that start before the mic is on are the hardest to fix in post. This section
        prevents the most common sources of re-records.
      </P>
      <Section emoji="📋" title="Script Preparation">
        <CheckItem>Proofread the script for unusual proper nouns, acronyms, and technical terms</CheckItem>
        <CheckItem>Create a pronunciation guide for any words you might render inconsistently</CheckItem>
        <CheckItem>Mark chapter breaks, section headers, and any formatting that affects pacing</CheckItem>
        <CheckItem>Confirm the script version with the author or publisher — record from the final draft only</CheckItem>
        <CheckItem warning>Flag any ambiguous passages before recording, not after</CheckItem>
      </Section>

      <Section emoji="🎙️" title="Recording Environment">
        <CheckItem>Check room acoustic consistency — same setup as previous sessions for this title</CheckItem>
        <CheckItem>Record a 30-second room tone sample before every session</CheckItem>
        <CheckItem>Confirm microphone position is identical to previous sessions (mark it if needed)</CheckItem>
        <CheckItem>Test recording levels — peaks between -6 dB and -3 dB, noise floor below -60 dB</CheckItem>
        <CheckItem>Disable notifications, phone, and any background processes on your recording machine</CheckItem>
      </Section>

      <H2>Section 2: During Recording</H2>
      <P>
        Good habits during the session reduce post-production time significantly.
      </P>
      <Section emoji="⏺️" title="Session Discipline">
        <CheckItem>Record chapter by chapter — don't mix chapters in a single take</CheckItem>
        <CheckItem>Mark stumbled takes with a verbal cue ("take two") or a clap for easy location in the waveform</CheckItem>
        <CheckItem>Note timestamps of any passages you're uncertain about in a session log</CheckItem>
        <CheckItem>Keep raw and edited files in separate folders — never overwrite raw takes</CheckItem>
        <CheckItem>Pause and re-read if you lose your place, rather than editing yourself back in</CheckItem>
        <CheckItem warning>Do not edit during recording — finish the take, then fix in post</CheckItem>
      </Section>

      <H2>Section 3: Script Accuracy QC</H2>
      <P>
        This is the step most studios underinvest in. Manual review of script accuracy against audio
        takes 2–3× the runtime of the audio and still misses 10–15% of errors. AI-assisted QC
        tools like{' '}
        <Link to="/" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
          SoundProof
        </Link>{' '}
        reduce this to minutes with higher accuracy.
      </P>
      <Section emoji="🔍" title="Automated Script Comparison">
        <CheckItem>Upload audio + script to an automated QC tool — run per chapter, not per full book</CheckItem>
        <CheckItem>Review all flagged omissions (words in script not spoken)</CheckItem>
        <CheckItem>Review all flagged substitutions (wrong word spoken) — pay extra attention to near-matches</CheckItem>
        <CheckItem>Review all flagged additions (extra words spoken not in script)</CheckItem>
        <CheckItem>Listen to the 5 seconds around every flagged error before marking it resolved</CheckItem>
        <CheckItem warning>Don't skip "near-match" flags — homophones and near-synonyms are the most common source of post-delivery complaints</CheckItem>
      </Section>

      <Section emoji="✏️" title="Human Review Pass">
        <CheckItem>Listen to any sections marked uncertain during recording</CheckItem>
        <CheckItem>Verify chapter openings and closings read exactly as scripted</CheckItem>
        <CheckItem>Check that all proper nouns, brand names, and titles are consistent across chapters</CheckItem>
        <CheckItem>Confirm any dialogue attributions ("he said", "she replied") match the script</CheckItem>
      </Section>

      <H2>Section 4: Audio Quality QC</H2>
      <P>
        Script accuracy and audio quality are separate passes. Don't try to check both simultaneously
        — you'll do neither well.
      </P>
      <Section emoji="🔊" title="Technical Audio Standards">
        <CheckItem>Noise floor: -60 dB or lower (ACX requires -60 dB minimum)</CheckItem>
        <CheckItem>Peak normalization: -3 dB maximum</CheckItem>
        <CheckItem>RMS loudness: -23 to -18 dB (ACX standard), or per-distributor spec</CheckItem>
        <CheckItem>No clipping — check the waveform for flat tops in loud passages</CheckItem>
        <CheckItem>Consistent room tone across all chapters — no audible difference when switching chapters</CheckItem>
        <CheckItem>No clicks, pops, or mic handling noise</CheckItem>
        <CheckItem warning>Breath normalisation: excessive breath sounds are one of the top listener complaints — use automation or manual editing to even them out</CheckItem>
      </Section>

      <H2>Section 5: Delivery Standards</H2>
      <P>
        Every distributor has slightly different specifications. Encode for the target platform before
        delivery, not after.
      </P>
      <Section emoji="📦" title="File Format and Metadata">
        <CheckItem>Format: MP3 (192 kbps CBR) for ACX; WAV 44.1kHz/16-bit for most other distributors</CheckItem>
        <CheckItem>File naming: consistent convention across all chapters (e.g. Title_Ch01.mp3)</CheckItem>
        <CheckItem>Silence at head: 0.5–1 second of room tone before narration begins</CheckItem>
        <CheckItem>Silence at tail: 1–5 seconds of room tone after narration ends</CheckItem>
        <CheckItem>Metadata embedded: title, author, narrator, chapter number, ISRC if applicable</CheckItem>
        <CheckItem>Chapter markers set correctly if delivering a single-file audiobook</CheckItem>
        <CheckItem warning>Run a final ACX Check (or equivalent) immediately before upload — don't rely on your DAW's meters alone</CheckItem>
      </Section>

      <H2>Quick Reference: The Short Version</H2>
      <div className="grid sm:grid-cols-2 gap-3 my-6 text-sm">
        {[
          'Script locked before recording starts',
          'Room tone consistent across sessions',
          'Raw takes preserved, never overwritten',
          'Automated script accuracy QC per chapter',
          'Near-match errors reviewed manually',
          'Noise floor below -60 dB',
          'Peak normalization at -3 dB max',
          'File naming convention followed',
          'Metadata embedded before delivery',
          'Final technical check before upload',
        ].map((item) => (
          <div key={item} className="flex items-center gap-2.5 bg-white/[0.03] border border-white/10 rounded-lg px-4 py-2.5">
            <Check size={14} className="text-green-400 shrink-0" />
            <span className="text-gray-300">{item}</span>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8 mt-12 text-center">
        <p className="text-white font-bold text-xl mb-2">Automate your script accuracy QC</p>
        <p className="text-gray-300 text-sm mb-5 max-w-md mx-auto">
          SoundProof handles Section 3 of this checklist automatically — upload audio and script,
          get every error flagged with timestamps in under 30 seconds.
        </p>
        <Link
          to="/sign-up"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
        >
          Start free trial →
        </Link>
      </div>

      <div className="mt-10 pt-6 border-t border-white/10">
        <p className="text-gray-500 text-sm font-medium mb-3">Related reading</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/blog/audiobook-qc" className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2">
            The Best Audiobook Quality Control Software in 2025 →
          </Link>
          <Link to="/blog/catch-voiceover-errors" className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2">
            How to Catch Voiceover Errors Before Delivery →
          </Link>
        </div>
      </div>
    </article>
  );
}
