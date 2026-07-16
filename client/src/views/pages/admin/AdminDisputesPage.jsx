import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { deleteDisputeRequest, getAdminDisputesRequest } from "../../../models/admin.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);

  const load = async () => {
    try {
      const response = await getAdminDisputesRequest();
      setDisputes(response.data.disputes || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load disputes");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Admin disputes"
        title="Resolve repair quality conflicts"
        description="Review open disputes, assign mediators, and close the loop before the marketplace trust layer degrades."
      />
      <SectionPanel>
        <div className="table-shell">
          <table className="table">
            <thead>
              <tr>
                <th>Issue</th>
                <th>Status</th>
                <th>Raised by</th>
                <th>Against</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {disputes.map((dispute) => (
                <tr key={dispute._id}>
                  <td>
                    <Link className="link-accent" to={`/app/admin/disputes/${dispute._id}`}>
                      {dispute.issue}
                    </Link>
                  </td>
                  <td>{dispute.status}</td>
                  <td>{dispute.raisedBy?.Name || "Unknown"}</td>
                  <td>{dispute.againstWorker?.Name || "Unknown"}</td>
                  <td>
                    <button
                      className="btn btn-xs"
                      onClick={async () => {
                        try {
                          await deleteDisputeRequest(dispute._id);
                          toast.success("Dispute deleted");
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
