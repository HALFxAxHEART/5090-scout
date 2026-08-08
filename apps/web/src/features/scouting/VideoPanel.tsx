import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface VideoPanelHandle {
  /** Current playback position in seconds, or null if there's no video loaded / player ready. */
  getCurrentTime(): number | null;
}

interface YouTubePlayer {
  getCurrentTime(): number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: { videoId: string; events?: { onReady?: () => void } },
      ) => YouTubePlayer;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function extractYouTubeId(url: string): string | null {
  const patterns = [/youtu\.be\/([\w-]{11})/, /[?&]v=([\w-]{11})/, /youtube\.com\/embed\/([\w-]{11})/];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

let youtubeApiPromise: Promise<void> | null = null;
function loadYouTubeApi(): Promise<void> {
  if (window.YT) return Promise.resolve();
  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      window.onYouTubeIframeAPIReady = () => resolve();
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return youtubeApiPromise;
}

/**
 * Embeds the match's video (YouTube webcast, or a direct file URL) next to the scoring
 * form so a scout can tap along while watching instead of relying on memory. Exposes
 * getCurrentTime() so each tap can be logged with a video timestamp.
 */
export const VideoPanel = forwardRef<VideoPanelHandle, { videoUrl: string | null }>(function VideoPanel(
  { videoUrl },
  ref,
) {
  const youtubeId = videoUrl ? extractYouTubeId(videoUrl) : null;
  const playerRef = useRef<YouTubePlayer | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const containerId = useRef(`yt-player-${Math.random().toString(36).slice(2)}`);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!youtubeId) return;
    let cancelled = false;
    setReady(false);
    loadYouTubeApi().then(() => {
      if (cancelled || !window.YT) return;
      playerRef.current = new window.YT.Player(containerId.current, {
        videoId: youtubeId,
        events: { onReady: () => setReady(true) },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [youtubeId]);

  useImperativeHandle(ref, () => ({
    getCurrentTime() {
      if (youtubeId) return ready ? (playerRef.current?.getCurrentTime() ?? null) : null;
      return videoElRef.current ? videoElRef.current.currentTime : null;
    },
  }));

  if (!videoUrl) return null;

  return (
    <div className="video-panel">
      {youtubeId ? (
        <div id={containerId.current} />
      ) : (
        <video ref={videoElRef} src={videoUrl} controls playsInline />
      )}
    </div>
  );
});
