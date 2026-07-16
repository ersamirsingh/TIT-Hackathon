import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Activity, Layers, ShieldAlert, Users, TrendingUp, UserPlus, HelpCircle, Eye, CheckCircle, AlertTriangle } from "lucide-react";
import {
  getAdminOverviewRequest,
  runMaintenanceRequest,
  createSystemAdminRequest,
  getAdminQueriesRequest,
  resolveAdminQueryRequest,
} from "../../models/admin.model.js";
import { useAppController } from "../../controllers/AppController.jsx";
import MotionPage from "../../views/components/MotionPage.jsx";
import PageHeader from "../../views/components/PageHeader.jsx";
import MetricCard from "../../views/components/MetricCard.jsx";
import SectionPanel from "../../views/components/SectionPanel.jsx";
import { InputField, TextAreaField } from "../../views/components/FormField.jsx";
import { formatCurrency, formatDate } from "../../models/format.model.js";

export default function AdminOverviewPage() {
  const { user } = useAppController();
  const [overview, setOverview] = useState(null);
  const [adminForm, setAdminForm] = useState({ Name: "", emailId: "", contact: "", password: "" });
  const [submittingAdmin, setSubmittingAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Support Queries state
  const [queries, setQueries] = useState([]);
  const [resolvingQueryId, setResolvingQueryId] = useState(null);
  const [queryNotes, setQueryNotes] = useState("");
  const [loadingQueries, setLoadingQueries] = useState(false);

  const load = async () => {
    try {
      const response = await getAdminOverviewRequest();
      setOverview(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load admin overview");
    }
  };

  const loadQueries = async () => {
    setLoadingQueries(true);
    try {
      const response = await getAdminQueriesRequest();
      setQueries(response.queries || response.data?.queries || []);
    } catch (error) {
      toast.error("Could not load support queries");
    } finally {
      setLoadingQueries(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (activeTab === "queries") {
      loadQueries();
    }
  }, [activeTab]);

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

  const handleResolveQuerySubmit = async (e, id) => {
    e.preventDefault();
    try {
      await resolveAdminQueryRequest(id, { adminNotes: queryNotes });
      toast.success("Query marked as resolved");
      setResolvingQueryId(null);
      setQueryNotes("");
      await loadQueries();
    } catch (error) {
      toast.error("Could not resolve support query");
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
        eyebrow="Admin Desk"
        title="Karigar Operational Center"
        description="Monitor marketplace activity, analyze ambiguities, track suspicious behavior, and solve customer/worker queries."
        actions={
          <button
            className="k-btn"
            onClick={async () => {
              try {
                await runMaintenanceRequest();
                toast.success("Lifecycle maintenance executed");
                await load();
                if (activeTab === "queries") await loadQueries();
              } catch (error) {
                toast.error(error.response?.data?.message || "Maintenance failed");
              }
            }}
          >
            Run maintenance
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        {[
          { id: "overview", label: "Overview & Revenue" },
          { id: "ambiguity", label: "Ambiguity Analyzer" },
          { id: "suspicious", label: "Suspicious Activity" },
          { id: "queries", label: "User Support Queries" }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition ${
              activeTab === t.id
                ? "border-warning text-warning"
                : "border-transparent text-base-content/60 hover:text-base-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 animate-fadeIn">
            <MetricCard label="Total users" value={overview?.totalUsers || 0} hint="All accounts" icon={Users} />
            <MetricCard label="Active jobs" value={overview?.activeJobs || 0} hint="Live booking flow" icon={Activity} />
            <MetricCard label="Active disputes" value={overview?.activeDisputes || 0} hint="Needs attention" icon={ShieldAlert} />
            <MetricCard label="Platform revenue" value={formatCurrency(overview?.platformRevenue || 0)} hint="Trust & Rocket Mode fees" icon={Layers} />
            <MetricCard label="Ambiguous jobs" value={overview?.ambiguousJobs || 0} hint="Stale or disputed" icon={AlertTriangle} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] animate-fadeIn">
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
                    
                    <line x1="0" y1={svgHeight - 15} x2={svgWidth} y2={svgHeight - 15} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                    <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                    
                    {points && (
                      <polygon
                        points={`0,${svgHeight - 15} ${points} ${svgWidth},${svgHeight - 15}`}
                        fill="url(#chartGradient)"
                      />
                    )}
                    
                    {points && (
                      <polyline
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="2.5"
                        points={points}
                      />
                    )}

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

          {user?.role === "system_admin" && (
            <SectionPanel className="animate-fadeIn">
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
        </>
      )}

      {activeTab === "ambiguity" && (
        <SectionPanel className="animate-fadeIn">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <h2 className="text-xl font-bold text-base-100">Ambiguity Analyzer</h2>
          </div>
          <p className="text-sm text-base-content/65 mb-6">
            Ambiguous jobs are active requests in stages `worker_selected` or `in_progress` that have been sitting stale for more than 24 hours without completion or cancellations.
          </p>

          {(overview?.stuckJobs || []).length ? (
            <div className="table-shell">
              <table className="table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Customer</th>
                    <th>Assigned Worker</th>
                    <th>Current Status</th>
                    <th>Created When</th>
                    <th>Ambiguity Cause</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.stuckJobs.map((job) => (
                    <tr key={job._id}>
                      <td className="font-semibold text-base-100">{job.title}</td>
                      <td>{job.customer?.Name || "Deleted User"} ({job.customer?.contact})</td>
                      <td>{job.selectedWorker?.Name || "Not assigned"}</td>
                      <td>
                        <span className="status-chip">{job.status}</span>
                      </td>
                      <td>{formatDate(job.createdAt)}</td>
                      <td className="text-warning font-medium">Stale job progress (exceeds 24-hour SLA window)</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-base-content/50 border border-white/5 rounded-2xl bg-white/3">
              🎉 No ambiguous or stale jobs detected in the marketplace right now!
            </div>
          )}
        </SectionPanel>
      )}

      {activeTab === "suspicious" && (
        <div className="grid gap-6 xl:grid-cols-2 animate-fadeIn">
          <SectionPanel>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-6 w-6 text-warning" />
              <h2 className="text-xl font-bold text-base-100">Negative Wallet Balances</h2>
            </div>
            <p className="text-xs text-base-content/60 mb-4">
              Workers who exceeded the default ₹-200 credit limit and require top-ups.
            </p>

            {(overview?.suspiciousWorkers || []).length ? (
              <div className="table-shell">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Worker Name</th>
                      <th>Contact</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.suspiciousWorkers.map((w) => (
                      <tr key={w._id}>
                        <td className="font-semibold text-base-100">{w.Name}</td>
                        <td>{w.contact}</td>
                        <td className="text-error font-bold">₹{w.wallet?.balance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-base-content/50">
                No workers currently below maximum credit limits.
              </div>
            )}
          </SectionPanel>

          <SectionPanel>
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-6 w-6 text-warning" />
              <h2 className="text-xl font-bold text-base-100">Blocked Wallet Accounts</h2>
            </div>
            <p className="text-xs text-base-content/60 mb-4">
              Accounts flagged and suspended from the dispatch feed due to suspicious activity.
            </p>

            {(overview?.blockedUsers || []).length ? (
              <div className="table-shell">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Contact</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.blockedUsers.map((u) => (
                      <tr key={u._id}>
                        <td className="font-semibold text-base-100">{u.Name}</td>
                        <td>{u.contact}</td>
                        <td>{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-base-content/50">
                No blocked wallet users in database.
              </div>
            )}
          </SectionPanel>
        </div>
      )}

      {activeTab === "queries" && (
        <SectionPanel className="animate-fadeIn">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="h-6 w-6 text-warning" />
            <h2 className="text-xl font-bold text-base-100">User Query Resolver</h2>
          </div>
          <p className="text-sm text-base-content/65 mb-6">
            Review support queries sent by users from the contact page. Resolve them and save internal admin investigation notes.
          </p>

          {loadingQueries ? (
            <div className="py-12 text-center">
              <span className="loading loading-ring loading-md text-warning" />
            </div>
          ) : queries.length ? (
            <div className="space-y-4">
              {queries.map((q) => (
                <div
                  key={q._id}
                  className={`rounded-2xl border p-5 space-y-4 transition ${
                    q.status === "resolved" 
                      ? "border-white/5 bg-white/2 opacity-70" 
                      : "border-warning/30 bg-warning/5"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-warning font-semibold block">
                        Subject: {q.subject}
                      </span>
                      <span className="text-lg font-bold text-base-100 block mt-1">
                        {q.name} ({q.email} {q.phone ? `| ${q.phone}` : ""})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        q.status === "resolved" ? "bg-green-500/10 text-green-400" : "bg-warning/10 text-warning"
                      }`}>
                        {q.status}
                      </span>
                      <span className="text-xs text-base-content/40">{formatDate(q.createdAt)}</span>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-3 border border-white/5 text-sm text-base-content/80 leading-6">
                    <p className="font-semibold text-white/50 text-xs mb-1 uppercase tracking-wider">User Message:</p>
                    {q.message}
                  </div>

                  {q.status === "resolved" ? (
                    <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/15 text-sm text-green-400/80 leading-6">
                      <p className="font-semibold text-green-400/50 text-xs mb-1 uppercase tracking-wider">Admin Resolution Notes:</p>
                      {q.adminNotes || "Resolved successfully."}
                    </div>
                  ) : (
                    <div className="pt-2">
                      {resolvingQueryId === q._id ? (
                        <form onSubmit={(e) => handleResolveQuerySubmit(e, q._id)} className="space-y-3 max-w-xl">
                          <TextAreaField
                            label="Internal Admin Notes"
                            placeholder="Describe how the query was resolved (e.g. processed refund, called user)..."
                            value={queryNotes}
                            onChange={(e) => setQueryNotes(e.target.value)}
                            required
                          />
                          <div className="flex gap-2">
                            <button type="submit" className="k-btn px-4 py-1.5 text-xs">
                              Submit Resolution
                            </button>
                            <button
                              type="button"
                              onClick={() => { setResolvingQueryId(null); setQueryNotes(""); }}
                              className="k-btn-ghost px-4 py-1.5 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setResolvingQueryId(q._id)}
                          className="k-btn text-xs px-4 py-2 flex items-center gap-1"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Resolve Query</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-base-content/50 border border-white/5 rounded-2xl bg-white/3">
              No user support queries submitted yet.
            </div>
          )}
        </SectionPanel>
      )}
    </MotionPage>
  );
}
