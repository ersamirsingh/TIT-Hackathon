import { Navigate } from "react-router-dom";
import { useAppController } from "../../controllers/AppController";

export default function PublicRoute({ children }) {
   const { user, isLoading } = useAppController();

   if (isLoading) return null; // or loader

   if (user) {
      // Role-based redirect
      if (user.role === "admin") {
         return <Navigate to="/app/admin/overview" replace />;
      }

      if (user.activeMode === "worker") {
         return <Navigate to="/app/worker/feed" replace />;
      }

      return <Navigate to="/app/customer/dashboard" replace />;
   }

   return children;
}