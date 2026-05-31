import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Navbar } from '../ui/Navbar';
import { SEO } from '../seo/SEO';
import { BLOG_POSTS } from '../../data/blogPosts';
import { AdBanner } from '../ui/AdBanner';

const BLOG_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'SoundProof Blog',
  description: 'Guides and tips for audiobook narrators, producers, and studios on voiceover quality control, production workflows, and script accuracy.',
  url: 'https://soundproof-voice-check.vercel.app/blog',
  publisher: {
    '@type': 'Organization',
    name: 'SoundProof',
    url: 'https://soundproof-voice-check.vercel.app',
  },
};

const CATEGORY_COLORS = {
  'Tools & Workflow': 'bg-blue-500/20 text-blue-300',
  'Production Tips': 'bg-violet-500/20 text-violet-300',
};

export function BlogIndex() {
  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <SEO
        title="Blog — Audiobook Production & Voiceover QC"
        description="Guides and tips for audiobook narrators, producers, and studios. Learn how to catch voiceover errors, improve your QC workflow, and ship cleaner takes."
        canonical="/blog"
        jsonLd={BLOG_JSON_LD}
      />
      <Navbar variant="contact" />

      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="mb-12">
          <span className="text-xs uppercase tracking-widest text-blue-400 font-semibold">Blog</span>
          <h1 className="text-4xl font-bold mt-2 mb-3">Audiobook Production & Voiceover QC</h1>
          <p className="text-gray-400 text-lg">
            Guides for narrators, producers, and studios on catching errors faster and shipping
            cleaner audio.
          </p>
        </div>

        <div className="space-y-6">
          {BLOG_POSTS.map((post, i) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group block bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-blue-500/30 rounded-2xl p-7 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[post.category] ?? 'bg-gray-500/20 text-gray-300'}`}>
                      {post.category}
                    </span>
                    {i === 0 && (
                      <span className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors mb-2 leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {post.dateDisplay}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      {post.readTime}
                    </span>
                  </div>
                </div>
                <ArrowRight
                  size={20}
                  className="text-gray-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0 mt-1"
                />
              </div>
            </Link>
          ))}
        </div>

        {/* Ad — between posts list and CTA */}
        <AdBanner slot="blogBanner" />

        <div className="mt-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-8 text-center">
          <p className="text-white font-bold text-lg mb-2">Ready to speed up your QC workflow?</p>
          <p className="text-gray-400 text-sm mb-5">
            Upload a recording and script. SoundProof flags every error with timestamps in under 30
            seconds.
          </p>
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors text-sm"
          >
            Start free trial →
          </Link>
        </div>
      </main>

      <footer className="border-t border-white/[0.07] mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} SoundProof.</p>
          <div className="flex gap-5">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
