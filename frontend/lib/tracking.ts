import { useEffect, useRef } from 'react';
import { sendUserEventAction } from '../app/actions/events';

export const useProductTracking = (userId: string | undefined, productId: string | undefined) => {
  const mountTime = useRef(Date.now());
  const maxScroll = useRef(0);

  useEffect(() => {
    if (!userId || !productId) return;

    mountTime.current = Date.now();
    maxScroll.current = 0;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.scrollY;
      const percent = scrollHeight > 0 ? Math.min(100, Math.round((scrolled / scrollHeight) * 100)) : 100;
      if (percent > maxScroll.current) {
        maxScroll.current = percent;
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      const dwellTimeSeconds = Math.round((Date.now() - mountTime.current) / 1000);
      const isBounce = dwellTimeSeconds < 3; // Left in < 3s

      // Get browser info
      const getBrowser = () => {
        if (typeof window === 'undefined') return 'unknown';
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Other';
      };

      console.log('User navigated away! Sending product_view event to API route...');

      // Send the product_view event using a resilient fetch (keepalive: true)
      // This ensures the browser doesn't cancel the request when the user navigates away
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          userId,
          productId,
          action: 'product_view',
          metadata: {
            dwellTimeSeconds,
            scrollDepthPercent: maxScroll.current,
            isBounce,
            device: window.innerWidth < 768 ? 'mobile' : 'desktop',
            browser: getBrowser(),
            location: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      }).catch(console.error);
    };
  }, [userId, productId]);
};
