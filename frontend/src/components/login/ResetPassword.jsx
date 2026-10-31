import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import API from "../../api";
import { toast } from "react-toastify";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await API.post(`/auth/reset-password/${token}`, form);
      toast.success("Password reset successfully. Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset link is invalid or expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow p-4" style={{ maxWidth: "440px", width: "100%" }}>
        <h3 className="fw-bold text-center mb-3">Reset Password</h3>

        <form onSubmit={handleSubmit}>
          <label className="form-label">New password</label>
          <input
            type="password"
            className="form-control mb-3"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            minLength={8}
            required
          />

          <label className="form-label">Confirm new password</label>
          <input
            type="password"
            className="form-control mb-3"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            minLength={8}
            required
          />

          <button className="btn btn-danger w-100" disabled={loading}>
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
