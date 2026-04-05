export function InputField({ label, ...props }) {
  return (
    <label className="space-y-3">
      <span className="text-sm font-medium text-base-content/80">{label}</span>
      <input className="k-input" {...props} />
    </label>
  );
}

export function SelectField({ label, children, className = "", ...props }) {
  return (
    <label className="space-y-3">
      <span className="text-sm font-medium text-base-content/80">{label}</span>
      <select className={`k-select ${className}`} {...props}>
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({ label, ...props }) {
  return (
    <label className="space-y-3">
      <span className="text-sm font-medium text-base-content/80">{label}</span>
      <textarea className="k-textarea" {...props} />
    </label>
  );
}
