import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const PrivateRoute = () => {
  const { isAuthenticated, authReady } = useAuth();
  const location = useLocation();

  // While auth is bootstrapping, render nothing or a tiny loader
  if (!authReady) return null; // or a spinner/skeleton

  // After ready, decide
  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/main-login" replace state={{ from: location }} />;
};

export default PrivateRoute;
