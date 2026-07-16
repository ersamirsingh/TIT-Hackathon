const map = {
  broadcasting: "badge-info",
  worker_selected: "badge-warning",
  in_progress: "badge-secondary",
  completed_pending_confirmation: "badge-accent",
  completed: "badge-success",
  cancelled: "badge-error",
  disputed: "badge-error",
  warranty_claimed: "badge-warning",
  active: "badge-success",
  inactive: "badge-ghost",
  pending: "badge-warning",
  resolved: "badge-success",
};

export default function StatusBadge({ value }) {
  return (
    <span className={`status-chip badge ${map[value] || "badge-ghost"}`}>
      {String(value || "unknown").replaceAll("_", " ")}
    </span>
  );
}
