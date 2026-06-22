import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../ui/Navbar';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
    <div className="text-gray-400 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const PrivacyPolicy = () => {
  const EFFECTIVE_DATE = 'June 5, 2025';
  const COMPANY = 'SoundProof';
  const CONTACT_EMAIL = 'privacy@soundproofapp.com';
  const WEBSITE = 'https://soundproofapp.com';

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navbar variant="landing" />
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-12">Effective Date: {EFFECTIVE_DATE}</p>

        <p className="text-gray-400 leading-relaxed mb-10">
          {COMPANY} ("we," "our," or "us") operates {WEBSITE} and provides an AI-powered audio
          quality-control service (the "Service"). This Privacy Policy explains what personal data we
          collect, why we collect it, how we use and protect it, and your rights regarding that data.
          By using the Service you agree to this Policy.
        </p>

        <Section title="1. Information We Collect">
          <p><strong className="text-gray-200">Account data</strong> — When you register, our
          authentication provider (Clerk) collects your email address, name, and, if you use Google
          OAuth, your Google profile information. We receive only the data Clerk passes to us: your
          user ID, email, and display name.</p>

          <p><strong className="text-gray-200">Payment data</strong> — Subscription billing is
          handled entirely by Stripe. We never see, store, or process your credit-card number or
          full banking details. We receive from Stripe only your subscription status, plan, and
          billing history metadata needed to manage your account.</p>

          <p><strong className="text-gray-200">Audio and script content</strong> — When you use the
          Service you upload an audio file and a reference script. These files are processed in
          memory on our servers to generate a word-level comparison. <strong className="text-gray-200">
          Audio files and scripts are not stored after your session ends.</strong> We do not retain,
          index, or share your audio or script content.</p>

          <p><strong className="text-gray-200">Shared result links</strong> — If you choose to
          generate a share link (/r/…), we store a token and the computed diff result (word
          timestamps and error annotations) long enough to serve that link. No raw audio or script
          text is retained in the share data.</p>

          <p><strong className="text-gray-200">Usage data</strong> — We log the number of jobs you
          process in a billing period so we can enforce plan limits. We also collect standard server
          logs (IP address, user-agent, timestamp, HTTP status) for security monitoring and
          debugging. These logs are retained for up to 90 days.</p>

          <p><strong className="text-gray-200">Contact and feedback</strong> — If you contact us via
          the contact form or submit feedback through the app, we store your message, email, and any
          information you voluntarily include.</p>

          <p><strong className="text-gray-200">Cookies and similar technologies</strong> — We use
          essential cookies set by Clerk for authentication session management. We do not use
          third-party advertising cookies or build behavioral profiles for ad targeting.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc list-inside space-y-2">
            <li>To provide, operate, and improve the Service.</li>
            <li>To authenticate you and manage your subscription and plan limits.</li>
            <li>To process payments and handle billing events (via Stripe webhooks).</li>
            <li>To transcribe your audio and compare it against your script using OpenAI's
                Whisper API. Your audio is sent to OpenAI's servers for transcription under
                OpenAI's API Terms and Privacy Policy. We do not opt in to OpenAI's data
                training on API inputs.</li>
            <li>To respond to support requests and feedback you submit.</li>
            <li>To detect, prevent, and address fraud, abuse, and security incidents.</li>
            <li>To comply with legal obligations.</li>
          </ul>
          <p>We do not sell your personal data. We do not use your audio or script content for any
          purpose other than providing the transcription and diff service during your session.</p>
        </Section>

        <Section title="3. Third-Party Service Providers">
          <p>We share data with the following sub-processors only to the extent necessary to
          provide the Service:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm mt-3 border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-300">
                  <th className="text-left py-2 pr-4">Provider</th>
                  <th className="text-left py-2 pr-4">Purpose</th>
                  <th className="text-left py-2">Data shared</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr><td className="py-2 pr-4">Clerk</td><td className="py-2 pr-4">Authentication</td><td className="py-2">Email, name, OAuth tokens</td></tr>
                <tr><td className="py-2 pr-4">Stripe</td><td className="py-2 pr-4">Payments</td><td className="py-2">Email, billing metadata</td></tr>
                <tr><td className="py-2 pr-4">OpenAI</td><td className="py-2 pr-4">Audio transcription</td><td className="py-2">Audio file content (session only)</td></tr>
                <tr><td className="py-2 pr-4">Render / hosting</td><td className="py-2 pr-4">Infrastructure</td><td className="py-2">Server logs, encrypted at rest</td></tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">Each provider is contractually bound to use your data only for the
          services we engage them to provide and to maintain appropriate security measures.</p>
        </Section>

        <Section title="4. Data Retention">
          <p>We retain data only as long as necessary:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-gray-200">Audio & script files</strong> — deleted immediately
                after job completion or session expiry (typically within minutes).</li>
            <li><strong className="text-gray-200">Account data</strong> — retained while your
                account is active and for 30 days after deletion to allow recovery. After 30 days,
                account data is permanently purged.</li>
            <li><strong className="text-gray-200">Billing records</strong> — retained for 7 years
                as required by applicable tax and financial regulations.</li>
            <li><strong className="text-gray-200">Server logs</strong> — retained for up to 90
                days, then automatically deleted.</li>
            <li><strong className="text-gray-200">Contact/feedback messages</strong> — retained for
                up to 2 years to assist with support continuity.</li>
          </ul>
        </Section>

        <Section title="5. Data Security">
          <p>We implement industry-standard technical and organizational measures to protect your
          data, including:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>TLS encryption for all data in transit.</li>
            <li>Encryption at rest for databases and file storage.</li>
            <li>Access controls — production data is accessible only to authorized personnel on
                a need-to-know basis.</li>
            <li>Rate limiting and abuse detection on all API endpoints.</li>
            <li>Audio files are processed in isolated job workers and never written to long-term
                storage.</li>
          </ul>
          <p>No method of transmission over the internet is 100% secure. While we strive to use
          commercially acceptable means to protect your data, we cannot guarantee absolute security.</p>
        </Section>

        <Section title="6. Your Rights">
          <p>Depending on your jurisdiction, you may have the following rights:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-gray-200">Access</strong> — request a copy of the personal
                data we hold about you.</li>
            <li><strong className="text-gray-200">Rectification</strong> — request correction of
                inaccurate personal data.</li>
            <li><strong className="text-gray-200">Deletion ("right to be forgotten")</strong> —
                request deletion of your account and associated personal data.</li>
            <li><strong className="text-gray-200">Portability</strong> — request your data in a
                structured, machine-readable format.</li>
            <li><strong className="text-gray-200">Objection / restriction</strong> — object to or
                request restriction of certain processing.</li>
            <li><strong className="text-gray-200">Withdraw consent</strong> — where processing is
                based on consent, withdraw it at any time.</li>
          </ul>
          <p>To exercise any of these rights, email us at <a href={`mailto:${CONTACT_EMAIL}`}
          className="text-blue-400 hover:text-blue-300">{CONTACT_EMAIL}</a>. We will respond
          within 30 days.</p>
        </Section>

        <Section title="7. GDPR (European Users)">
          <p>If you are located in the European Economic Area (EEA) or United Kingdom, our lawful
          bases for processing are:</p>
          <ul className="list-disc list-inside space-y-2">
            <li><strong className="text-gray-200">Contract performance</strong> — to provide the
                Service you signed up for.</li>
            <li><strong className="text-gray-200">Legitimate interests</strong> — to keep the
                Service secure and to improve it.</li>
            <li><strong className="text-gray-200">Legal obligation</strong> — to comply with
                applicable law, including financial record-keeping requirements.</li>
          </ul>
          <p>When we transfer data outside the EEA (e.g. to OpenAI or Stripe in the US), we rely
          on Standard Contractual Clauses or the recipient's participation in an approved
          adequacy framework.</p>
        </Section>

        <Section title="8. CCPA (California Users)">
          <p>California residents have the right to know what personal information we collect,
          the right to delete it, and the right to opt out of its sale. We do not sell personal
          information as defined by the CCPA. To submit a request, contact us at the email
          address below. We will not discriminate against you for exercising any CCPA rights.</p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>The Service is not directed at children under 13 (or under 16 in the EEA). We do not
          knowingly collect personal data from children. If you believe a child has provided us
          with personal data, contact us immediately and we will delete it.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. Material changes will be
          communicated by updating the "Effective Date" at the top of this page and, where
          appropriate, by email notification to registered users. Continued use of the Service
          after changes constitutes your acceptance of the updated Policy.</p>
        </Section>

        <Section title="11. Contact Us">
          <p>For privacy-related inquiries or to exercise your rights:</p>
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
          <Link to="/refunds" className="hover:text-white transition-colors">Refund Policy</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
};
