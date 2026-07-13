import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const AuthTokenRoute = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
};

export default AuthTokenRoute;
