import { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  clearAuth,
  getTokenExpiry,
  isTokenExpired,
  notifySessionExpired,
} from "../utils/auth";

const homeForRole = (role) => {
  if (role === "owner") return "/owner/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/user/home";
};

export default function ProtectedRoute({ children, role, admin = false }) {
  const location = useLocation();
  const token = admin ? localStorage.getItem("adminToken") : localStorage.getItem("token");
  const currentRole = localStorage.getItem("role");
  const tokenExpired = Boolean(token) && isTokenExpired(token);

  useEffect(() => {
    if (!token || tokenExpired) return undefined;

    const expiry = getTokenExpiry(token);
    if (!expiry) return undefined;

    const delay = expiry - Date.now();
    if (delay <= 0) {
      notifySessionExpired(admin);
      return undefined;
    }

    const timeout = setTimeout(() => notifySessionExpired(admin), delay);
    return () => clearTimeout(timeout);
  }, [token, tokenExpired, admin]);

  if (!token || tokenExpired) {
    if (tokenExpired) clearAuth();

    return (
      <Navigate
        to={admin ? "/admin/login" : "/login"}
        replace
        state={{
          from: `${location.pathname}${location.search}`,
          sessionExpired: tokenExpired,
        }}
      />
    );
  }

  if (admin && currentRole !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }

  if (role && currentRole !== role) {
    return <Navigate to={homeForRole(currentRole)} replace />;
  }

  return children;
}
