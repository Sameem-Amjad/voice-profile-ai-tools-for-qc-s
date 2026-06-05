import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../ui/Navbar';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
    <div className="text-gray-400 leading-relaxed space-y-3">{children}</div>
  </section>
);

export const TermsOfService = () => {
  const EFFECTIVE_DATE = 'June 5, 2025';
  const COMPANY = 'SoundProof';
  const CONTACT_EMAIL = 'legal@soundproofapp.com';
  const WEBSITE = 'https://soundproofapp.com';

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <Navbar variant="landing" />
      <div className="max-w-3xl mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-12">Effective Date: {EFFECTIVE_DATE}</p>

        <p className="text-gray-400 leading-relaxed mb-10">
          Please read these Terms of Service ("Terms") carefully before using {WEBSITE} or any
          service provided by {COMPANY} ("we," "our," or "us"). By creating an account or using
          the Service, you ("User," "you") agree to be bound by these Terms and our{' '}
          <Link to="/privacy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>,
          which is incorporated by reference. If you do not agree, do not use the Service.
        </p>

        <Section title="1. Description of Service">
          <p>{COMPANY} provides an AI-powered audio quality-control platform that allows users to
          upload audio recordings and reference scripts to generate word-level accuracy comparisons
          with timestamps (the "Service"). The Service uses OpenAI's Whisper API for speech
          recognition and a sequence-alignment algorithm to identify deviations between spoken
          audio and written scripts.</p>
          <p>The Service is intended for professional use by voiceover artists, audiobook producers,
          narrators, and related content creators.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least 18 years old (or the age of legal majority in your jurisdiction,
          whichever is greater) and capable of forming a legally binding contract to use the
          Service. By using the Service, you represent that you meet these requirements.</p>
          <p>The Service is not available to persons previously banned by {COMPANY} or to entities
          located in jurisdictions where such services are prohibited by applicable law.</p>
        </Section>

        <Section title="3. Accounts and Registration">
          <p>You must create an account to access the Service. You agree to:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Provide accurate, current, and complete registration information.</li>
            <li>Maintain the confidentiality of your login credentials.</li>
            <li>Notify us immediately of any unauthorized account use.</li>
            <li>Accept responsibility for all activity that occurs under your account.</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these Terms, engage
          in fraudulent activity, or cause harm to other users or to the Service.</p>
        </Section>

        <Section title="4. Subscriptions and Billing">
          <p><strong className="text-gray-200">Plans.</strong> The Service is offered under a
          free trial and paid subscription tiers. Current pricing and plan details are described
          on the <Link to="/pricing" className="text-blue-400 hover:text-blue-300">Pricing</Link>{' '}
          page, which may be updated from time to time.</p>

          <p><strong className="text-gray-200">Free trial.</strong> We may offer a limited free
          trial. At the end of the trial period, your subscription will automatically convert to
          a paid plan unless you cancel before the trial expires.</p>

          <p><strong className="text-gray-200">Recurring billing.</strong> Paid subscriptions are
          billed on a recurring monthly or annual basis. You authorize us (via Stripe) to charge
          your payment method on the billing date for each period until you cancel.</p>

          <p><strong className="text-gray-200">Cancellation.</strong> You may cancel your
          subscription at any time from your account settings. Cancellation takes effect at the
          end of the current billing period. You will retain access to paid features until that
          date. We do not provide pro-rated refunds for partial periods unless required by
          applicable law.</p>

          <p><strong className="text-gray-200">Failed payments.</strong> If a payment fails, we
          will notify you and may suspend access to paid features. After repeated failures we may
          terminate the subscription.</p>

          <p><strong className="text-gray-200">Price changes.</strong> We reserve the right to
          change subscription prices. We will give at least 30 days' notice before any price
          increase takes effect, and the change will not apply until your next renewal period.</p>

          <p><strong className="text-gray-200">Taxes.</strong> Prices are exclusive of applicable
          taxes. You are responsible for all taxes, duties, and levies imposed by your jurisdiction
          on your subscription.</p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree to use the Service only for lawful purposes. You must not:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Upload audio or scripts that contain illegal content, including material that
                violates intellectual property rights you do not own or have a license to use.</li>
            <li>Attempt to reverse-engineer, decompile, disassemble, or derive source code
                from the Service.</li>
            <li>Use automated tools, bots, or scrapers to access the Service beyond normal use.</li>
            <li>Circumvent, disable, or interfere with security features or usage limits.</li>
            <li>Use the Service to process audio without the consent of all persons whose voice
                is recorded, where such consent is required by applicable law.</li>
            <li>Impersonate another person or entity or misrepresent your affiliation.</li>
            <li>Upload malware, viruses, or any code intended to harm our systems.</li>
            <li>Use the Service in any manner that could damage, overload, or impair the
                infrastructure supporting the Service.</li>
          </ul>
        </Section>

        <Section title="6. Intellectual Property">
          <p><strong className="text-gray-200">Your content.</strong> You retain all intellectual
          property rights in the audio files and scripts you upload. By using the Service, you
          grant {COMPANY} a limited, non-exclusive, royalty-free license to process your content
          solely to provide the Service to you during your session. We acquire no ownership rights
          in your content.</p>

          <p><strong className="text-gray-200">Our IP.</strong> All software, algorithms,
          trademarks, logos, user interfaces, and other materials comprising the Service are owned
          by or licensed to {COMPANY}. Nothing in these Terms transfers any ownership of our
          intellectual property to you.</p>

          <p><strong className="text-gray-200">Feedback.</strong> If you submit suggestions,
          bug reports, or ideas about the Service, you grant us an irrevocable, worldwide,
          royalty-free right to use them without obligation or compensation to you.</p>
        </Section>

        <Section title="7. AI Accuracy Disclaimer">
          <p>The Service uses artificial intelligence and machine learning (OpenAI Whisper) to
          transcribe audio. <strong className="text-gray-200">AI transcription is not 100%
          accurate.</strong> Results may contain errors, omissions, or misidentifications,
          particularly with:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Accents, dialects, or non-standard pronunciation.</li>
            <li>Technical jargon, proper nouns, or uncommon vocabulary.</li>
            <li>Background noise, poor audio quality, or overlapping speech.</li>
            <li>Languages or scripts other than standard English.</li>
          </ul>
          <p><strong className="text-gray-200">You are solely responsible for reviewing and
          verifying the accuracy of all output</strong> before relying on it for any professional,
          commercial, legal, medical, or other purpose. {COMPANY} is not liable for any decisions
          made in reliance on Service output.</p>
        </Section>

        <Section title="8. No Warranty">
          <p className="uppercase text-sm font-medium text-gray-300">THE SERVICE IS PROVIDED "AS IS"
          AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST
          EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY.toUpperCase()} DISCLAIMS ALL WARRANTIES,
          INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTIES ARISING OUT OF COURSE OF DEALING,
          USAGE, OR TRADE PRACTICE.</p>
          <p className="uppercase text-sm font-medium text-gray-300">WE DO NOT WARRANT THAT THE
          SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE FROM VIRUSES OR OTHER
          HARMFUL COMPONENTS, OR THAT DEFECTS WILL BE CORRECTED.</p>
        </Section>

        <Section title="9. Limitation of Liability">
          <p className="uppercase text-sm font-medium text-gray-300">TO THE MAXIMUM EXTENT
          PERMITTED BY APPLICABLE LAW, IN NO EVENT WILL {COMPANY.toUpperCase()}, ITS OFFICERS,
          DIRECTORS, EMPLOYEES, AGENTS, OR SUPPLIERS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, PUNITIVE, OR EXEMPLARY DAMAGES — INCLUDING LOSS OF PROFITS,
          DATA, BUSINESS, OR GOODWILL — ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR
          INABILITY TO USE THE SERVICE, EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH
          DAMAGES.</p>
          <p className="uppercase text-sm font-medium text-gray-300">OUR TOTAL CUMULATIVE
          LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE SERVICE
          WILL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING
          THE CLAIM, OR (B) USD $100.</p>
          <p>Some jurisdictions do not allow certain limitations of liability. In those
          jurisdictions, our liability will be limited to the minimum extent permitted by law.</p>
        </Section>

        <Section title="10. Indemnification">
          <p>You agree to defend, indemnify, and hold harmless {COMPANY} and its affiliates,
          officers, directors, employees, and agents from and against any claims, liabilities,
          damages, losses, and expenses (including reasonable legal fees) arising out of or in
          any way connected with:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Your use of the Service or violation of these Terms.</li>
            <li>Your content (audio, scripts, or other materials) uploaded to the Service.</li>
            <li>Your infringement of any intellectual property or other rights of any person or
                entity.</li>
          </ul>
        </Section>

        <Section title="11. Third-Party Services">
          <p>The Service relies on third-party providers (Clerk, Stripe, OpenAI) whose own terms
          and policies apply to your use of those components. {COMPANY} is not responsible for
          the performance, availability, or conduct of third-party services. Links to third-party
          sites are provided for convenience only; we do not endorse their content.</p>
        </Section>

        <Section title="12. Confidentiality of Uploaded Content">
          <p>We treat the audio files and scripts you upload as confidential business material.
          We will not access, review, or disclose your content except as necessary to provide
          the Service, to comply with legal obligations, or to investigate violations of these
          Terms. We do not use your audio or script content to train AI models.</p>
        </Section>

        <Section title="13. Termination">
          <p><strong className="text-gray-200">By you.</strong> You may close your account at
          any time through account settings or by contacting us. Closure cancels any active
          subscription at the end of the current billing period.</p>

          <p><strong className="text-gray-200">By us.</strong> We may suspend or terminate
          your access immediately if you breach these Terms, engage in fraudulent activity, or
          if required to do so by law. Upon termination, your right to use the Service ceases
          and we may delete your account data in accordance with our Privacy Policy.</p>

          <p>Sections 6, 7, 8, 9, 10, and 15 survive termination.</p>
        </Section>

        <Section title="14. Changes to the Terms">
          <p>We may modify these Terms at any time. We will notify you of material changes by
          email and by updating the "Effective Date" above. Your continued use of the Service
          after the effective date constitutes your acceptance of the revised Terms. If you
          disagree with the changes, you must stop using the Service and close your account.</p>
        </Section>

        <Section title="15. Governing Law and Dispute Resolution">
          <p>These Terms are governed by the laws of the State of Delaware, USA, without regard
          to its conflict-of-law provisions.</p>

          <p><strong className="text-gray-200">Informal resolution.</strong> Before filing any
          formal claim, you agree to contact us at {CONTACT_EMAIL} and attempt to resolve the
          dispute informally for at least 30 days.</p>

          <p><strong className="text-gray-200">Binding arbitration.</strong> If informal
          resolution fails, all disputes will be resolved by binding individual arbitration
          under the AAA Consumer Arbitration Rules. <strong className="text-gray-200">You waive
          any right to participate in a class action, class arbitration, or representative
          proceeding.</strong></p>

          <p><strong className="text-gray-200">Exception.</strong> Either party may seek
          emergency injunctive relief in a court of competent jurisdiction to prevent irreparable
          harm pending the outcome of arbitration.</p>
        </Section>

        <Section title="16. Miscellaneous">
          <p><strong className="text-gray-200">Entire agreement.</strong> These Terms and the
          Privacy Policy constitute the entire agreement between you and {COMPANY} regarding
          the Service and supersede all prior agreements.</p>

          <p><strong className="text-gray-200">Severability.</strong> If any provision is found
          unenforceable, the remaining provisions remain in full force.</p>

          <p><strong className="text-gray-200">Waiver.</strong> Our failure to enforce any right
          or provision is not a waiver of that right or provision.</p>

          <p><strong className="text-gray-200">Assignment.</strong> You may not assign these Terms
          without our prior written consent. We may assign these Terms in connection with a
          merger, acquisition, or sale of assets.</p>

          <p><strong className="text-gray-200">Force majeure.</strong> We are not liable for
          delays or failures caused by events outside our reasonable control, including internet
          outages, natural disasters, or third-party service disruptions.</p>
        </Section>

        <Section title="17. Contact">
          <p>For questions about these Terms:</p>
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
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
        </div>
      </footer>
    </div>
  );
};
