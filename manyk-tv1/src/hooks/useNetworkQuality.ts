import { useState, useEffect } from 'react';

export type VideoQuality = '480p' | '720p' | '1080p';

export function useNetworkQuality(): VideoQuality {
  const [quality, setQuality] = useState<VideoQuality>('1080p');

  useEffect(() => {
    const updateQuality = () => {
      // Use the Network Information API if available
      const connection = 
        (navigator as any).connection || 
        (navigator as any).mozConnection || 
        (navigator as any).webkitConnection;
      
      if (connection) {
        const downlink = connection.downlink; // Estimated bandwidth in Mbps
        const effectiveType = connection.effectiveType; // '2g', '3g', '4g'

        if (effectiveType === '4g' && downlink >= 5) {
          setQuality('1080p');
        } else if ((effectiveType === '4g' && downlink >= 2) || downlink >= 2) {
          setQuality('720p');
        } else {
          setQuality('480p');
        }
      }
    };

    // Initial check
    updateQuality();

    // Listen for network changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateQuality);
      return () => connection.removeEventListener('change', updateQuality);
    }
  }, []);

  return quality;
}
