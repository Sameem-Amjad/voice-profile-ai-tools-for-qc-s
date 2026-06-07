import React, { useState } from 'react';
import { CheckCircle, Send, Mail } from 'lucide-react';
import clsx from 'clsx';
import { SEO } from '../seo/SEO';
import { submitContact } from '../../services/api';
import { Navbar } from '../ui/Navbar';

const SUBJECTS = [
  { value: '', label: 'Select a subject…' },
  { value: 'General Question', label: 'General Question' },
  { value: 'Billing Issue', label: 'Billing Issue' },
  { value: 'Technical Problem', label: 'Technical Problem' },
  { value: 'Feature Request', label: 'Feature Request' },
  { value: 'Other', label: 'Other' },
];

const inputClass =
  'w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm';

export const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError('Please fill in all fields.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitContact(form);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <SEO
        title="Contact Us"
        description="Have a question, billing issue, or feature request? Contact the SoundProof team. We typically reply within 24 hours."
        canonical="/contact"
      />
      <Navbar variant="contact" />

      <main className="max-w-2xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 mb-5">
            <Mail size={28} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Get in Touch</h1>
          <p className="text-gray-400 text-lg leading-relaxed">
            Have a question, issue, or idea? We'd love to hear from you.
            Our team typically replies within 24 hours.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          {success ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <CheckCircle size={48} className="text-green-500" />
              <h2 className="text-xl font-bold text-gray-900">Message sent!</h2>
              <p className="text-gray-500">We'll reply within 24 hours.</p>
              <button
                onClick={() => { setSuccess(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Jane Smith"
                    className={inputClass}
                    required
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="jane@studio.com"
                    className={inputClass}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subject
                </label>
                <select
                  id="contact-subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className={clsx(inputClass, 'bg-white appearance-none')}
                  required
                >
                  {SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value} disabled={s.value === ''}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind…"
                  rows={5}
                  className={clsx(inputClass, 'resize-none')}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={clsx(
                  'w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-all',
                  submitting
                    ? 'bg-blue-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-100 shadow-lg shadow-blue-500/20'
                )}
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
