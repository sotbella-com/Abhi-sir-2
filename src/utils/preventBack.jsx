import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PreventBack = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = () => {
      navigate("/", { replace: true });
    };

    // Push a dummy state so back button triggers popstate
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  return null;
};

export default PreventBack;