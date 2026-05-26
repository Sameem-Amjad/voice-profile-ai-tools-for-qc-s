import React, { lazy, Suspense } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Calendar, Clock, ArrowLeft, ChevronRight } from 'lucide-react';
import { Navbar } from '../ui/Navbar';
import { SEO } from '../seo/SEO';
import { getPost, BLOG_POSTS } from '../../data/blogPosts';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const POST_COMPONENTS = {
  'audiobook-qc': lazy(() => import('./posts/AudiobookQC')),
  'catch-voiceover-errors': lazy(() => import('./posts/CatchVoiceoverErrors')),
  'audiobook-qc-checklist': lazy(() => import('./posts/QCChecklist')),
};

const SITE_URL = 'https://soundproof-voice-check.vercel.app';

function buildJsonLd(post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.keywords.join(', '),
    author: { '@type': 'Organization', name: 'SoundProof', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'SoundProof', url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${post.slug}` },
  };
}

export function BlogPost() {
  const { slug } = useParams();
  const post = getPost(slug);
  const PostContent = POST_COMPONENTS[slug];

  if (!post || !PostContent) return <Navigate to="/blog" replace />;

  const otherPosts = BLOG_POSTS.filter((p) => p.slug !== slug).slice(0, 2);

  return (
    <div className="min-h-screen bg-[#050d1a] text-white">
      <SEO
        title={post.title}
        description={post.description}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        jsonLd={buildJsonLd(post)}
      />
      <Navbar variant="contact" />

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-8">
          <Link to="/" className="hover:text-gray-300 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/blog" className="hover:text-gray-300 transition-colors">Blog</Link>
          <ChevronRight size={12} />
          <span className="text-gray-400 truncate max-w-[200px]">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 font-medium">
              {post.category}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold leading-tight mb-5">{post.title}</h1>
          <div className="flex items-center gap-5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {post.dateDisplay}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {post.readTime}
            </span>
          </div>
        </header>

        {/* Post content */}
        <Suspense fallback={<LoadingSpinner />}>
          <PostContent />
        </Suspense>

        {/* Back link */}
        <div className="mt-12 pt-6 border-t border-white/10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            All articles
          </Link>
        </div>

        {/* More posts */}
        {otherPosts.length > 0 && (
          <div className="mt-12">
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wider mb-5">More from the blog</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {otherPosts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 hover:border-blue-500/30 rounded-xl p-5 transition-all"
                >
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                    <Clock size={11} /> {p.readTime}
                  </p>
                  <p className="text-white font-semibold text-sm group-hover:text-blue-300 transition-colors leading-snug">
                    {p.title}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-white/[0.07] mt-16">
        <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>© {new Date().getFullYear()} SoundProof.</p>
          <div className="flex gap-5">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
            <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
