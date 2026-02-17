const CARDINALS = [
  { min: 337.5, max: 360, label: 'N' },
  { min: 0, max: 22.5, label: 'N' },
  { min: 22.5, max: 67.5, label: 'NE' },
  { min: 67.5, max: 112.5, label: 'E' },
  { min: 112.5, max: 157.5, label: 'SE' },
  { min: 157.5, max: 202.5, label: 'S' },
  { min: 202.5, max: 247.5, label: 'SW' },
  { min: 247.5, max: 292.5, label: 'W' },
  { min: 292.5, max: 337.5, label: 'NW' },
];

function getCardinal(deg) {
  for (const c of CARDINALS) {
    if (deg >= c.min && deg < c.max) return c.label;
  }
  return '';
}

/**
 * CompassOverlay — Semi-transparent pill showing compass heading.
 * Renders nothing if compass is unavailable or denied.
 */
export default function CompassOverlay({ heading, isSupported, hasPermission }) {
  if (!isSupported || !hasPermission || heading === null) return null;

  return (
    <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
      <svg className="w-4 h-4 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L12 22M12 2L8 6M12 2L16 6" />
      </svg>
      <span className="font-mono text-sm text-white tracking-wide">
        {heading}° {getCardinal(heading)}
      </span>
    </div>
  );
}
