import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../ui/Navbar';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
    <div className="text-gray-400 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const RefundPolicy = () => {
  const EFFECTIVE_DATE = 'June 23, 2026';
  const COMPANY = 'SoundProof';
  const CONTACT_EMAIL = 'billing@soundproofapp.com';
  const REFUND_WINDOW_DAYS = 5;

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navbar variant="landing" />
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">Refund Policy</h1>
        <p className="text-gray-500 text-sm mb-12">Effective Date: {EFFECTIVE_DATE}</p>

        <p className="text-gray-400 leading-relaxed mb-10">
          This Refund Policy explains when {COMPANY} ("we," "our," or "us") will issue a refund for
          a subscription purchase. It forms part of our{' '}
          <Link to="/terms" className="text-blue-400 hover:text-blue-300">Terms of Service</Link> and
          applies to all paid plans. By purchasing a subscription you agree to the terms below.
        </p>

        <Section title="1. Summary">
          <p>
            <strong className="text-gray-200">You may request a full refund within {REFUND_WINDOW_DAYS} days
            of purchase, provided you have not used the plan.</strong> Once any usage has occurred on
            the subscription, the purchase becomes non-refundable.
          </p>
        </Section>

        <Section title="2. Eligibility for a Refund">
          <p>A purchase qualifies for a refund only if <strong className="text-gray-200">both</strong> of
          the following are true:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>The refund request is made within {REFUND_WINDOW_DAYS} calendar days of the date of
                purchase or renewal; and</li>
            <li>No usage has been made on the subscription plan during that period (see "What counts as
                usage" below).</li>
          </ul>
          <p>If both conditions are met, we will refund the full amount paid for that billing period.</p>
        </Section>

        <Section title="3. What Counts as Usage">
          <p>"Usage" means consuming any portion of the plan's features or quota, including but not
          limited to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Uploading or submitting any audio file or script for analysis.</li>
            <li>Running any audio quality-control check or transcription.</li>
            <li>Consuming any credits, minutes, or other metered allowance included in the plan.</li>
            <li>Generating, exporting, or sharing any result produced by the Service under the plan.</li>
          </ul>
          <p>If any of the above has occurred, the subscription is considered used and is{' '}
          <strong className="text-gray-200">non-refundable</strong>, even if the request is made
          within the {REFUND_WINDOW_DAYS}-day window.</p>
        </Section>

        <Section title="4. Non-Refundable Situations">
          <p>Refunds will not be issued where:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>The {REFUND_WINDOW_DAYS}-day refund window has passed.</li>
            <li>The plan has been used, in whole or in part, as described in Section 3.</li>
            <li>The account has been suspended or terminated for a breach of our{' '}
                <Link to="/terms" className="text-blue-400 hover:text-blue-300">Terms of Service</Link>.</li>
            <li>The request relates to dissatisfaction with AI transcription accuracy, which is an
                inherent limitation disclosed in our Terms of Service.</li>
          </ul>
          <p>We do not provide pro-rated refunds for the unused portion of a billing period after a
          cancellation. You will retain access to paid features until the end of the current period.</p>
        </Section>

        <Section title="5. How to Request a Refund">
          <p>To request a refund, email{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:text-blue-300">{CONTACT_EMAIL}</a>{' '}
          within the {REFUND_WINDOW_DAYS}-day window, or use our{' '}
          <Link to="/contact" className="text-blue-400 hover:text-blue-300">contact form</Link>. Please
          include:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>The email address associated with your account.</li>
            <li>The order or invoice reference for the purchase.</li>
            <li>The reason for your request.</li>
          </ul>
        </Section>

        <Section title="6. Processing of Refunds">
          <p>Approved refunds are issued to the original payment method through our payment provider
          (Paddle, our Merchant of Record). Once approved, refunds are typically processed within
          5–10 business days, though the time it takes for the funds to appear depends on your bank
          or card issuer.</p>
          <p>You will receive an email confirmation once a refund has been processed.</p>
        </Section>

        <Section title="7. Statutory Rights">
          <p>Nothing in this policy limits any non-waivable refund or cancellation rights you may have
          under the consumer-protection laws of your jurisdiction. Where applicable law grants you
          broader rights than this policy, those rights prevail.</p>
        </Section>

        <Section title="8. Changes to This Policy">
          <p>We may update this Refund Policy from time to time. Material changes will be reflected by
          updating the "Effective Date" above. The policy in effect at the time of your purchase
          governs that purchase.</p>
        </Section>

        <Section title="9. Contact">
          <p>For questions about refunds or this policy:</p>
          <p className="mt-2">
            <strong className="text-gray-200">{COMPANY}</strong><br />
            Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 hover:text-blue-300">{CONTACT_EMAIL}</a><br />
            Or use our <Link to="/contact" className="text-blue-400 hover:text-blue-300">contact form</Link>.
          </p>
        </Section>
      </div>

      <footer className="border-t border-white/[0.07]">
        <div className="max-w-3xl mx-auto px-6 py-6 flex flex-wrap gap-4 text-xs text-gray-600">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
};
