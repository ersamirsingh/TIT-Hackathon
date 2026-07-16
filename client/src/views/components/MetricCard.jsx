import { motion } from "framer-motion";

export default function MetricCard({ label, value, hint, icon: Icon }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="metric-tile glass-panel rounded-[1.75rem] p-5"
    >
      <div className="mb-5 flex items-start justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-base-content/45">{label}</p>
        {Icon ? <Icon className="h-5 w-5 text-warning" /> : null}
      </div>
      <div className="space-y-2">
        <h3 className="text-3xl font-semibold tracking-tight text-base-100">{value}</h3>
        {hint ? <p className="text-sm text-base-content/60">{hint}</p> : null}
      </div>
    </motion.div>
  );
}
