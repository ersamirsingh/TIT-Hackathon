import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { getAdminJobDetailsRequest } from "../../../models/admin.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import DetailGrid from "../../components/DetailGrid.jsx";
import { formatCurrency, formatDateTime } from "../../../models/format.model.js";

export default function AdminJobDetailPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getAdminJobDetailsRequest(jobId);
        setJob(response.data.job);
      } catch (error) {
        toast.error(error.response?.data?.message || "Could not load job");
      }
    };

    load();
  }, [jobId]);

  if (!job) {
    return null;
  }

  return (
    <MotionPage className="space-y-8">
      <PageHeader eyebrow="Job detail" title={job.title} description={job.description} />
      <SectionPanel>
        <DetailGrid
          items={[
            { label: "Status", value: job.status },
            { label: "Category", value: job.category },
            { label: "Customer", value: job.customer?.Name || "Unknown" },
            { label: "Worker", value: job.selectedWorker?.Name || "Unassigned" },
            { label: "Amount", value: formatCurrency(job.pricing?.totalUserPayable || 0) },
            { label: "Created", value: formatDateTime(job.createdAt) },
            { label: "Location", value: job.locationText || "Unknown" },
            { label: "Warranty", value: job.warranty?.status || "inactive" },
          ]}
        />
      </SectionPanel>
    </MotionPage>
  );
}
