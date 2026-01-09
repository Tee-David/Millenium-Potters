export default function ToggleSwitch({
  isOn,
  onToggle,
  label,
  disabled = false,
  loading = false,
}: {
  isOn: boolean;
  onToggle: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
      tabIndex={0}
      disabled={disabled || loading}
      className={`relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
        isOn ? "bg-emerald-600" : "bg-gray-300"
      } ${
        disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <span
        className={`transform transition ease-in-out duration-200 inline-block w-5 h-5 bg-white rounded-full shadow ${
          isOn ? "translate-x-6" : "translate-x-1"
        } ${loading ? "animate-pulse" : ""}`}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-spin"></div>
          </div>
        )}
      </span>
    </button>
  );
}
