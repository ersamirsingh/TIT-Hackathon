import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";
import { useAppController } from "../../../controllers/AppController.jsx";
import {
  cancelJobRequest,
  claimWarrantyRequest,
  confirmJobCompletionRequest,
  getJobDetailsRequest,
  getJobMatchesRequest,
  getTrackingRequest,
  markWorkCompletedRequest,
  markWorkerArrivedRequest,
  raiseDisputeRequest,
  selectWorkerRequest,
} from "../../../models/job.model.js";
import { getJobMediaRequest, uploadMediaRequest } from "../../../models/media.model.js";
import { expressInterestRequest } from "../../../models/worker.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import DetailGrid from "../../components/DetailGrid.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import {
  formatCurrency,
  formatDateTime,
} from "../../../models/format.model.js";
import { InputField, TextAreaField } from "../../components/FormField.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import VoiceComposerField from "../../components/VoiceComposerField.jsx";
import JobMediaGallery from "../../components/JobMediaGallery.jsx";
import SingleMediaUploadField from "../../components/SingleMediaUploadField.jsx";

const STATUS_COPY = {
  broadcasting: "Workers can still send interest and quotes for this booking.",
  worker_selected: "A worker has been assigned and can now mark arrival.",
  in_progress: "The worker marked arrival and the job is currently in progress.",
  completed_pending_confirmation:
    "The worker marked the job complete. The customer now has a 2-hour confirmation window.",
  completed: "The job is closed and the 7-day Karigar warranty is active.",
  cancelled: "This job was cancelled before normal closure.",
  disputed: "A dispute has been raised and support intervention is now in progress.",
  warranty_claimed: "The warranty has been claimed and the original worker must revisit.",
};

const buildTimelineItems = (job) => [
  {
    key: "requested",
    label: "Requested",
    value: job.timeline?.requestedAt || job.createdAt,
    complete: Boolean(job.timeline?.requestedAt || job.createdAt),
  },
  {
    key: "selected",
    label: "Assigned",
    value: job.timeline?.selectedAt,
    complete: [
      "worker_selected",
      "in_progress",
      "completed_pending_confirmation",
      "completed",
      "disputed",
      "warranty_claimed",
    ].includes(job.status),
  },
  {
    key: "arrived",
    label: "Arrived",
    value: job.timeline?.workerArrivedAt,
    complete: [
      "in_progress",
      "completed_pending_confirmation",
      "completed",
      "disputed",
      "warranty_claimed",
    ].includes(job.status),
  },
  {
    key: "completed",
    label: "Completed",
    value: job.timeline?.workCompletedAt,
    complete: [
      "completed_pending_confirmation",
      "completed",
      "disputed",
      "warranty_claimed",
    ].includes(job.status),
  },
  {
    key: "closed",
    label: "Closed",
    value: job.timeline?.closedAt,
    complete: ["completed", "warranty_claimed"].includes(job.status),
  },
];

