import { motion } from "framer-motion";

export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
    >
      <div className="max-w-3xl space-y-3">
        {eyebrow ? <p className="section-label">{eyebrow}</p> : null}
        <h1 className="display-font text-4xl leading-tight text-base-100 md:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-base-content/70 md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </motion.div>
  );
}
