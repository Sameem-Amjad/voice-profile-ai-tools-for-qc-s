import React from 'react';
import { Link } from 'react-router-dom';
import { Check, AlertTriangle, Zap } from 'lucide-react';

const H2 = ({ children }) => (
  <h2 className="text-2xl font-bold text-white mt-12 mb-4 leading-snug">{children}</h2>
);
const H3 = ({ children }) => (
  <h3 className="text-lg font-semibold text-blue-300 mt-8 mb-3">{children}</h3>
);
const P = ({ children }) => (
  <p className="text-gray-300 leading-relaxed mb-4">{children}</p>
);
const Li = ({ children, icon: Icon = Check, color = 'text-green-400' }) => (
  <li className="flex items-start gap-2.5 text-gray-300">
    <Icon size={16} className={`${color} mt-0.5 shrink-0`} />
    <span>{children}</span>
  </li>
);
const Callout = ({ icon: Icon = Zap, color = 'blue', children }) => {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-200',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-200',
    red: 'bg-red-500/10 border-red-500/20 text-red-200',
  };
  return (
    <div className={`border rounded-xl p-5 my-6 flex gap-3 ${colors[color]}`}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <p className="text-sm leading-relaxed">{children}</p>
    </div>
  );
};

export default function CatchVoiceoverErrors() {
  return (
    <article>
      <P>
        Every voiceover session produces errors. The narrator substitutes "cannot" for "can",
        drops an article, paraphrases a sentence they've read fifty times and know better than the
        author does. These deviations feel minor in the booth. They feel catastrophic after the file
        has been delivered to a publisher who catches them on playback.
      </P>
      <P>
        This guide covers the practical workflow for catching voiceover errors before delivery —
        the types of errors to look for, why manual review alone isn't enough, and a step-by-step
        process that combines AI-assisted detection with focused human review.
      </P>

      <H2>The 4 Types of Voiceover Errors</H2>
      <P>
        Understanding error types helps you catch them faster. Each type has a different cause and
        a different fix.
      </P>

      <H3>1. Omissions</H3>
      <P>
        The narrator skips a word or phrase entirely. This is the most common error type and the
        hardest to catch on manual review because the sentence still sounds grammatically correct.
        "The old library" becomes "the library." A human listener might not notice; a diff against
        the script will.
      </P>

      <H3>2. Substitutions</H3>
      <P>
        A word from the script is replaced with a different word. Near-synonyms are particularly
        dangerous: "further" vs "farther", "that" vs "which", "ensure" vs "insure". In fiction,
        these are usually minor. In non-fiction, legal, or medical content, they can change meaning
        materially.
      </P>
      <Callout icon={AlertTriangle} color="amber">
        Real example: A narrator recording a compliance training script substituted "must not" for
        "should not" three times across a 90-minute course. The course shipped, triggered a legal
        review, and required a full re-record. Cost: $4,200.
      </Callout>

      <H3>3. Additions</H3>
      <P>
        The narrator adds words that aren't in the script. This is usually unconscious — filler
        words ("um", "uh"), repeated articles ("the the"), or padding phrases ("you know",
        "basically"). Good narrators do it rarely; every narrator does it occasionally.
      </P>

      <H3>4. Transpositions</H3>
      <P>
        Two adjacent words get swapped: "red large barn" instead of "large red barn." These are
        the easiest error for the human ear to miss, because the brain autocorrects familiar word
        order during listening.
      </P>

      <H2>Why Manual Review Alone Isn't Enough</H2>
      <P>
        A trained human reviewer working carefully can catch 85–90% of script deviations on a first
        pass. That sounds good until you do the math: for a 10-hour audiobook with 50 errors per
        hour, 10% means 50 errors shipped. And that's a careful, attentive reviewer.
      </P>
      <P>
        The practical problems with relying entirely on human review:
      </P>
      <ul className="space-y-3 my-5">
        <Li><strong className="text-white">Fatigue compounds errors.</strong> Error catch rates drop by 15–20% after four hours of continuous review.</Li>
        <Li><strong className="text-white">Familiarity blindness.</strong> A reviewer who has read the script to prep for a session will autocorrect omissions they've already processed.</Li>
        <Li><strong className="text-white">Cost limits passes.</strong> Most studios run one review pass due to cost. One pass isn't enough for error-free delivery.</Li>
        <Li><strong className="text-white">Near-homophones slip through.</strong> "Wreak/reek", "further/farther", "affect/effect" — the ear accepts the wrong one when it sounds natural.</Li>
      </ul>

      <H2>AI-Assisted Error Detection: How It Works</H2>
      <P>
        Modern voiceover QC tools use two steps: they transcribe the audio with a speech-to-text
        model (typically OpenAI Whisper), then align that transcript against the original script
        using a sequence alignment algorithm. The result is a word-by-word diff — every omission,
        substitution, and addition is flagged with its timestamp.
      </P>
      <P>
        This doesn't replace human judgment — it focuses it. Instead of scrubbing through eight
        hours of audio looking for problems, the reviewer sees a list of exactly where the problems
        are and clicks to jump to each one. Review time drops from hours to minutes.
      </P>
      <Callout icon={Zap} color="blue">
        Studios using{' '}
        <Link to="/" className="text-blue-300 hover:text-blue-200 underline underline-offset-2">
          SoundProof
        </Link>{' '}
        report reducing their QC time by 75–85% on average. A chapter that took 45 minutes to
        review manually now takes under 10 minutes.
      </Callout>

      <H2>Step-by-Step Workflow for Catching Voiceover Errors</H2>

      <div className="space-y-4 my-6">
        {[
          {
            step: '01',
            title: 'Record and export normally',
            body: "Don't change your recording workflow. Export the finished take as WAV or MP3 — whatever your DAW produces.",
          },
          {
            step: '02',
            title: 'Upload audio and script together',
            body: 'Paste the script text or upload the script file alongside the audio. Both inputs are needed for the comparison.',
          },
          {
            step: '03',
            title: 'Review the diff output',
            body: 'The tool returns a categorised list: omissions in one colour, substitutions in another, additions flagged separately. Near-matches are highlighted so you know to listen carefully even when the word looks close.',
          },
          {
            step: '04',
            title: 'Click each error to jump to the timestamp',
            body: "Don't scrub. Click the flagged word and your audio player jumps to that exact moment. Listen to the 5–10 seconds around it to confirm the error.",
          },
          {
            step: '05',
            title: 'Re-record problem sections',
            body: 'Most errors are single words or short phrases. Punch in just the problem section — you rarely need to re-read a full paragraph.',
          },
          {
            step: '06',
            title: 'Run the fixed section through once more',
            body: "A quick second pass on edited sections confirms the fix didn't introduce a new error during the punch-in.",
          },
        ].map(({ step, title, body }) => (
          <div key={step} className="flex gap-4 bg-white/[0.03] border border-white/10 rounded-xl p-5">
            <span className="text-2xl font-bold text-blue-500/40 tabular-nums shrink-0 mt-0.5">{step}</span>
            <div>
              <p className="text-white font-semibold mb-1">{title}</p>
              <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <H2>What AI Detection Doesn't Catch</H2>
      <P>
        Be clear about the limits. AI-assisted QC tools catch script deviations — words that are
        wrong, missing, or added. They don't evaluate:
      </P>
      <ul className="space-y-2 my-4">
        {[
          'Pacing and prosody — whether the delivery matches the intended tone',
          'Emotional performance — flatness, incorrect emphasis',
          'Breath control and mouth noise',
          'Mispronunciations that match the script phonetically (e.g. "EKS-presoh" for "espresso")',
          'Technical audio issues — room noise, clipping, inconsistent gain',
        ].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-gray-300 text-sm">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
      <P>
        Use the AI tool to handle script accuracy mechanically, then do a fast human listen for the
        performance and technical dimensions. You'll spend far less time on both.
      </P>

      <div className="bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8 mt-12 text-center">
        <p className="text-white font-bold text-xl mb-2">Try it on your next chapter</p>
        <p className="text-gray-300 text-sm mb-5 max-w-md mx-auto">
          Upload a recording and script to{' '}
          <Link to="/" className="text-blue-400 hover:text-blue-300">
            SoundProof
          </Link>
          . See every error flagged with timestamps in under 30 seconds.
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
          <Link to="/blog/audiobook-qc-checklist" className="text-blue-400 hover:text-blue-300 text-sm underline underline-offset-2">
            The Complete Audiobook QC Checklist →
          </Link>
        </div>
      </div>
    </article>
  );
}
