import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  assignMediatorRequest,
  getAdminDisputeDetailsRequest,
  getMediatorsRequest,
  resolveDisputeRequest,
} from "../../../models/admin.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import DetailGrid from "../../components/DetailGrid.jsx";
import { InputField } from "../../components/FormField.jsx";

export default function AdminDisputeDetailPage() {
  const { disputeId } = useParams();
  const [dispute, setDispute] = useState(null);
  const [mediators, setMediators] = useState([]);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [selectedMediator, setSelectedMediator] = useState("");

  const load = async () => {
    try {
      const [disputeResponse, mediatorsResponse] = await Promise.all([
        getAdminDisputeDetailsRequest(disputeId),
        getMediatorsRequest(),
      ]);
      setDispute(disputeResponse.data.dispute);
      setMediators(mediatorsResponse.data.mediators || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load dispute detail");
    }
  };

  useEffect(() => {
    load();
  }, [disputeId]);

  if (!dispute) {
    return null;
  }

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Dispute detail"
        title={dispute.issue}
        description="Assign a mediator or resolve the case with final notes."
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <SectionPanel>
          <DetailGrid
            items={[
              { label: "Status", value: dispute.status },
              { label: "Raised by", value: dispute.raisedBy?.Name || "Unknown" },
              { label: "Against worker", value: dispute.againstWorker?.Name || "Unknown" },
              { label: "Mediator", value: dispute.mediator?.Name || "Unassigned" },
            ]}
          />
        </SectionPanel>

        <SectionPanel warm>
          <div className="space-y-5">
            <div>
              <p className="section-label">Assign mediator</p>
              <select
                className="k-select mt-4"
                value={selectedMediator}
                onChange={(event) => setSelectedMediator(event.target.value)}
              >
                <option value="">Choose mediator</option>
                {mediators.map((mediator) => (
                  <option key={mediator._id} value={mediator._id}>
                    {mediator.Name}
                  </option>
                ))}
              </select>
              <button
                className="k-btn mt-4"
                onClick={async () => {
                  try {
                    await assignMediatorRequest(disputeId, selectedMediator);
                    toast.success("Mediator assigned");
                    await load();
                  } catch (error) {
                    toast.error(error.response?.data?.message || "Assignment failed");
                  }
                }}
              >
                Assign mediator
              </button>
            </div>
            <div className="surface-divider pt-5">
              <InputField
                label="Resolution notes"
                value={resolutionNotes}
                onChange={(event) => setResolutionNotes(event.target.value)}
              />
              <button
                className="k-btn mt-4"
                onClick={async () => {
                  try {
                    await resolveDisputeRequest(disputeId, { resolutionNotes });
                    toast.success("Dispute resolved");
                    await load();
                  } catch (error) {
                    toast.error(error.response?.data?.message || "Resolution failed");
                  }
                }}
              >
                Resolve dispute
              </button>
            </div>
          </div>
        </SectionPanel>
      </div>
    </MotionPage>
  );
}
