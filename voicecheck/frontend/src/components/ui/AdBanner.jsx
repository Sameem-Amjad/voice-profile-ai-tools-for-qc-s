import React, { useEffect, useRef } from 'react';
import {
  AD_NETWORK,
  ADSENSE_PUBLISHER_ID,
  ADSENSE_SLOTS,
  CARBON_SERVE,
  CARBON_PLACEMENT,
} from '../../adConfig';

// ─── Google AdSense Unit ────────────────────────────────────
function AdSenseUnit({ slot, format = 'auto', fullWidth = true }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (_) {}
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle"
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_PUBLISHER_ID}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={fullWidth ? 'true' : 'false'}
    />
  );
}

// ─── Carbon Ads Unit ─────────────────────────────────────────
function CarbonUnit() {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    const script = document.createElement('script');
    script.src = `//cdn.carbonads.com/carbon.js?serve=${CARBON_SERVE}&placement=${CARBON_PLACEMENT}`;
    script.id = '_carbonads_js';
    script.async = true;
    ref.current.appendChild(script);
    return () => {
      if (ref.current) ref.current.innerHTML = '';
    };
  }, []);

  return <div ref={ref} className="carbon-wrap" />;
}

// ─── Public component ─────────────────────────────────────────
// Usage:
//   <AdBanner slot="blogBanner" />          ← AdSense responsive banner
//   <AdBanner slot="blogSidebar" />         ← AdSense box
//   <AdBanner />                             ← Carbon (slot ignored)
export function AdBanner({ slot = 'blogBanner', className = '' }) {
  if (AD_NETWORK === 'none') return null;

  return (
    <div className={`ad-unit my-8 flex justify-center ${className}`} aria-label="Advertisement">
      {AD_NETWORK === 'adsense' && <AdSenseUnit slot={ADSENSE_SLOTS[slot]} />}
      {AD_NETWORK === 'carbon'  && <CarbonUnit />}
    </div>
  );
}
