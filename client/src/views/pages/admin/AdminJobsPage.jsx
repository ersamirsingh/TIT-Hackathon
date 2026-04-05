import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { deleteJobRequest, getAdminJobsRequest } from "../../../models/admin.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import { formatCurrency } from "../../../models/format.model.js";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState([]);

  const load = async () => {
    try {
      const response = await getAdminJobsRequest();
      setJobs(response.data.jobs || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load jobs");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Admin jobs"
        title="Audit the live job stream"
        description="Inspect pricing, states, assigned workers, and delete broken or fraudulent entries when necessary."
      />
      <SectionPanel>
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Worker</th>
                <th>Amount</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job._id}>
                  <td>
                    <Link className="link-accent" to={`/app/admin/jobs/${job._id}`}>
                      {job.title}
                    </Link>
                  </td>
                  <td>{job.status}</td>
                  <td>{job.customer?.Name || "Unknown"}</td>
                  <td>{job.selectedWorker?.Name || "Unassigned"}</td>
                  <td>{formatCurrency(job.pricing?.totalUserPayable || job.wage || 0)}</td>
                  <td>
                    <button
                      className="btn btn-xs"
                      onClick={async () => {
                        try {
                          await deleteJobRequest(job._id);
                          toast.success("Job deleted");
                          await load();
                        } catch (error) {
                          toast.error(error.response?.data?.message || "Delete failed");
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </MotionPage>
  );
}
