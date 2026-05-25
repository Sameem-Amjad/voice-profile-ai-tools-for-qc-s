import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://voicecheck.app';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;
const SITE_NAME = 'SoundProof';

export const SEO = ({
  title,
  description,
  canonical,
  ogType = 'website',
  ogImage = DEFAULT_IMAGE,
  noIndex = false,
  jsonLd,
}) => {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} — AI Voiceover QC for Audiobook Studios`;

  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={SITE_NAME} />

      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};
