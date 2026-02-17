/**
 * CameraViewfinder — Presentational component wrapping a <video> element.
 * Fills its parent container with a live camera feed.
 */
export default function CameraViewfinder({ videoRef }) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover"
    />
  );
}
