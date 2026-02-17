import ActionButton from '../ui/ActionButton';

const DIRECTION_LABELS = {
  north: 'North Wall',
  east: 'East Wall',
  south: 'South Wall',
  west: 'West Wall',
};

/**
 * PhotoPreview — Full-screen review of a captured photo.
 * User can accept or retake.
 */
export default function PhotoPreview({
  localUri,
  direction,
  compassHeading,
  onUsePhoto,
  onRetake,
}) {
  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Photo */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={localUri}
          alt={`${direction} wall capture`}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Top gradient overlay */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/60 to-transparent" />
        <div className="absolute top-0 inset-x-0 px-4 pt-4 flex items-center justify-between">
          <span className="text-white font-semibold text-lg">
            {DIRECTION_LABELS[direction] || direction}
          </span>
          {compassHeading !== null && compassHeading !== undefined && (
            <span className="font-mono text-sm text-white/80 bg-black/40 rounded-full px-2.5 py-1">
              {compassHeading}°
            </span>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex-shrink-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-8 pb-safe px-4 pb-6">
        <div className="flex flex-col gap-3 max-w-sm mx-auto">
          <ActionButton
            label="Use Photo"
            variant="primary"
            onClick={onUsePhoto}
          />
          <ActionButton
            label="Retake"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10"
            onClick={onRetake}
          />
        </div>
      </div>
    </div>
  );
}
