import { Menu, Sparkles, UserRound } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useState } from "react";
import { useAppController } from "../../controllers/AppController.jsx";
import {
  adminNavItems,
  customerNavItems,
  workerNavItems,
} from "../../models/navigation.model.js";

function AppLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-warning/15 text-warning">
        <Sparkles className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-base-content/45">Karigar</p>
        <p className="display-font text-xl text-base-100">Dispatch Console</p>
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout, updateMode } = useAppController();
  const navigate = useNavigate();

  const navItems =
    user?.role === "admin"
      ? adminNavItems
      : user?.activeMode === "worker"
        ? workerNavItems
        : customerNavItems;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleModeSwitch = async () => {
    if (!user || user.role === "admin") {
      return;
    }

    const nextMode = user.activeMode === "worker" ? "customer" : "worker";
    await updateMode(nextMode);
    navigate(nextMode === "worker" ? "/app/worker/feed" : "/app/customer/dashboard");
  };

  return (
    <div className="app-shell">
      <div className="ambient-grid" />
      <div className="floating-blur one" />
      <div className="floating-blur two" />
      <div className="floating-blur three" />

      <div className="relative z-10 flex h-screen overflow-hidden">

        <motion.aside
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          className={`fixed inset-y-0 left-0 z-30 w-80 border-r border-white/6 bg-[#0b0f16]/90 px-6 py-8 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex h-full flex-col">
            <AppLogo />

            <div className="mt-8 rounded-[1.75rem] border border-white/8 bg-white/4 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-base-content/45">
                Signed in as
              </p>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/6">
                  <UserRound className="h-5 w-5 text-base-100" />
                </div>

                <div>
                  <p className="text-base font-semibold text-base-100">
                    {user?.Name}
                  </p>
                  <p className="text-sm text-base-content/60">
                    {user?.emailId}
                  </p>
                </div>
              </div>
            </div>

            <nav className="mt-8 flex flex-1 flex-col gap-2 overflow-y-auto">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center gap-3 rounded-2xl px-4 py-3 transition ${
                      isActive
                        ? "bg-warning/12 text-base-100 shadow-lg shadow-black/20"
                        : "text-base-content/65 hover:bg-white/5 hover:text-base-100"
                    }`
                  }
                >
                  <item.icon className="h-5 w-5 text-warning" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="space-y-3 pt-4">
              {user?.role !== "admin" ? (
                <button className="k-btn-ghost w-full" onClick={handleModeSwitch}>
                  Switch to{" "}
                  {user.activeMode === "worker"
                    ? "work as Employer"
                    : "Work as a Karigar"}
                </button>
              ) : null}

              <button className="k-btn-ghost w-full" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
        </motion.aside>

        {/* 🔥 Main Section */}
        <div className="flex flex-1 flex-col overflow-hidden">

          {/* 🔥 Header */}
          <header className="sticky top-0 z-20 border-b border-white/6 bg-[#0a0d14]/80 px-4 py-4 backdrop-blur-xl md:px-8">
            <div className="flex items-center justify-between gap-4">

              <button
                className="btn btn-ghost rounded-full lg:hidden"
                onClick={() => setDrawerOpen((value) => !value)}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="ml-auto flex items-center gap-3">
                <span className="status-chip">
                  {user?.role === "admin"
                    ? "Admin"
                    : user?.activeMode === "worker"
                    ? "Work as a Karigar"
                    : "Find a Worker"}
                </span>

                <span className="status-chip">
                  {user?.preferredLanguage || "Hindi"}
                </span>
              </div>
            </div>
          </header>

          {/* 🔥 ONLY THIS SCROLLS */}
          <main className="page-wrap flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
