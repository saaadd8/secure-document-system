const alertStyles = {
  error: "border-rose-200 bg-rose-50 text-rose-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

const badgeStyles = {
  neutral: "bg-slate-100 text-slate-700",
  success: "bg-emerald-50 text-emerald-700",
  danger: "bg-rose-50 text-rose-700",
  warning: "bg-amber-50 text-amber-700",
  info: "bg-blue-50 text-blue-700",
};

export function Alert({ variant = "info", children, actionLabel, onAction, className = "" }) {
  const isUrgent = variant === "error" || variant === "warning";
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm ${alertStyles[variant]} ${className}`}
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
    >
      <span>{children}</span>
      {onAction && actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="shrink-0 rounded-md px-2 py-1 font-semibold underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function LoadingButton({ children, loading = false, loadingLabel, className = "", ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      aria-busy={loading || undefined}
      className={`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {loading ? loadingLabel || children : children}
    </button>
  );
}

export function StatusBadge({ children, variant = "neutral", className = "" }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${badgeStyles[variant]} ${className}`}>{children}</span>;
}

export function EmptyState({ title, description, icon = "Document" }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-xs font-bold text-blue-700" aria-hidden="true">{icon}</div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry, className = "" }) {
  return <Alert variant="error" actionLabel={onRetry ? "Retry" : undefined} onAction={onRetry} className={className}>{message}</Alert>;
}
