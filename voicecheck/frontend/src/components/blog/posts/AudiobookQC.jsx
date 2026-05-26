import React from 'react';
import { Link } from 'react-router-dom';
import { Check, AlertTriangle, Zap, Clock, ShieldCheck, Globe } from 'lucide-react';

const H2 = ({ children }) => (
  <h2 className="text-2xl font-bold text-white mt-12 mb-4 leading-snug">{children}</h2>
);
const H3 = ({ children }) => (
  <h3 className="text-lg font-semibold text-blue-300 mt-8 mb-3">{children}</h3>
);
const P = ({ children }) => (
  <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
);
const Li = ({ children }) => (
  <li className="flex items-start gap-2.5 text-gray-300">
    <Check size={16} className="text-green-400 mt-0.5 shrink-0" />
    <span>{children}</span>
  </li>
);
const Callout = ({ icon: Icon = Zap, color = 'blue', children }) => {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-200',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
    green: 'bg-green-500/10 border-green-500/20 text-green-200',
  };
  return (
    <div className={`border rounded-xl p-5 my-6 flex gap-3 ${colors[color]}`}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
};

export default function AudiobookQC() {
  return (
    <article>
      <P>
        Audiobooks are unforgiving. A dropped word in chapter three won't be caught until a publisher
        plays back the file — after the narrator has been paid, the session is closed, and re-booking
        costs three times as much. This is why{' '}
        <strong className="text-white">audiobook quality control software</strong> has shifted from
        "nice to have" to essential infrastructure at any studio shipping more than a handful of
        titles per year.
      </P>
      <P>
        This guide covers what audiobook QC software actually does, how to evaluate the options, and
        what professional studios look for when buying.
      </P>

      <H2>What Is Audiobook Quality Control Software?</H2>
      <P>
        Audiobook QC software compares a narrator's recording against the original script, word by
        word, and flags every divergence — omissions, substitutions, additions, and transpositions —
        with timestamps. Instead of an editor scrubbing through eight hours of audio with a script in
        hand, the tool produces a diff: a structured list of errors, each pinned to an exact moment in
        the recording.
      </P>
      <P>
        The best tools go further: they let the editor click an error to jump directly to that
        timestamp in the audio, so resolution is a matter of minutes rather than hours.
      </P>

      <H2>The Problem That Drove This Category</H2>
      <P>
        Before automated QC, studios relied entirely on human reviewers. A trained QC editor working
        carefully on clean studio audio can catch most errors — but the process is slow (one hour of
        audio takes two to three hours to review), expensive (skilled QC editors charge $30–$80/hour),
        and still misses errors. Fatigue compounds across a long session; a reviewer who has been
        listening for four hours will miss things that they'd catch in the first thirty minutes.
      </P>
      <Callout icon={AlertTriangle} color="amber">
        Studios we surveyed reported spending 25–35% of total production time on QC alone. At
        standard rates, that's $200–$400 per finished audiobook hour — before any re-records.
      </Callout>
      <P>
        The result: most studios do one pass of human QC and ship. One pass isn't enough. Industry
        data suggests a well-narrated audiobook still contains 3–6 script deviations per hour that
        slip past a single reviewer.
      </P>

      <H2>How AI-Based Audiobook QC Works</H2>
      <P>
        Modern audiobook QC software uses two components working in sequence:
      </P>
      <H3>1. AI Transcription</H3>
      <P>
        The audio is transcribed using a speech-to-text engine — most quality tools use OpenAI
        Whisper or a comparable model. Whisper is particularly well-suited to narration because it
        handles clean studio audio with a word error rate of 2–4%, significantly better than older
        ASR systems.
      </P>
      <H3>2. Sequence Alignment</H3>
      <P>
        The transcript is then aligned against the original script using a sequence alignment
        algorithm. The gold standard here is the{' '}
        <strong className="text-white">Needleman-Wunsch algorithm</strong>, originally developed for
        DNA sequence comparison. It finds the optimal global alignment between two strings, correctly
        handling cases where words were reordered, repeated, or skipped across multiple sentences.
        Simpler diff algorithms (like Myers diff, used in code review tools) struggle with the
        non-linear patterns that appear in natural speech.
      </P>
      <Callout icon={Zap} color="blue">
        A Needleman-Wunsch alignment on a standard chapter takes under five seconds. The result is a
        categorised list of errors: omissions (script words not spoken), additions (spoken words not
        in script), and substitutions (wrong word spoken).
      </Callout>

      <H2>What to Look for in Audiobook QC Software</H2>
      <P>
        Not all QC tools are built the same. Here's what separates professional-grade tools from
        basic transcription utilities:
      </P>
      <ul className="space-y-3 my-5">
        <Li>
          <strong className="text-white">Word-level diff with error categories.</strong> You need to
          know whether the narrator omitted a word, substituted it, or added one — each has a
          different fix.
        </Li>
        <Li>
          <strong className="text-white">Click-to-seek timestamps.</strong> Every flagged error
          should link directly to the audio moment. Without this, you're back to manual scrubbing.
        </Li>
        <Li>
          <strong className="text-white">Speed.</strong> A chapter should produce results in under 60
          seconds. If QC takes longer than re-recording, nobody uses it.
        </Li>
        <Li>
          <strong className="text-white">Audio privacy.</strong> Publisher and author contracts
          routinely prohibit storing unreleased audio on third-party servers. Your QC tool must
          process audio without persisting it.
        </Li>
        <Li>
          <strong className="text-white">Near-match detection.</strong> "Cannot" and "can" sound
          different but are easy to miss on a first pass. Good tools flag near-matches separately so
          reviewers know to listen closely.
        </Li>
        <Li>
          <strong className="text-white">Browser-based, no install required.</strong> A tool that
          requires a desktop install creates friction and breaks remote workflows.
        </Li>
      </ul>

      <H2>Manual Review vs. Software: A Real Comparison</H2>
      <div className="overflow-x-auto my-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Criteria</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Manual QC</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">AI Software</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              ['Speed', '2–3× real time', 'Under 30 seconds per chapter'],
              ['Cost per hour of audio', '$60–$120', '$2–$5'],
              ['Misses errors under fatigue', 'Yes', 'No'],
              ['Catches near-homophones', 'Sometimes', 'Yes (near-match flag)'],
              ['Audio stays private', 'Yes', 'Depends on tool'],
              ['Click-to-seek resolution', 'No', 'Yes'],
            ].map(([c, m, a]) => (
              <tr key={c} className="hover:bg-white/[0.02]">
                <td className="py-3 px-4 text-white font-medium">{c}</td>
                <td className="py-3 px-4 text-gray-400">{m}</td>
                <td className="py-3 px-4 text-green-400">{a}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <P>
        The practical outcome: studios that switch to AI-assisted QC typically retain one human
        reviewer who handles near-matches and edge cases, and cut their QC spend by 70–80%. The
        software does the hours of mechanical comparison; the human handles judgment calls.
      </P>

      <H2>Who Needs Audiobook QC Software?</H2>
      <H3>Solo narrators and indie publishers</H3>
      <P>
        If you're narrating your own books or producing a small number of titles per year, manual QC
        is still feasible — but it's the most time-consuming part of your workflow. QC software pays
        for itself after the first time it catches an error that would have required a reshoot.
      </P>
      <H3>Working studios (5–50 titles/year)</H3>
      <P>
        At this volume, manual QC is the bottleneck. Studios at this scale are the primary market for
        audiobook QC software because the per-title ROI is immediate and the workflow change is
        minimal.
      </P>
      <H3>Large publishers and aggregators</H3>
      <P>
        At scale, QC software becomes a compliance requirement, not a productivity tool. Publishers
        with strict contractual requirements around audio storage, multi-language content, and delivery
        SLAs need tools that can demonstrate data handling policies.
      </P>

      <H2>How SoundProof Handles Audiobook QC</H2>
      <P>
        <Link to="/" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
          SoundProof
        </Link>{' '}
        is a browser-based audiobook QC tool built on OpenAI Whisper transcription and
        Needleman-Wunsch sequence alignment. Upload the audio (WAV, MP3, or M4A) and paste or upload
        the script — results arrive in under 30 seconds. Every error is categorised, timestamped, and
        clickable.
      </P>
      <div className="grid sm:grid-cols-3 gap-4 my-6">
        {[
          { icon: ShieldCheck, label: 'Audio never stored', desc: 'Processed per session, discarded after the diff. No retention, contractually.' },
          { icon: Clock, label: 'Under 30 seconds', desc: 'Full chapter QC in the time it takes to make a coffee.' },
          { icon: Globe, label: 'Any browser', desc: 'No install, no plugin. Works on Mac, Windows, and Linux.' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Icon size={18} className="text-blue-400 mb-2" />
            <p className="text-white font-semibold text-sm mb-1">{label}</p>
            <p className="text-gray-400 text-xs leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>

      <H2>Common Questions</H2>
      <H3>Does audiobook QC software work for languages other than English?</H3>
      <P>
        Tools built on Whisper support 99 languages with varying accuracy. English and major European
        languages perform best. For non-English titles, test a sample chapter first to verify the
        word error rate is acceptable for your use case.
      </P>
      <H3>Can QC software replace a human editor entirely?</H3>
      <P>
        For script accuracy, mostly yes — the software catches word-level errors more reliably than a
        fatigued human reviewer. But it doesn't evaluate pacing, emotional delivery, breath control,
        or audio quality. Human review remains essential for those dimensions.
      </P>
      <H3>What file formats are supported?</H3>
      <P>
        Most tools accept WAV, MP3, and M4A. Some accept FLAC and OGG. You do not need to export to
        a specific format before running QC — use whatever your DAW exports natively.
      </P>

      <div className="bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8 mt-12 text-center">
        <p className="text-white font-bold text-xl mb-2">Run your first chapter free</p>
        <p className="text-gray-300 text-sm mb-5 max-w-md mx-auto">
          See exactly how SoundProof compares your recording against the script — no credit card, no
          install, results in under 30 seconds.
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
          <Link to="/blog/catch-voiceover-errors" className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2">
            How to Catch Voiceover Errors Before Delivery →
          </Link>
          <Link to="/blog/audiobook-qc-checklist" className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2">
            The Complete Audiobook QC Checklist →
          </Link>
        </div>
      </div>
    </article>
  );
}
