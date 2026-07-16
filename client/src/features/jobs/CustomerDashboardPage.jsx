import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, Clock3, ShieldCheck, Wallet, Star } from "lucide-react";
import { getMyJobsRequest, getRateCardRequest } from "../../models/job.model.js";
import MotionPage from "../../views/components/MotionPage.jsx";
import PageHeader from "../../views/components/PageHeader.jsx";
import MetricCard from "../../views/components/MetricCard.jsx";
import SectionPanel from "../../views/components/SectionPanel.jsx";
import EmptyState from "../../views/components/EmptyState.jsx";
import JobCard from "../../views/components/JobCard.jsx";
import { formatCurrency } from "../../models/format.model.js";

export default function CustomerDashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [rateCard, setRateCard] = useState([]);
  const [fees, setFees] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeDeskTab, setActiveDeskTab] = useState("jobs");

  useEffect(() => {
    const load = async () => {
      try {
        const [jobsResponse, rateCardResponse] = await Promise.all([
          getMyJobsRequest(),
          getRateCardRequest(),
        ]);
        setJobs(
          (jobsResponse.data?.jobs || []).filter((job) => !!job.customer),
        );
        setRateCard(rateCardResponse.data?.standardRateCard || []);
        setFees({
          inspectionFee: rateCardResponse.data?.inspectionFee || 0,
          trustSafetyFee: rateCardResponse.data?.trustSafetyFee || 0,
          rocketModeUserFee: rateCardResponse.data?.rocketModeUserFee || 0,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const activeJobs = jobs.filter((job) =>
    ["broadcasting", "worker_selected", "in_progress", "completed_pending_confirmation"].includes(
      job.status,
    ),
  );

  const activeApplications = jobs
    .filter((job) => job.status === "broadcasting")
    .flatMap((job) =>
      (job.applications || []).map((app) => ({
        ...app,
        jobId: job._id,
        jobTitle: job.title,
        jobCategory: job.category,
      }))
    );

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Employer workspace"
        title="Book trusted help in minutes"
        description="Post voice-first repair requests, browse the standard rate card, monitor trust fees, and keep your active jobs moving through selection and closure."
        actions={
          <Link className="k-btn" to="/app/employer/new-job">
            Post a new job
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active jobs"
          value={activeJobs.length}
          hint="Open, selected, in progress, or awaiting confirmation"
          icon={BriefcaseBusiness}
        />
        <MetricCard
          label="Inspection fee"
          value={formatCurrency(fees.inspectionFee)}
          hint="Charged when the problem is unknown on booking"
          icon={Wallet}
        />
        <MetricCard
          label="Trust fee"
          value={formatCurrency(fees.trustSafetyFee)}
          hint="Verified ID tracking, SOS access, and warranty coverage"
          icon={ShieldCheck}
        />
        <MetricCard
          label="Rocket Mode"
          value={formatCurrency(fees.rocketModeUserFee)}
          hint="Optional instant priority dispatch for emergencies"
          icon={Clock3}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <SectionPanel>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="section-label">Rate card</p>
              <h2 className="mt-2 text-2xl text-base-100">Standard service pricing</h2>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {rateCard.map((item) => (
              <div
                key={item.serviceCode}
                className="rounded-[1.5rem] border border-white/6 bg-white/3 px-5 py-5"
              >
                <p className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                  {item.category}
                </p>
                <h3 className="mt-3 text-lg text-base-100">{item.title}</h3>
                <p className="mt-2 text-sm text-warning">{formatCurrency(item.price)}</p>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel warm>
          <p className="section-label">Booking economics</p>
          <h2 className="mt-2 text-2xl text-base-100">What the customer pays for</h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-base-content/68">
            <p>
              Standard jobs use fixed prices. Unknown problems use a flat inspection fee before
              the worker quotes the final amount.
            </p>
            <p>
              Every booking includes the trust and safety fee, which covers verified ID tracking,
              SOS support, and the 7-day service warranty.
            </p>
            <p>
              Rocket Mode adds an emergency siren to nearby worker phones so urgent jobs get
              accepted faster.
            </p>
          </div>
        </SectionPanel>
      </div>

      <SectionPanel>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-white/6 pb-5">
            <div>
              <p className="section-label">Employer Desk</p>
              <h2 className="mt-2 text-2xl text-base-100 font-semibold">Manage Bookings & Applicants</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveDeskTab("jobs")}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition ${
                  activeDeskTab === "jobs"
                    ? "border-warning bg-warning text-black shadow-lg"
                    : "border-white/10 bg-white/3 text-base-content/75 hover:bg-white/6 hover:text-base-100"
                }`}
              >
                My Bookings ({jobs.length})
              </button>
              <button
                onClick={() => setActiveDeskTab("applicants")}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition flex items-center gap-2 ${
                  activeDeskTab === "applicants"
                    ? "border-warning bg-warning text-black shadow-lg"
                    : "border-white/10 bg-white/3 text-base-content/75 hover:bg-white/6 hover:text-base-100"
                }`}
              >
                <span>Applicants Inbox</span>
                {activeApplications.length > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeDeskTab === "applicants" ? "bg-black text-warning" : "bg-warning text-black"
                  }`}>
                    {activeApplications.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <span className="loading loading-ring loading-lg text-warning" />
            </div>
          ) : activeDeskTab === "jobs" ? (
            jobs.length ? (
              <div className="grid gap-4">
                {jobs.map((job) => (
                  <JobCard
                    key={job._id}
                    href={`/app/employer/jobs/${job._id}`}
                    job={job}
                    showAssignment
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No customer jobs yet"
                copy="Once you create a repair request, it will appear here with worker matches, status updates, and timing milestones."
              />
            )
          ) : (
            activeApplications.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {activeApplications.map((app) => {
                  const workerRating = Number(app.worker?.rating || 0);
                  const workerRatingCount = Number(app.worker?.ratingCount || 0);
                  return (
                    <div
                      key={app._id}
                      className="rounded-[1.5rem] border border-white/6 bg-white/3 p-5 flex flex-col justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="status-chip bg-warning/10 border-warning/30 text-warning text-xs">
                            Job: {app.jobTitle}
                          </span>
                          {app.isBoosted && (
                            <span className="status-chip text-xs">Boosted</span>
                          )}
                        </div>

                        <h3 className="mt-3 text-lg text-base-100 font-semibold">
                          {app.worker?.Name || app.fullName || "Worker"}
                        </h3>
                        
                        <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-base-content/60">
                          <span className="inline-flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-warning" />
                            <span className="text-base-100 font-semibold">{workerRating.toFixed(1)}</span>
                            <span>({workerRatingCount} reviews)</span>
                          </span>
                          {app.worker?.verified && (
                            <span className="text-success font-medium">Verified Pro</span>
                          )}
                        </div>

                        <p className="mt-3 text-sm leading-6 text-base-content/70 line-clamp-2">
                          {app.message || app.quoteText || "No written note provided."}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/5">
                        <div>
                          <p className="text-xs text-base-content/50">Quote Amount</p>
                          <p className="text-lg font-bold text-base-100">{formatCurrency(app.quoteAmount || 0)}</p>
                        </div>
                        <Link
                          className="px-4 py-2 text-xs font-semibold rounded-full border border-warning bg-warning/10 text-warning hover:bg-warning hover:text-black transition"
                          to={`/app/employer/jobs/${app.jobId}`}
                        >
                          Review & Hire
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                title="No active applicants"
                copy="No workers have applied or submitted quotes for your broadcasting jobs yet. As soon as a worker expresses interest, they will appear in this inbox."
              />
            )
          )}
        </SectionPanel>
    </MotionPage>
  );
}
