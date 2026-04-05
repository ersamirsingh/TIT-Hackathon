import { Navigate, useLocation } from "react-router-dom";
import { useAppController } from "../../controllers/AppController.jsx";
import LoaderState from "./LoaderState.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAppController();
  const location = useLocation();

  if (loading) {
    return <LoaderState label="Restoring your workspace" />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
