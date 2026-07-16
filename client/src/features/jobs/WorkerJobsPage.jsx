import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getMyJobsRequest } from "../../models/job.model.js";
import MotionPage from "../../views/components/MotionPage.jsx";
import PageHeader from "../../views/components/PageHeader.jsx";
import SectionPanel from "../../views/components/SectionPanel.jsx";
import EmptyState from "../../views/components/EmptyState.jsx";
import JobCard from "../../views/components/JobCard.jsx";
import { useAppController } from "../../controllers/AppController.jsx";

const TABS = [
  { id: "all", label: "All Jobs", description: "All jobs you have ever applied to or worked on." },
  { id: "active", label: "Ongoing Work", description: "Jobs you are currently working on or waiting for customer confirmation." },
  { id: "completed", label: "Completed", description: "Jobs you successfully resolved and completed." },
  { id: "cancelled", label: "Cancelled", description: "Jobs that were cancelled or abandoned." },
  { id: "applied", label: "Applied & Offers", description: "Jobs where you expressed interest and are awaiting selection." },
];

export default function WorkerJobsPage() {
  const { user } = useAppController();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const loadJobs = async () => {
    setLoading(true);
    try {
      const response = await getMyJobsRequest();
      const allJobs = response.data?.jobs || [];
      setJobs(allJobs);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load your work dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [user?._id]);

  const filterJobs = () => {
    const userId = String(user?._id || "");
    return jobs.filter((job) => {
      const isAssigned = String(job.selectedWorker?._id || job.selectedWorker || "") === userId;
      
      const hasApplied = (job.applications || []).some(
        (app) => String(app.worker?._id || app.worker || "") === userId
      );

      if (activeTab === "all") {
        return isAssigned || hasApplied;
      }

      if (activeTab === "active") {
        return isAssigned && ["worker_selected", "in_progress", "completed_pending_confirmation"].includes(job.status);
      }
      
      if (activeTab === "completed") {
        return isAssigned && ["completed", "warranty_claimed", "disputed"].includes(job.status);
      }
      
      if (activeTab === "cancelled") {
        return (isAssigned || hasApplied) && job.status === "cancelled";
      }
      
      if (activeTab === "applied") {
        return hasApplied && !isAssigned && job.status !== "cancelled";
      }

      return false;
    });
  };

  const filtered = filterJobs();

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="My Work"
        title="Your Karigar Dashboard"
        description="Track your assigned requests, review your completed job history, and manage your active offers in one place."
      />

      {/* Tabs */}
      <div className="flex flex-col gap-4 rounded-[1.75rem] border border-white/6 bg-white/3 p-6">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-full text-xs font-semibold border transition ${
                activeTab === tab.id
                  ? "border-warning bg-warning text-black shadow-lg"
                  : "border-white/10 bg-white/3 text-base-content/75 hover:bg-white/6 hover:text-base-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-base-content/60 italic">
          {TABS.find((t) => t.id === activeTab)?.description}
        </p>
      </div>

      {/* Job list */}
      <SectionPanel>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <span className="loading loading-ring loading-lg text-warning" />
          </div>
        ) : filtered.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {filtered.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                href={`/app/worker/jobs/${job._id}`}
                showAssignment={activeTab !== "applied"}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={`No ${activeTab} jobs found`}
            copy={`You don't have any jobs matching this filter right now. Check out the "Explore Jobs" tab to find new work!`}
          />
        )}
      </SectionPanel>
    </MotionPage>
  );
}
