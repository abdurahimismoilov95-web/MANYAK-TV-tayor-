import { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Hls from 'hls.js';

export default function PlayerPage() {
  const { id } = useParams();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const videoUrl = `http://localhost:3002/streams/${id}/master.m3u8`;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(videoUrl);
      hls.attachMedia(videoRef.current);
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      videoRef.current.src = videoUrl;
    }
  }, [id]);

  return (
    <div className="h-screen bg-black">
      <video
        ref={videoRef}
        controls
        autoPlay
        className="w-full h-full"
        playsInline
      />
    </div>
  );
}
