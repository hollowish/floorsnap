/**
 * InstructionBanner — Top-of-screen instruction text for each wizard step.
 *
 * Provides a consistent header pattern across all steps with
 * an icon, title, and optional subtitle.
 */
export default function InstructionBanner({ icon, title, subtitle }) {
  return (
    <div className="text-center py-4 px-4">
      {icon && <div className="text-3xl mb-2">{icon}</div>}
      <h2 className="text-xl font-bold text-gray-900 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-1.5 text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}
