const STAGE_LABELS = {
  customer_context: "Customer Context",
  before_work: "Before Work",
  after_work: "After Completion",
};

export default function JobMediaGallery({ media = [] }) {
  const groupedMedia = Object.entries(
    media.reduce((accumulator, item) => {
      const stage = item.stage || "customer_context";
      accumulator[stage] = accumulator[stage] || [];
      accumulator[stage].push(item);
      return accumulator;
    }, {}),
  );

  if (!groupedMedia.length) {
    return (
      <div className="rounded-[1.5rem] border border-white/6 bg-white/3 px-5 py-5 text-sm leading-7 text-base-content/60">
        No proof media uploaded yet. Upload one file at a time to show the before and after condition of the job.
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {groupedMedia.map(([stage, items]) => (
        <div key={stage} className="space-y-4">
          <div>
            <p className="section-label">{STAGE_LABELS[stage] || "Proof"}</p>
            <h3 className="mt-2 text-xl text-base-100">
              {STAGE_LABELS[stage] || stage.replaceAll("_", " ")}
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item) => (
              <div
                key={item._id}
                className="rounded-[1.5rem] border border-white/6 bg-white/3 p-4"
              >
                {item.type === "video" ? (
                  <video
                    className="h-64 w-full rounded-[1rem] bg-black object-cover"
                    controls
                    src={item.url}
                  />
                ) : (
                  <img
                    alt={item.originalName || "Job proof"}
                    className="h-64 w-full rounded-[1rem] object-cover"
                    src={item.url}
                  />
                )}

                <div className="mt-3 space-y-1 text-sm text-base-content/60">
                  <p className="text-base-100">
                    {item.originalName || `${item.type} proof`}
                  </p>
                  <p>Uploaded by: {item.uploadedBy?.Name || "Unknown user"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
