export function fieldErrors(error) {
  return error?.details?.fieldErrors || error?.details?.field_errors || {};
}

export function firstFieldError(errors, name) {
  if (!errors || !name) return undefined;
  const exact = errors[name];
  if (exact) return Array.isArray(exact) ? exact[0] : exact;
  const match = Object.entries(errors).find(([key]) => key.endsWith(`.${name}`));
  const value = match?.[1];
  return Array.isArray(value) ? value[0] : value;
}

export default function FormField({ label, name, error, required, hint, children, className = '' }) {
  const message = firstFieldError(error, name);
  return (
    <div className={className}>
      {label && <label className="label" htmlFor={name}>{label}{required && <span className="text-red-500"> *</span>}</label>}
      {children}
      {hint && !message && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      {message && <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-300">{message}</p>}
    </div>
  );
}
