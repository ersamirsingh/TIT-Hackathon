import { motion } from "framer-motion";

export default function SectionPanel({ className = "", children, warm = false }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
      className={`${warm ? "panel-warm" : "glass-panel"} rounded-4xl p-6 md:p-8 ${className}`}
    >
      {children}
    </motion.section>
  );
}
