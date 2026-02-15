import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export function RequireAdmin({ children }) {
  const { isAuthenticated, role } = useAuth();

  // No logueado → login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logueado pero no admin → home
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}
