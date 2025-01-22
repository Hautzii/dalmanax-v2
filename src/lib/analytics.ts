import { PUBLIC_WORKER_URL } from '$env/static/public';

const sessionId = Math.random().toString(36).substring(2);
let visitStartTime = Date.now();

export function initAnalytics() {
  const trackVisitStart = async () => {
    try {
      await fetch(PUBLIC_WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, eventType: 'visitStart' })
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  const trackVisitEnd = async () => {
    try {
      const duration = Math.floor((Date.now() - visitStartTime) / 1000);
      await fetch(PUBLIC_WORKER_URL, {  
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, eventType: 'visitEnd', duration })
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  };

  trackVisitStart();
  window.addEventListener('beforeunload', trackVisitEnd);
  window.addEventListener('pagehide', trackVisitEnd);
  setInterval(trackVisitEnd, 5 * 60 * 1000);
}