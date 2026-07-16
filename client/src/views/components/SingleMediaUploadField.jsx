export default function SingleMediaUploadField({
  label,
  helperText,
  file,
  accept = "image/*,video/*",
  onChange,
}) {
  return (
    <label className="space-y-3">
      <span className="text-sm font-medium text-base-content/80">{label}</span>
      <input
        accept={accept}
        className="k-input file:mr-4 file:rounded-full file:border-0 file:bg-warning file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
        type="file"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
      />
      <p className="text-xs leading-6 text-base-content/50">
        {file ? `Selected: ${file.name}` : helperText}
      </p>
    </label>
  );
}
