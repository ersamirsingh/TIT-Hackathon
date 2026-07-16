import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Activity, Layers, ShieldAlert, Users, TrendingUp, UserPlus } from "lucide-react";
import { getAdminOverviewRequest, runMaintenanceRequest, createSystemAdminRequest } from "../../../models/admin.model.js";
import { useAppController } from "../../../controllers/AppController.jsx";
import MotionPage from "../../components/MotionPage.jsx";
import PageHeader from "../../components/PageHeader.jsx";
import MetricCard from "../../components/MetricCard.jsx";
import SectionPanel from "../../components/SectionPanel.jsx";
import { InputField } from "../../components/FormField.jsx";
import { formatCurrency } from "../../../models/format.model.js";

export default function AdminOverviewPage() {
  const { user } = useAppController();
  const [overview, setOverview] = useState(null);
  const [adminForm, setAdminForm] = useState({ Name: "", emailId: "", contact: "", password: "" });
  const [submittingAdmin, setSubmittingAdmin] = useState(false);

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

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminForm.Name || !adminForm.emailId || !adminForm.contact || !adminForm.password) {
      toast.error("Please fill in all system admin fields");
      return;
    }
    setSubmittingAdmin(true);
    try {
      await createSystemAdminRequest(adminForm);
      toast.success("System admin created successfully!");
      setAdminForm({ Name: "", emailId: "", contact: "", password: "" });
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create system admin");
    } finally {
      setSubmittingAdmin(false);
    }
  };

  // SVG Chart calculation
  const timeline = overview?.revenueTimeline || [];
  const maxRevenue = Math.max(...timeline.map((item) => item.revenue), 100);
  const svgWidth = 600;
  const svgHeight = 160;
  const points = timeline.map((item, index) => {
    const x = (index / Math.max(1, timeline.length - 1)) * svgWidth;
    const y = svgHeight - (item.revenue / maxRevenue) * (svgHeight - 30) - 15;
    return `${x},${y}`;
  }).join(" ");

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Total users" value={overview?.totalUsers || 0} hint="All accounts" icon={Users} />
        <MetricCard label="Active jobs" value={overview?.activeJobs || 0} hint="Live booking flow" icon={Activity} />
        <MetricCard label="Active disputes" value={overview?.activeDisputes || 0} hint="Needs attention" icon={ShieldAlert} />
        <MetricCard label="Platform revenue" value={formatCurrency(overview?.platformRevenue || 0)} hint="Trust & Rocket Mode fees" icon={Layers} />
        <MetricCard label="Ambiguous jobs" value={overview?.ambiguousJobs || 0} hint="Stale or disputed" icon={ShieldAlert} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* SVG Revenue Timeline Graph */}
        <SectionPanel>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-warning" />
              <h2 className="text-xl font-bold text-base-100">Revenue Timeline (30 Days)</h2>
            </div>
            <span className="text-xs uppercase tracking-widest text-base-content/50">Daily Platform earnings</span>
          </div>

          <div className="w-full bg-[#090d14] rounded-2xl p-4 border border-white/5 relative overflow-hidden">
            {timeline.length > 0 ? (
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-44 overflow-visible">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab308" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                
                {/* Grid lines */}
                <line x1="0" y1={svgHeight - 15} x2={svgWidth} y2={svgHeight - 15} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                
                {/* Area under the line */}
                {points && (
                  <polygon
                    points={`0,${svgHeight - 15} ${points} ${svgWidth},${svgHeight - 15}`}
                    fill="url(#chartGradient)"
                  />
                )}
                
                {/* Stroke line */}
                {points && (
                  <polyline
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="2.5"
                    points={points}
                  />
                )}

                {/* Hotspot circles */}
                {timeline.map((item, index) => {
                  const x = (index / Math.max(1, timeline.length - 1)) * svgWidth;
                  const y = svgHeight - (item.revenue / maxRevenue) * (svgHeight - 30) - 15;
                  return (
                    <g key={index} className="group cursor-pointer">
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        className="fill-warning stroke-[#0c0f17] stroke-2 hover:r-6 transition-all"
                      />
                      <title>{`${item.date}: ₹${item.revenue}`}</title>
                    </g>
                  );
                })}
              </svg>
            ) : (
              <div className="h-44 flex items-center justify-center text-sm text-base-content/50">
                No revenue timeline data available
              </div>
            )}
          </div>
        </SectionPanel>

        {/* Worker health metrics */}
        <SectionPanel warm>
          <h2 className="text-xl font-bold text-base-100 mb-4">Supply & Subscription</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-white/4 p-4 border border-white/5">
              <span className="text-sm text-base-content/70">Available workers</span>
              <span className="text-2xl font-bold text-base-100">{overview?.availableWorkers || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/4 p-4 border border-white/5">
              <span className="text-sm text-base-content/70">Blocked wallets</span>
              <span className="text-2xl font-bold text-base-100">{overview?.blockedWallets || 0}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white/4 p-4 border border-white/5">
              <span className="text-sm text-base-content/70">Active subscriptions</span>
              <span className="text-2xl font-bold text-base-100">{overview?.activeSubscriptions || 0}</span>
            </div>
          </div>
        </SectionPanel>
      </div>

      {/* Create System Admin (Visible only to System Admins) */}
      {(user?.role === "system_admin") && (
        <SectionPanel>
          <div className="flex items-center gap-3 mb-6">
            <UserPlus className="h-6 w-6 text-warning" />
            <div>
              <h2 className="text-2xl font-bold text-base-100">Create New System Admin</h2>
              <p className="text-sm text-base-content/60 mt-1">Register another system admin to manage the Karigar marketplace</p>
            </div>
          </div>

          <form onSubmit={handleCreateAdmin} className="grid gap-5 md:grid-cols-2 max-w-4xl">
            <InputField
              label="Admin Name"
              placeholder="e.g. John Doe"
              value={adminForm.Name}
              onChange={(e) => setAdminForm(prev => ({ ...prev, Name: e.target.value }))}
              required
            />
            <InputField
              label="Admin Email"
              type="email"
              placeholder="e.g. admin@karigar.com"
              value={adminForm.emailId}
              onChange={(e) => setAdminForm(prev => ({ ...prev, emailId: e.target.value }))}
              required
            />
            <InputField
              label="Admin Contact (Phone)"
              placeholder="e.g. 9876543210"
              value={adminForm.contact}
              onChange={(e) => setAdminForm(prev => ({ ...prev, contact: e.target.value }))}
              required
            />
            <InputField
              label="Temporary Password"
              type="password"
              placeholder="Set a temp password"
              value={adminForm.password}
              onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
              required
            />

            <div className="md:col-span-2 mt-2">
              <button className="k-btn w-full md:w-auto px-8" type="submit" disabled={submittingAdmin}>
                {submittingAdmin ? "Creating Admin..." : "Create System Admin"}
              </button>
            </div>
          </form>
        </SectionPanel>
      )}
    </MotionPage>
  );
}
