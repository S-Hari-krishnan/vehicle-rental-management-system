import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth, isTokenExpired } from "../utils/auth";

export default function RedirectRoot() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const adminToken = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role");

    if (role === "admin" && adminToken) {
      if (isTokenExpired(adminToken)) {
        clearAuth();
        navigate("/admin/login", {
          replace: true,
          state: { sessionExpired: true },
        });
        return;
      }

      navigate("/admin/dashboard");
      return;
    }

    if (!token) {
      navigate("/home");         // Public Home without login
      return;
    }

    if (isTokenExpired(token)) {
      clearAuth();
      navigate("/login", {
        replace: true,
        state: { sessionExpired: true },
      });
      return;
    }

    if (role === "user") {
      navigate("/user/home");
      return;
    }

    if (role === "owner") {
      navigate("/owner/dashboard");
      return;
    }

    // unknown role → logout fallback
    clearAuth();
    navigate("/login");
  }, [navigate]);

  return null;
}
