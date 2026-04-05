import { Navigate, Route, Routes } from "react-router-dom";
import { useAppController } from "./controllers/AppController.jsx";
import ProtectedRoute from "./views/components/ProtectedRoute.jsx";
import PublicLayout from "./views/layouts/PublicLayout.jsx";
import DashboardLayout from "./views/layouts/DashboardLayout.jsx";
import LandingPage from "./views/pages/LandingPage.jsx";
import LoginPage from "./views/pages/LoginPage.jsx";
import RegisterPage from "./views/pages/RegisterPage.jsx";
import CustomerDashboardPage from "./views/pages/customer/CustomerDashboardPage.jsx";
import CreateJobPage from "./views/pages/customer/CreateJobPage.jsx";
import JobDetailPage from "./views/pages/customer/JobDetailPage.jsx";
import WorkerFeedPage from "./views/pages/worker/WorkerFeedPage.jsx";
import WorkerProfilePage from "./views/pages/worker/WorkerProfilePage.jsx";
import WalletPage from "./views/pages/worker/WalletPage.jsx";
import AdminOverviewPage from "./views/pages/admin/AdminOverviewPage.jsx";
import AdminUsersPage from "./views/pages/admin/AdminUsersPage.jsx";
import AdminUserDetailPage from "./views/pages/admin/AdminUserDetailPage.jsx";
import AdminJobsPage from "./views/pages/admin/AdminJobsPage.jsx";
import AdminJobDetailPage from "./views/pages/admin/AdminJobDetailPage.jsx";
import AdminDisputesPage from "./views/pages/admin/AdminDisputesPage.jsx";
import AdminDisputeDetailPage from "./views/pages/admin/AdminDisputeDetailPage.jsx";
import AdminAdsPage from "./views/pages/admin/AdminAdsPage.jsx";
import SharedProfilePage from "./views/pages/SharedProfilePage.jsx";
import NotFoundPage from "./views/pages/NotFoundPage.jsx";

function AppEntryRedirect() {
  const { user } = useAppController();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin") {
    return <Navigate to="/app/admin/overview" replace />;
  }

  if (user.activeMode === "worker") {
    return <Navigate to="/app/worker/feed" replace />;
  }

  return <Navigate to="/app/customer/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AppEntryRedirect />} />
        <Route path="profile" element={<SharedProfilePage />} />

        <Route path="customer/dashboard" element={<CustomerDashboardPage />} />
        <Route path="customer/new-job" element={<CreateJobPage />} />
        <Route path="customer/jobs/:jobId" element={<JobDetailPage />} />

        <Route path="worker/feed" element={<WorkerFeedPage />} />
        <Route path="worker/profile" element={<WorkerProfilePage />} />
        <Route path="worker/wallet" element={<WalletPage />} />
        <Route path="worker/jobs/:jobId" element={<JobDetailPage />} />

        <Route path="admin/overview" element={<AdminOverviewPage />} />
        <Route path="admin/users" element={<AdminUsersPage />} />
        <Route path="admin/users/:userId" element={<AdminUserDetailPage />} />
        <Route path="admin/jobs" element={<AdminJobsPage />} />
        <Route path="admin/jobs/:jobId" element={<AdminJobDetailPage />} />
        <Route path="admin/disputes" element={<AdminDisputesPage />} />
        <Route path="admin/disputes/:disputeId" element={<AdminDisputeDetailPage />} />
        <Route path="admin/ads" element={<AdminAdsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
