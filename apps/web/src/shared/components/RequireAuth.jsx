import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export function RequireAuth({ children }) {
  const location = useLocation();
  const { status, isAuthenticated } = useAuth();

  if (status === "checking") return <p>Checking session...</p>;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
