import { useEffect, useRef } from 'react';

export default function AdBanner({ slot, format = 'auto', style = {} }) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (e) {}
  }, []);

  const client = import.meta.env.VITE_ADSENSE_CLIENT;
  if (!client || !slot) return null;

  return (
    <div style={{ textAlign: 'center', margin: '24px 0' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...style }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
