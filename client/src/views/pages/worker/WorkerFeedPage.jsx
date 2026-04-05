import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { getWorkerFeedRequest, expressInterestRequest } from "../../../models/worker.model.js";
import { getMyJobsRequest } from "../../../models/job.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import JobCard from "../../components/JobCard.jsx";
import { useAppController } from "../../../controllers/AppController.jsx";
import { TextAreaField, InputField } from "../../components/FormField.jsx";
import VoiceComposerField from "../../components/VoiceComposerField.jsx";
import { formatCurrency } from "../../../models/format.model.js";

const ACTIVE_WORKER_STATUSES = [
  "worker_selected",
  "in_progress",
  "completed_pending_confirmation",
  "completed",
  "warranty_claimed",
  "disputed",
];

export default function WorkerFeedPage() {
  const { user } = useAppController();
  const [drafts, setDrafts] = useState({});
  const [jobs, setJobs] = useState([]);
  const [myJobs, setMyJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [feedResponse, myJobsResponse] = await Promise.all([
        getWorkerFeedRequest(),
        getMyJobsRequest(),
      ]);
      setJobs(feedResponse.data.jobs || []);

      const workerJobs = (myJobsResponse.data.jobs || []).filter((job) => {
        const selectedWorkerId = String(job.selectedWorker?._id || job.selectedWorker || "");
        const isSelectedWorker = selectedWorkerId === String(user?._id || "");
        const hasApplied = (job.applications || []).some(
          (application) =>
            String(application.worker?._id || application.worker || "") ===
            String(user?._id || ""),
        );

        return isSelectedWorker || hasApplied;
      });

      setMyJobs(workerJobs);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load worker feed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?._id]);

  const submitInterest = async (jobId) => {
    try {
      const draft = drafts[jobId] || {};
      await expressInterestRequest(jobId, {
        message: draft.message || "",
        quoteAmount: draft.quoteAmount || "",
        quoteText: draft.quoteText || "",
        boostProfile: Boolean(draft.boostProfile),
        voiceInput: {
          transcript: draft.voiceTranscript || "",
          language: draft.language || user?.preferredLanguage || "Hindi",
          speakerRole: "worker",
        },
      });
      toast.success("Interest sent");
      setDrafts((current) => ({ ...current, [jobId]: {} }));
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send interest");
    }
  };

  const activeWorkerJobs = myJobs.filter((job) =>
    ACTIVE_WORKER_STATUSES.includes(job.status),
  );
  const appliedJobs = myJobs.filter((job) => {
    const selectedWorkerId = String(job.selectedWorker?._id || job.selectedWorker || "");
    const isSelectedWorker = selectedWorkerId === String(user?._id || "");
    const hasApplied = (job.applications || []).some(
      (application) =>
        String(application.worker?._id || application.worker || "") ===
        String(user?._id || ""),
    );

    return hasApplied && !isSelectedWorker && !ACTIVE_WORKER_STATUSES.includes(job.status);
  });


  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Worker dispatch"
        title="Nearby jobs ready for your quote"
        description="Tap interested for free, boost your profile when the lead is worth it, and use Verified Pro to unlock a 10-second head start."
        actions={
          <Link className="k-btn-ghost" to="/app/worker/profile">
            Edit worker profile
          </Link>
        }
      />

      {/* Worker stats panel */}
      <SectionPanel warm>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="section-label">Wallet state</p>
            <p className="mt-2 text-3xl text-base-100">{user?.wallet?.balance ?? 0}</p>
            <p className="mt-2 text-sm text-base-content/60">
              Credit limit: {user?.wallet?.creditLimit ?? -200}
            </p>
          </div>
          <div>
            <p className="section-label">Verified Pro</p>
            <p className="mt-2 text-3xl text-base-100">
              {user?.subscription?.status === "active" ? "Active" : "Inactive"}
            </p>
            <p className="mt-2 text-sm text-base-content/60">
              Early access: {user?.subscription?.earlyAccessSeconds ?? 0}s
            </p>
          </div>
          <div>
            <p className="section-label">Availability</p>
            <p className="mt-2 text-3xl text-base-100">
              {user?.workerProfile?.isAvailable ? "Live" : "Paused"}
            </p>
            <p className="mt-2 text-sm text-base-content/60">
              Radius: {user?.workerProfile?.serviceRadiusKm ?? 0} km
            </p>
          </div>
        </div>
      </SectionPanel>

      <div className="grid gap-6 xl:grid-cols-2">
        <SectionPanel>
          <p className="section-label">My worker jobs</p>
          <h2 className="mt-2 text-2xl text-base-100">Assigned and active work</h2>
          <p className="mt-3 text-sm leading-7 text-base-content/60">
            Keep track of jobs assigned to you, jobs in progress, and jobs waiting for customer confirmation.
          </p>

          <div className="mt-6 grid gap-4">
            {activeWorkerJobs.length ? (
              activeWorkerJobs.map((job) => (
                <div key={job._id} className="rounded-[1.5rem] border border-white/6 bg-white/3 p-4">
                  <JobCard
                    href={`/app/worker/jobs/${job._id}`}
                    job={job}
                    showAssignment
                  />
                  <div className="mt-4 rounded-[1.2rem] border border-white/6 bg-black/10 px-4 py-3 text-sm leading-6 text-base-content/60">
                    <p>
                      Current stage: <span className="text-base-100">{job.status.replaceAll("_", " ")}</span>
                    </p>
                    <p>
                      Customer payable: <span className="text-base-100">{formatCurrency(job.pricing?.totalUserPayable || job.wage || 0)}</span>
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No active worker jobs"
                copy="Once you are selected for a job or mark arrival/completion, those jobs will stay visible here for tracking."
              />
            )}
          </div>
        </SectionPanel>

        <SectionPanel>
          <p className="section-label">Applied jobs</p>
          <h2 className="mt-2 text-2xl text-base-100">Quotes you already sent</h2>
          <p className="mt-3 text-sm leading-7 text-base-content/60">
            These are jobs where you already expressed interest, so they do not disappear after you apply.
          </p>

          <div className="mt-6 grid gap-4">
            {appliedJobs.length ? (
              appliedJobs.map((job) => (
                <JobCard key={job._id} href={`/app/worker/jobs/${job._id}`} job={job} />
              ))
            ) : (
              <EmptyState
                title="No pending applications"
                copy="After you send interest on a job, it will stay visible here until the customer assigns someone."
              />
            )}
          </div>
        </SectionPanel>
      </div>

      {/* Job list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <span className="loading loading-ring loading-lg text-warning" />
        </div>
      ) : jobs.length ? (
        <div className="grid gap-6">
          {jobs.map((job) => {
            const draft = drafts[job._id] || {};
            return (
              <SectionPanel key={job._id}>
                <JobCard job={job} href={`/app/worker/jobs/${job._id}`} />
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <TextAreaField
                    label="Message to customer"
                    value={draft.message || ""}
                    onChange={(event) =>
                      setDrafts((current) => ({
                        ...current,
                        [job._id]: { ...draft, message: event.target.value },
                      }))
                    }
                  />
                  <div className="space-y-4">
                    <InputField
                      label="Quote amount"
                      value={draft.quoteAmount || ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [job._id]: { ...draft, quoteAmount: event.target.value },
                        }))
                      }
                    />
                    <InputField
                      label="Quote note"
                      value={draft.quoteText || ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [job._id]: { ...draft, quoteText: event.target.value },
                        }))
                      }
                    />
                    <VoiceComposerField
                      label="Voice transcript"
                      value={draft.voiceTranscript || ""}
                      language={user?.preferredLanguage || "Hindi"}
                      onChange={(value) =>
                        setDrafts((current) => ({
                          ...current,
                          [job._id]: { ...draft, voiceTranscript: value },
                        }))
                      }
                    />
                    <label className="flex items-center justify-between rounded-[1.25rem] border border-white/6 bg-white/3 px-4 py-3">
                      <span className="text-sm text-base-content/70">
                        Boost profile for ₹10
                      </span>
                      <input
                        checked={Boolean(draft.boostProfile)}
                        className="toggle toggle-warning"
                        type="checkbox"
                        onChange={(event) =>
                          setDrafts((current) => ({
                            ...current,
                            [job._id]: { ...draft, boostProfile: event.target.checked },
                          }))
                        }
                      />
                    </label>
                    <button className="k-btn" onClick={() => submitInterest(job._id)}>
                      Send interest
                    </button>
                  </div>
                </div>
              </SectionPanel>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No nearby jobs right now"
          copy="Make sure your live location and worker availability are on. New jobs in your radius will appear here."
        />
      )}
    </MotionPage>
  );
}
