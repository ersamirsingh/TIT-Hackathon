export default function DetailGrid({ items }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-3xl border border-white/6 bg-white/3 px-4 py-4"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-base-content/45">
            {item.label}
          </p>
          <p className="mt-2 text-sm leading-7 text-base-100">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
