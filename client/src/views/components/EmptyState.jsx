export default function EmptyState({ title, copy }) {
  return (
    <div className="glass-panel rounded-[1.75rem] border border-dashed px-6 py-10 text-center">
      <h3 className="text-xl font-semibold text-base-100">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-base-content/65">{copy}</p>
    </div>
  );
}
