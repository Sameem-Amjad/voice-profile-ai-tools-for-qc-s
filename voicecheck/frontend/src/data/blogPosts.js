export const BLOG_POSTS = [
  {
    slug: 'audiobook-qc',
    title: 'The Best Audiobook Quality Control Software in 2025',
    description:
      'A complete guide to audiobook quality control software — what it does, why studios use it, and how AI-powered word-level diffing compares to manual review.',
    date: '2025-05-20',
    dateDisplay: 'May 20, 2025',
    readTime: '8 min read',
    category: 'Tools & Workflow',
    keywords: [
      'audiobook quality control software',
      'audiobook QC software',
      'voiceover quality check',
      'audiobook production tools',
    ],
  },
  {
    slug: 'catch-voiceover-errors',
    title: 'How to Catch Voiceover Errors Before Delivery',
    description:
      'A practical guide for narrators and studios on catching substitutions, omissions, and additions in voiceover recordings before they reach the client.',
    date: '2025-05-18',
    dateDisplay: 'May 18, 2025',
    readTime: '6 min read',
    category: 'Production Tips',
    keywords: [
      'catch voiceover errors',
      'voiceover quality control',
      'voiceover proofreading',
      'voiceover error detection',
    ],
  },
  {
    slug: 'audiobook-qc-checklist',
    title: 'The Complete Audiobook QC Checklist for Narrators and Studios',
    description:
      'A step-by-step audiobook QC checklist covering script accuracy, audio quality, and delivery standards — for indie narrators and production studios alike.',
    date: '2025-05-15',
    dateDisplay: 'May 15, 2025',
    readTime: '7 min read',
    category: 'Production Tips',
    keywords: [
      'audiobook QC checklist',
      'audiobook quality checklist',
      'audiobook narration checklist',
      'audiobook production checklist',
    ],
  },
];

export const getPost = (slug) => BLOG_POSTS.find((p) => p.slug === slug) ?? null;
