/**
 * ActionButton — Large, mobile-friendly button used throughout the wizard.
 *
 * Variants:
 *   primary   — solid blue, white text (main CTA)
 *   secondary — outlined, blue text (alternative action)
 *   danger    — solid red (destructive actions)
 *   ghost     — no border, subtle text (back/cancel)
 */
export default function ActionButton({
  label,
  variant = 'primary',
  icon,
  disabled = false,
  loading = false,
  onClick,
  className = '',
  type = 'button',
}) {
  const base =
    'relative flex items-center justify-center gap-2 w-full rounded-xl font-semibold text-base transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blueprint-400 focus-visible:ring-offset-2';

  const variants = {
    primary:
      'min-h-[52px] px-6 bg-blueprint-700 text-white hover:bg-blueprint-800 shadow-sm',
    secondary:
      'min-h-[52px] px-6 border-2 border-blueprint-300 text-blueprint-700 hover:bg-blueprint-50',
    danger:
      'min-h-[52px] px-6 bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost:
      'min-h-[44px] px-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading && (
        <svg
          className="animate-spin h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {icon && !loading && <span className="text-xl">{icon}</span>}
      {label}
    </button>
  );
}
