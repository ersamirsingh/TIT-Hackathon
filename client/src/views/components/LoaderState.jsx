import { motion } from "framer-motion";

export default function LoaderState({ label = "Loading" }) {
  return (
    <div className="app-shell flex min-h-screen items-center justify-center">
      <div className="ambient-grid" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel flex flex-col items-center gap-4 rounded-[2rem] px-10 py-10"
      >
        <span className="loading loading-ring loading-lg text-warning" />
        <p className="text-sm uppercase tracking-[0.24em] text-base-content/60">{label}</p>
      </motion.div>
    </div>
  );
}
