import { Navigate, Route, Routes } from "react-router-dom";
import { useAppController } from "./controllers/AppController.jsx";
import ProtectedRoute from "./views/components/ProtectedRoute.jsx";
import PublicLayout from "./views/layouts/PublicLayout.jsx";
import DashboardLayout from "./views/layouts/DashboardLayout.jsx";
// Feature: Landing
import LandingPage from "./features/landing/LandingPage.jsx";
// Feature: Auth
import LoginPage from "./features/auth/LoginPage.jsx";
import RegisterPage from "./features/auth/RegisterPage.jsx";
// Feature: Jobs (customer + worker)
import CustomerDashboardPage from "./features/jobs/CustomerDashboardPage.jsx";
import CreateJobPage from "./features/jobs/CreateJobPage.jsx";
import JobDetailPage from "./features/jobs/JobDetailPage.jsx";
import WorkerFeedPage from "./features/jobs/WorkerFeedPage.jsx";
import WorkerJobsPage from "./features/jobs/WorkerJobsPage.jsx";
// Feature: Profile
import WorkerProfilePage from "./features/profile/WorkerProfilePage.jsx";
import SharedProfilePage from "./features/profile/SharedProfilePage.jsx";
// Feature: Wallet
import WalletPage from "./features/wallet/WalletPage.jsx";
// Feature: Admin
import AdminOverviewPage from "./features/admin/AdminOverviewPage.jsx";
import AdminUsersPage from "./features/admin/AdminUsersPage.jsx";
import AdminUserDetailPage from "./features/admin/AdminUserDetailPage.jsx";
import AdminJobsPage from "./features/admin/AdminJobsPage.jsx";
import AdminJobDetailPage from "./features/admin/AdminJobDetailPage.jsx";
import AdminDisputesPage from "./features/admin/AdminDisputesPage.jsx";
import AdminDisputeDetailPage from "./features/admin/AdminDisputeDetailPage.jsx";
import AdminAdsPage from "./features/admin/AdminAdsPage.jsx";
// Feature: Support
import ContactPage from "./features/support/ContactPage.jsx";
// Shared views
import NotFoundPage from "./views/pages/NotFoundPage.jsx";
import PublicRoute from "./views/components/PublicRoute.jsx";

function AppEntryRedirect() {
  const { user } = useAppController();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === "admin" || user.role === "system_admin") {
    return <Navigate to="/app/admin/overview" replace />;
  }

  if (user.activeMode === "worker") {
    return <Navigate to="/app/worker/feed" replace />;
  }

  return <Navigate to="/app/employer/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>

      <Route element={<PublicLayout />}>
        <Route
          path="/"
          element={
            <PublicRoute>
              <LandingPage />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />

        <Route
          path="/contact"
          element={
            <ContactPage />
          }
        />
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
        <Route path="contact" element={<ContactPage />} />

        <Route path="employer/dashboard" element={<CustomerDashboardPage />} />
        <Route path="employer/new-job" element={<CreateJobPage />} />
        <Route path="employer/wallet" element={<WalletPage />} />
        <Route path="employer/jobs/:jobId" element={<JobDetailPage />} />

        <Route path="worker/feed" element={<WorkerFeedPage />} />
        <Route path="worker/work" element={<WorkerJobsPage />} />
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

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
