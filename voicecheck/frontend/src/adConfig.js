// ─────────────────────────────────────────────────────────────
//  Ad Network Configuration
//
//  STEP 1: Choose which network to use by setting AD_NETWORK.
//  STEP 2: Fill in your publisher / serve IDs once approved.
//
//  AD_NETWORK options:
//    'adsense' → Google AdSense  (great reach, easiest to start)
//    'carbon'  → Carbon Ads      (tech audience, single clean ad)
//    'none'    → Ads disabled    (set this while waiting for approval)
// ─────────────────────────────────────────────────────────────

export const AD_NETWORK = 'none'; // change to 'adsense' or 'carbon' once approved

// ── Google AdSense ──────────────────────────────────────────
// Find these in your AdSense dashboard → Ads → By ad unit
export const ADSENSE_PUBLISHER_ID = 'ca-pub-XXXXXXXXXXXXXXXX'; // e.g. ca-pub-1234567890123456
export const ADSENSE_SLOTS = {
  blogBanner:   'XXXXXXXXXX', // Ad slot for blog banner (728×90 or responsive)
  blogSidebar:  'XXXXXXXXXX', // Ad slot for blog sidebar (300×250)
};

// ── Carbon Ads ───────────────────────────────────────────────
// Find these in your Carbon dashboard after approval
export const CARBON_SERVE    = 'XXXXXXXX'; // 8-char code, e.g. CESIEK3N
export const CARBON_PLACEMENT = 'soundproofvoicecheck'; // your site slug on Carbon
