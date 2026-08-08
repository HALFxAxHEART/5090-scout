/** Samples up to `maxFrames` evenly-spaced frames from a video Blob as downscaled JPEGs. */
export async function extractFrames(
  blob: Blob,
  maxFrames = 20,
): Promise<{ base64: string; timestampSeconds: number }[]> {
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.src = url;
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not read the recorded clip."));
    });

    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Recorded clip has no readable duration.");
    }

    const frameCount = Math.max(1, Math.min(maxFrames, Math.ceil(duration / 5)));
    const canvas = document.createElement("canvas");
    const maxWidth = 640;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported.");

    const frames: { base64: string; timestampSeconds: number }[] = [];
    for (let i = 0; i < frameCount; i++) {
      const t = frameCount === 1 ? duration / 2 : (duration * i) / (frameCount - 1);
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
      frames.push({ base64: dataUrl.split(",")[1] ?? "", timestampSeconds: t });
    }
    return frames;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      resolve();
    };
    video.addEventListener("seeked", onSeeked);
    video.currentTime = time;
  });
}
