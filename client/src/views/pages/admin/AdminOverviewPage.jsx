import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Activity, Layers, ShieldAlert, Users } from "lucide-react";
import { getAdminOverviewRequest, runMaintenanceRequest } from "../../../models/admin.model.js";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import MetricCard from "../../components/MetricCard.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import { formatCurrency } from "../../../models/format.model.js";

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState(null);

  const load = async () => {
    try {
      const response = await getAdminOverviewRequest();
      setOverview(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load admin overview");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <MotionPage className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Operational overview"
        description="Track live marketplace health, revenue layers, wallet stress, dispute volume, and the current supply of available workers."
        actions={
          <button
            className="k-btn"
            onClick={async () => {
              try {
                await runMaintenanceRequest();
                toast.success("Lifecycle maintenance executed");
                await load();
              } catch (error) {
                toast.error(error.response?.data?.message || "Maintenance failed");
              }
            }}
          >
            Run maintenance
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={overview?.totalUsers || 0} hint="All accounts" icon={Users} />
        <MetricCard label="Active jobs" value={overview?.activeJobs || 0} hint="Live booking flow" icon={Activity} />
        <MetricCard label="Active disputes" value={overview?.activeDisputes || 0} hint="Needs admin attention" icon={ShieldAlert} />
        <MetricCard label="Platform revenue" value={formatCurrency(overview?.platformRevenue || 0)} hint="Across trust fees and Rocket Mode" icon={Layers} />
      </div>

      <SectionPanel>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white/6 bg-white/3 p-5">
            <p className="section-label">Available workers</p>
            <p className="mt-3 text-3xl text-base-100">{overview?.availableWorkers || 0}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/6 bg-white/3 p-5">
            <p className="section-label">Blocked wallets</p>
            <p className="mt-3 text-3xl text-base-100">{overview?.blockedWallets || 0}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/6 bg-white/3 p-5">
            <p className="section-label">Active subscriptions</p>
            <p className="mt-3 text-3xl text-base-100">{overview?.activeSubscriptions || 0}</p>
          </div>
        </div>
      </SectionPanel>
    </MotionPage>
  );
}
