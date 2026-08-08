import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export function QrScanner({ onDecode }: { onDecode: (payload: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPayloadRef = useRef<{ value: string; at: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let frameHandle: number;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        tick();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not access the camera.");
      }
    }

    function tick() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code?.data) {
            const last = lastPayloadRef.current;
            const now = Date.now();
            if (!last || last.value !== code.data || now - last.at > 3000) {
              lastPayloadRef.current = { value: code.data, at: now };
              onDecode(code.data);
            }
          }
        }
      }
      frameHandle = requestAnimationFrame(tick);
    }

    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frameHandle);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="scan-video-wrap">
      <video ref={videoRef} muted playsInline />
      <canvas ref={canvasRef} style={{ display: "none" }} />
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}