export default function JobDetailPage() {
  const { jobId } = useParams();
  const { user } = useAppController();
  const [job, setJob] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [matches, setMatches] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- existing forms (customer/admin actions) ---
  const [completeForm, setCompleteForm] = useState({
    finalQuotedAmount: "",
    workSummary: "",
  });
  const [confirmForm, setConfirmForm] = useState({
    rating: 5,
    review: "",
  });
  const [issue, setIssue] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [warrantyNotes, setWarrantyNotes] = useState("");
  const [beforeProofFile, setBeforeProofFile] = useState(null);
  const [afterProofFile, setAfterProofFile] = useState(null);

  // --- NEW: worker interest / application draft ---
  const [interestDraft, setInterestDraft] = useState({
    message: "",
    quoteAmount: "",
    quoteText: "",
    boostProfile: false,
    voiceTranscript: "",
  });
  const [submittingInterest, setSubmittingInterest] = useState(false);

  const isAdmin = user?.role === "admin";
  const isCustomer =
    String(job?.customer?._id || job?.customer || "") === String(user?._id);
  const isWorker =
    String(job?.selectedWorker?._id || job?.selectedWorker || "") ===
    String(user?._id);

  // Has this worker already applied?
  const hasApplied =
    user?.activeMode === "worker" &&
    (job?.applications || []).some(
      (app) => String(app.worker?._id || app.worker || "") === String(user?._id),
    );

  const load = async () => {
    setLoading(true);
    try {
      const [jobResponse, trackingResponse] = await Promise.all([
        getJobDetailsRequest(jobId),
        getTrackingRequest(jobId),
      ]);
      setJob(jobResponse.data.job);
      setTracking(trackingResponse.data.tracking);
      try {
        const mediaResponse = await getJobMediaRequest(jobId);
        setMediaItems(mediaResponse.data || []);
      } catch {
        setMediaItems([]);
      }

      if (
        isAdmin ||
        String(
          jobResponse.data.job?.customer?._id ||
          jobResponse.data.job?.customer ||
          "",
        ) === String(user?._id)
      ) {
        try {
          const matchesResponse = await getJobMatchesRequest(jobId);
          setMatches(matchesResponse.data.nearbyWorkers || []);
        } catch {
          setMatches([]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [jobId, user?._id]);

  const withRefresh = async (action, successMessage) => {
    try {
      await action();
      if (successMessage) toast.success(successMessage);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Action failed");
    }
  };

  // --- NEW: submit interest handler ---
  const submitInterest = async () => {
    setSubmittingInterest(true);
    try {
      await expressInterestRequest(jobId, {
        message: interestDraft.message,
        quoteAmount: interestDraft.quoteAmount,
        quoteText: interestDraft.quoteText,
        boostProfile: Boolean(interestDraft.boostProfile),
        voiceInput: {
          transcript: interestDraft.voiceTranscript,
          language: user?.preferredLanguage || "Hindi",
          speakerRole: "worker",
        },
      });
      toast.success("Interest sent successfully!");
      setInterestDraft({
        message: "",
        quoteAmount: "",
        quoteText: "",
        boostProfile: false,
        voiceTranscript: "",
      });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not send interest");
    } finally {
      setSubmittingInterest(false);
    }
  };

  const uploadBeforeProof = async (event) => {
    event.preventDefault();

    if (!beforeProofFile) {
      toast.error("Choose one image or video to upload");
      return;
    }

    try {
      await uploadMediaRequest(jobId, {
        file: beforeProofFile,
        stage: "before_work",
      });
      toast.success("Before-work proof uploaded");
      setBeforeProofFile(null);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not upload before-work proof");
    }
  };

  // ---------- render ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <span className="loading loading-ring loading-lg text-warning" />
      </div>
    );
  }

  if (!job) {
    return (
      <EmptyState
        title="Job not found"
        copy="The selected job could not be loaded."
      />
    );
  }

  const applications = [...(job.applications || [])].sort((left, right) => {
    if (left.isBoosted !== right.isBoosted) return left.isBoosted ? -1 : 1;
    return new Date(right.submittedAt) - new Date(left.submittedAt);
  });
  const selectedWorkerId = String(job.selectedWorker?._id || job.selectedWorker || "");
  const timelineItems = buildTimelineItems(job);

  // Worker can send interest only when job is broadcasting and hasn't applied yet
  const canSendInterest =
    user?.activeMode === "worker" &&
    job.status === "broadcasting" &&
    !hasApplied &&
    !isCustomer &&
    !isAdmin;

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Job control"
        title={job.title}
        description={job.description}
        actions={<StatusBadge value={job.status} />}
      />

      <SectionPanel warm>
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="section-label">Lifecycle</p>
            <h2 className="mt-2 text-2xl text-base-100">
              Assignment, progress, and closure
            </h2>
            <p className="mt-3 text-sm leading-7 text-base-content/60">
              {STATUS_COPY[job.status] || "This job is moving through the Karigar workflow."}
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-5">
              {timelineItems.map((item) => (
                <div
                  key={item.key}
                  className={`rounded-[1.4rem] border px-4 py-4 ${item.complete
                      ? "border-warning/20 bg-warning/10"
                      : "border-white/6 bg-white/3"
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${item.complete
                          ? "bg-warning text-black"
                          : "bg-white/8 text-base-content/60"
                        }`}
                    >
                      {item.complete ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock3 className="h-4 w-4" />
                      )}
                    </span>
                    <p className="text-sm font-medium text-base-100">{item.label}</p>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-base-content/55">
                    {item.value ? formatDateTime(item.value) : "Pending"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/6 bg-white/3 p-5">
            <div className="flex items-center gap-3">
              <UserRound className="h-5 w-5 text-warning" />
              <h3 className="text-xl text-base-100">Selected worker</h3>
            </div>

            {job.selectedWorker ? (
              <div className="mt-5 space-y-3 text-sm leading-7 text-base-content/68">
                <p className="text-lg text-base-100">{job.selectedWorker.Name}</p>
                <p>{job.selectedWorker.workerProfile?.headline || "Assigned to this booking"}</p>
                <p>Contact: {job.selectedWorker.contact || "Not shared yet"}</p>
                <p>
                  Rating: {Number(job.selectedWorker.rating || 0).toFixed(1)} (
                  {job.selectedWorker.ratingCount || 0} reviews)
                </p>
                <p>
                  Status:{" "}
                  <span className="text-base-100">{job.status.replaceAll("_", " ")}</span>
                </p>
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-base-content/60">
                No worker has been assigned yet. Choose one from the interested worker list below.
              </p>
            )}
          </div>
        </div>
      </SectionPanel>

      {/* ── Job details ── */}
      <SectionPanel>
        <DetailGrid
          items={[
            { label: "Category", value: job.category },
            { label: "Location", value: job.locationText || "Not set" },
            { label: "Pricing model", value: job.pricingModel },
            {
              label: "Customer payable",
              value: formatCurrency(
                job.pricing?.totalUserPayable || job.wage || 0,
              ),
            },
            {
              label: "Rocket mode",
              value: job.rocketMode?.enabled ? "Enabled" : "Off",
            },
            { label: "Created", value: formatDateTime(job.createdAt) },
            {
              label: "Assigned at",
              value: formatDateTime(job.timeline?.selectedAt),
            },
            {
              label: "Arrived at",
              value: formatDateTime(job.timeline?.workerArrivedAt),
            },
            {
              label: "Completed at",
              value: formatDateTime(job.timeline?.workCompletedAt),
            },
            {
              label: "Closed at",
              value: formatDateTime(job.timeline?.closedAt),
            },
            {
              label: "Dispute window ends",
              value: formatDateTime(job.timeline?.disputeWindowEndsAt),
            },
            {
              label: "Warranty ends",
              value: formatDateTime(job.warranty?.endsAt),
            },
            {
              label: "Selected worker",
              value: job.selectedWorker?.Name || "Not assigned yet",
            },
          ]}
        />
      </SectionPanel>

      {/* ── Tracking ── */}
      {tracking ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <SectionPanel>
            <p className="section-label">Trust and tracking</p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-base-content/70">
              <p>SOS enabled: {tracking.trustAndSafety?.sosEnabled ? "Yes" : "No"}</p>
              <p>
                Verified ID tracking:{" "}
                {tracking.trustAndSafety?.verifiedIdTracking
                  ? "Enabled"
                  : "Disabled"}
              </p>
              <p>Warranty status: {tracking.warranty?.status || "inactive"}</p>
            </div>
          </SectionPanel>

          <SectionPanel warm>
            <p className="section-label">Cross-sell and ads</p>
            {tracking.trackingAd?.title ? (
              <div className="mt-4 rounded-[1.5rem] border border-white/6 bg-white/3 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-base-content/45">
                  Sponsored
                </p>
                <h3 className="mt-2 text-lg text-base-100">
                  {tracking.trackingAd.title}
                </h3>
                <p className="mt-1 text-sm text-base-content/60">
                  {tracking.trackingAd.businessName}
                </p>
              </div>
            ) : null}
            <div className="mt-4 space-y-3">
              {(tracking.crossSellRecommendations || []).map((item) => (
                <div
                  key={item.serviceCode}
                  className="rounded-[1.4rem] border border-white/6 bg-white/3 px-4 py-4"
                >
                  <h4 className="text-base text-base-100">{item.title}</h4>
                  <p className="mt-1 text-sm text-base-content/60">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </SectionPanel>
        </div>
      ) : null}

      <SectionPanel>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="section-label">Proof media</p>
            <h2 className="mt-2 text-2xl text-base-100">Before and after job condition</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-base-content/60">
              Upload one file at a time. Customers can add context and before-work proof.
              The assigned worker can add after-work proof when the job is completed.
            </p>
          </div>

          {(isCustomer || isAdmin) &&
          ["broadcasting", "worker_selected", "in_progress"].includes(job.status) ? (
            <form className="w-full max-w-xl space-y-4" onSubmit={uploadBeforeProof}>
              <SingleMediaUploadField
                label="Upload before-work proof"
                helperText="Share one image or video of the current condition so the worker has complete context."
                file={beforeProofFile}
                onChange={setBeforeProofFile}
              />
              <button className="k-btn" type="submit">
                Upload before-work proof
              </button>
            </form>
          ) : null}
        </div>

        <div className="mt-6">
          <JobMediaGallery media={mediaItems} />
        </div>
      </SectionPanel>

      {/* ── Nearby workers (customer / admin) ── */}
      {(isCustomer || isAdmin) && matches.length ? (
        <SectionPanel>
          <p className="section-label">Nearby workers</p>
          <h2 className="mt-2 text-2xl text-base-100">
            Broadcast reach in your radius
          </h2>
          <p className="mt-3 text-sm leading-7 text-base-content/60">
            These are workers currently in range. The actual assignment should
            happen from the interested workers list once they apply or send a
            quote.
          </p>
          <div className="mt-6 grid gap-4">
            {matches.map((worker) => (
              <div
                key={worker._id}
                className="rounded-[1.5rem] border border-white/6 bg-white/3 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg text-base-100">{worker.Name}</h3>
                    <p className="text-sm text-base-content/60">
                      {worker.workerProfile?.headline ||
                        "Nearby verified worker"}
                    </p>
                  </div>
                  <StatusBadge
                    value={
                      worker.subscription?.status === "active"
                        ? "active"
                        : "inactive"
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionPanel>
      ) : null}

      {/* ── Applications (customer / admin) ── */}
      {(isCustomer || isAdmin) && applications.length ? (
        <SectionPanel>
          <p className="section-label">Applications</p>
          <h2 className="mt-2 text-2xl text-base-100">
            Interested workers and quotes
          </h2>
          <p className="mt-3 text-sm leading-7 text-base-content/60">
            Assign the job from this list. Only workers who actually showed
            interest can be selected.
          </p>
          <div className="mt-6 grid gap-4">
            {applications.map((application) => (
              (() => {
                const applicationWorkerId = String(
                  application.worker?._id || application.worker || "",
                );
                const isAssignedWorker = applicationWorkerId === selectedWorkerId;
                const workerRating = Number(application.worker?.rating || 0);
                const workerRatingCount = Number(application.worker?.ratingCount || 0);

                return (
                  <div
                    key={application._id}
                    className="rounded-[1.5rem] border border-white/6 bg-white/3 p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg text-base-100">
                            {application.worker?.Name || application.fullName}
                          </h3>
                          {application.isBoosted ? (
                            <span className="status-chip">Boosted</span>
                          ) : null}
                          {isAssignedWorker ? <span className="status-chip">Assigned</span> : null}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-base-content/60">
                          <span className="inline-flex items-center gap-1.5">
                            <Star className="h-4 w-4 text-warning" />
                            <span className="text-base-100">{workerRating.toFixed(1)}</span>
                            <span>({workerRatingCount} reviews)</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4 text-warning" />
                            <span>{application.worker?.locationText || "Location not shared"}</span>
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-7 text-base-content/65">
                          {application.message || application.quoteText || "No written note"}
                        </p>
                        {application.voiceInput?.transcript ? (
                          <p className="mt-2 text-sm text-base-content/55">
                            Voice: {application.voiceInput.transcript}
                          </p>
                        ) : null}
                      </div>
                      <div className="space-y-3 text-right text-sm text-base-content/60 md:min-w-[220px]">
                        <p>{formatCurrency(application.quoteAmount || 0)}</p>
                        <p>{application.status}</p>
                        {(isCustomer || isAdmin) ? (
                          <button
                            className="k-btn w-full"
                            disabled={
                              !["broadcasting", "worker_selected"].includes(job.status) ||
                              isAssignedWorker ||
                              !applicationWorkerId
                            }
                            onClick={() =>
                              withRefresh(
                                () => selectWorkerRequest(jobId, applicationWorkerId),
                                "Worker assigned",
                              )
                            }
                          >
                            {isAssignedWorker ? "Assigned worker" : "Assign worker"}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })()
            ))}
          </div>
        </SectionPanel>
      ) : null}

      {/* ══════════════════════════════════════════
          WORKER INTEREST SECTION  ← NEW
      ══════════════════════════════════════════ */}
      {canSendInterest ? (
        <SectionPanel warm>
          <p className="section-label">Express interest</p>
          <h2 className="mt-2 text-2xl text-base-100">Send your quote to the customer</h2>
          <p className="mt-2 text-sm leading-7 text-base-content/60">
            Fill in your message and quote. Boosting your profile for ₹10 places you at the
            top of the list.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {/* Left column */}
            <TextAreaField
              label="Message to customer"
              value={interestDraft.message}
              onChange={(e) =>
                setInterestDraft((prev) => ({ ...prev, message: e.target.value }))
              }
            />

            {/* Right column */}
            <div className="space-y-4">
              <InputField
                label="Quote amount (₹)"
                type="number"
                value={interestDraft.quoteAmount}
                onChange={(e) =>
                  setInterestDraft((prev) => ({ ...prev, quoteAmount: e.target.value }))
                }
              />
              <InputField
                label="Quote note"
                value={interestDraft.quoteText}
                onChange={(e) =>
                  setInterestDraft((prev) => ({ ...prev, quoteText: e.target.value }))
                }
              />
              <VoiceComposerField
                label="Voice transcript (optional)"
                value={interestDraft.voiceTranscript}
                language={
                  user?.preferredLanguage === "Bhojpuri" ? "hi-IN" : "hi-IN"
                }
                onChange={(value) =>
                  setInterestDraft((prev) => ({ ...prev, voiceTranscript: value }))
                }
              />

              {/* Boost toggle */}
              <label className="flex items-center justify-between rounded-[1.25rem] border border-white/6 bg-white/3 px-4 py-3 cursor-pointer">
                <div>
                  <span className="text-sm text-base-content/70">Boost my profile</span>
                  <p className="text-xs text-base-content/45 mt-0.5">
                    Appear at the top · ₹10 deducted from wallet
                  </p>
                </div>
                <input
                  checked={Boolean(interestDraft.boostProfile)}
                  className="toggle toggle-warning"
                  type="checkbox"
                  onChange={(e) =>
                    setInterestDraft((prev) => ({
                      ...prev,
                      boostProfile: e.target.checked,
                    }))
                  }
                />
              </label>

              {/* Submit */}
              <button
                className="k-btn w-full"
                disabled={submittingInterest}
                onClick={submitInterest}
              >
                {submittingInterest ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  "Send interest"
                )}
              </button>
            </div>
          </div>
        </SectionPanel>
      ) : null}

      {/* Already applied — show status */}
      {user?.activeMode === "worker" && hasApplied && !isCustomer && !isAdmin ? (
        <SectionPanel>
          <p className="section-label">Your application</p>
          <h2 className="mt-2 text-2xl text-base-100">Interest already sent ✓</h2>
          <p className="mt-2 text-sm leading-7 text-base-content/60">
            You have already expressed interest in this job. The customer will review your
            quote and get back to you.
          </p>
        </SectionPanel>
      ) : null}

      {/* ── Customer / Admin action panels ── */}
      <div className="grid gap-6 xl:grid-cols-2">
        {(isCustomer || isAdmin) &&
          ["broadcasting", "worker_selected", "in_progress"].includes(job.status) ? (
          <SectionPanel>
            <p className="section-label">Cancellation</p>
            <h2 className="mt-2 text-2xl text-base-100">Cancel booking</h2>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                withRefresh(() => cancelJobRequest(jobId, cancelReason), "Job cancelled");
              }}
            >
              <TextAreaField
                label="Reason"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <button className="k-btn-ghost" type="submit">
                Cancel job
              </button>
            </form>
          </SectionPanel>
        ) : null}

        {(isWorker || isAdmin) && job.status === "worker_selected" ? (
          <SectionPanel>
            <p className="section-label">Arrival</p>
            <h2 className="mt-2 text-2xl text-base-100">
              Mark on-site arrival
            </h2>
            <p className="mt-3 text-sm leading-7 text-base-content/65">
              This starts the in-progress timer and unlocks the worker
              completion flow.
            </p>
            <button
              className="k-btn mt-6"
              onClick={() =>
                withRefresh(
                  () => markWorkerArrivedRequest(jobId),
                  "Arrival marked",
                )
              }
            >
              Mark arrived
            </button>
          </SectionPanel>
        ) : null}

        {(isWorker || isAdmin) &&
        ["in_progress", "worker_selected"].includes(job.status) ? (
          <SectionPanel warm>
            <p className="section-label">Worker closeout</p>
            <h2 className="mt-2 text-2xl text-base-100">Mark work completed</h2>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                withRefresh(async () => {
                  await markWorkCompletedRequest(jobId, completeForm);

                  if (afterProofFile) {
                    await uploadMediaRequest(jobId, {
                      file: afterProofFile,
                      stage: "after_work",
                    });
                    setAfterProofFile(null);
                  }
                }, afterProofFile ? "Marked as completed with after-work proof" : "Marked as completed");
              }}
            >
              <InputField
                label="Final quoted amount"
                value={completeForm.finalQuotedAmount}
                onChange={(e) =>
                  setCompleteForm((prev) => ({
                    ...prev,
                    finalQuotedAmount: e.target.value,
                  }))
                }
              />
              <TextAreaField
                label="Work summary"
                value={completeForm.workSummary}
                onChange={(e) =>
                  setCompleteForm((prev) => ({ ...prev, workSummary: e.target.value }))
                }
              />
              <SingleMediaUploadField
                label="After-work image or video"
                helperText="Upload one image or video showing the finished condition of the work."
                file={afterProofFile}
                onChange={setAfterProofFile}
              />
              <button className="k-btn" type="submit">
                Swipe work completed
              </button>
            </form>
          </SectionPanel>
        ) : null}

        {(isCustomer || isAdmin) &&
          job.status === "completed_pending_confirmation" ? (
          <SectionPanel>
            <p className="section-label">Confirmation</p>
            <h2 className="mt-2 text-2xl text-base-100">
              Confirm within the 2-hour window
            </h2>
            <p className="mt-3 text-sm leading-7 text-base-content/60">
              Confirming closes the job, activates the warranty, and saves your rating + review
              to the worker profile.
            </p>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                withRefresh(
                  () => confirmJobCompletionRequest(jobId, confirmForm),
                  "Job confirmed",
                );
              }}
            >
              <div className="space-y-3">
                <span className="text-sm font-medium text-base-content/80">Rating</span>
                <div className="flex flex-wrap gap-3">
                  {Array.from({ length: 5 }, (_, index) => {
                    const rating = index + 1;

                    return (
                      <button
                        key={rating}
                        className={
                          confirmForm.rating >= rating ? "k-btn" : "k-btn-ghost"
                        }
                        type="button"
                        onClick={() =>
                          setConfirmForm((prev) => ({
                            ...prev,
                            rating,
                          }))
                        }
                      >
                        <Star className="h-4 w-4" />
                        {rating}
                      </button>
                    );
                  })}
                </div>
              </div>
              <TextAreaField
                label="Review"
                value={confirmForm.review}
                onChange={(e) =>
                  setConfirmForm((prev) => ({ ...prev, review: e.target.value }))
                }
              />
              <button className="k-btn" type="submit">
                Confirm job done
              </button>
            </form>
          </SectionPanel>
        ) : null}

        {(isCustomer || isAdmin) &&
          ["completed_pending_confirmation", "completed"].includes(job.status) ? (
          <SectionPanel warm>
            <p className="section-label">Support</p>
            <h2 className="mt-2 text-2xl text-base-100">
              Dispute or warranty flows
            </h2>
            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                withRefresh(
                  () => raiseDisputeRequest(jobId, { issue }),
                  "Dispute raised",
                );
              }}
            >
              <TextAreaField
                label="Dispute notes"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
              />
              <button className="k-btn-ghost" type="submit">
                Raise dispute
              </button>
            </form>

            {job.warranty?.status === "active" ? (
              <form
                className="mt-6 space-y-4 surface-divider pt-6"
                onSubmit={(e) => {
                  e.preventDefault();
                  withRefresh(
                    () => claimWarrantyRequest(jobId, { notes: warrantyNotes }),
                    "Warranty claimed",
                  );
                }}
              >
                <TextAreaField
                  label="Warranty claim notes"
                  value={warrantyNotes}
                  onChange={(e) => setWarrantyNotes(e.target.value)}
                />
                <button className="k-btn" type="submit">
                  Claim 7-day warranty
                </button>
              </form>
            ) : null}
          </SectionPanel>
        ) : null}

        {["completed", "warranty_claimed", "disputed"].includes(job.status) ? (
          <SectionPanel>
            <p className="section-label">Final feedback</p>
            <h2 className="mt-2 text-2xl text-base-100">Rating, review, and warranty state</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-[1.4rem] border border-white/6 bg-white/3 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                  Final rating
                </p>
                <p className="mt-2 text-2xl text-base-100">
                  {job.finalRating ? `${job.finalRating}/5` : "Not rated"}
                </p>
              </div>
              <div className="rounded-[1.4rem] border border-white/6 bg-white/3 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                  Coins awarded
                </p>
                <p className="mt-2 text-2xl text-base-100">{job.coinsAwarded || 0}</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/6 bg-white/3 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-base-content/45">
                  Warranty
                </p>
                <p className="mt-2 text-2xl text-base-100">
                  {job.warranty?.status || "inactive"}
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-white/6 bg-white/3 p-5">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-warning" />
                <h3 className="text-lg text-base-100">Customer review</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-base-content/68">
                {job.finalReview || "No written review has been saved for this job yet."}
              </p>
            </div>
          </SectionPanel>
        ) : null}
      </div>
    </MotionPage>
  );
}
