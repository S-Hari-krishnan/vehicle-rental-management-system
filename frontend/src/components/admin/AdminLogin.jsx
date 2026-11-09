import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../../api";
import "./adminlogin.css";
import { toast } from "react-toastify";
import {
  clearAuth,
  isTokenExpired,
  SESSION_EXPIRED_MESSAGE,
} from "../../utils/auth";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const adminToken = localStorage.getItem("adminToken");
    if (!adminToken) return;

    if (isTokenExpired(adminToken)) {
      clearAuth();
      return;
    }

    navigate("/admin/dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!location.state?.sessionExpired) return;

    toast.warning(SESSION_EXPIRED_MESSAGE, { toastId: "session-expired" });
    navigate("/admin/login", { replace: true });
  }, [location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/admin/login", { email, password });
      clearAuth();
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("role", "admin");
      toast.success("Admin login successful");
      navigate("/admin/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-wrapper d-flex justify-content-center align-items-center">
      <div className="card shadow-lg p-4" style={{ width: "100%", maxWidth: "380px" }}>
        <h3 className="text-center mb-4 fw-bold">Admin Login</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Email</label>
            <input
              type="email"
              className="form-control form-control-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
            />
          </div>

          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control form-control-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button className="btn btn-primary btn-lg w-100 mt-2" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/login">Back to user login</Link>
        </div>
      </div>
    </div>
  );
}
