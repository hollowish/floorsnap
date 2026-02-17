const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.8;

/**
 * Capture a video frame, resize to max 1200px longest edge, and return as JPEG blob.
 *
 * @param {HTMLVideoElement} videoElement — must be playing
 * @returns {Promise<{ blob: Blob, width: number, height: number, localUri: string }>}
 */
export async function processPhoto(videoElement) {
  const vw = videoElement.videoWidth;
  const vh = videoElement.videoHeight;

  // Scale down if either dimension exceeds MAX_DIMENSION
  let width = vw;
  let height = vh;
  if (vw > MAX_DIMENSION || vh > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(vw, vh);
    width = Math.round(vw * scale);
    height = Math.round(vh * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );

  const localUri = URL.createObjectURL(blob);

  return { blob, width, height, localUri };
}
