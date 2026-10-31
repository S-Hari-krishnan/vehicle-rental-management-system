import { Navigate, useLocation } from "react-router-dom";

const homeForRole = (role) => {
  if (role === "owner") return "/owner/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/user/home";
};

export default function ProtectedRoute({ children, role, admin = false }) {
  const location = useLocation();
  const token = admin ? localStorage.getItem("adminToken") : localStorage.getItem("token");
  const currentRole = localStorage.getItem("role");

  if (!token) {
    return (
      <Navigate
        to={admin ? "/admin/login" : "/login"}
        replace
        state={{ from: location.pathname }}
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
