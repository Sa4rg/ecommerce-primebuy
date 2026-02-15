import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";

export function RequireAdmin({ children }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
