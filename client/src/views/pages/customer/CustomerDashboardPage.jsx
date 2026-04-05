import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BriefcaseBusiness, Clock3, ShieldCheck, Wallet } from "lucide-react";
import { getMyJobsRequest, getRateCardRequest } from "../../../models/job.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import MetricCard from "../../components/MetricCard.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import JobCard from "../../components/JobCard.jsx";
import { formatCurrency } from "../../../models/format.model.js";

export default function CustomerDashboardPage() {
  const [jobs, setJobs] = useState([]);
  const [rateCard, setRateCard] = useState([]);
  const [fees, setFees] = useState({});
  const [loading, setLoading] = useState(true);

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

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Customer workspace"
        title="Book trusted help in minutes"
        description="Post voice-first repair requests, browse the standard rate card, monitor trust fees, and keep your active jobs moving through selection and closure."
        actions={
          <Link className="k-btn" to="/app/customer/new-job">
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
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="section-label">Jobs</p>
            <h2 className="mt-2 text-2xl text-base-100">Your booking timeline</h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <span className="loading loading-ring loading-lg text-warning" />
          </div>
        ) : jobs.length ? (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                href={`/app/customer/jobs/${job._id}`}
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
        )}
      </SectionPanel>
    </MotionPage>
  );
}
