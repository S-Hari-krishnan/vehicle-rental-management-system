import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api";
import { toast } from "react-toastify";
import "./login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post("/auth/forgot-password", { email });
      toast.success(res.data.message);
      setResetUrl(res.data.resetUrl || "");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to generate reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="card shadow p-4" style={{ maxWidth: "460px", width: "100%" }}>
        <h3 className="fw-bold text-center mb-3">Forgot Password</h3>
        <p className="text-muted text-center">
          Enter your account email to generate a reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button className="btn btn-danger w-100" disabled={loading}>
            {loading ? "Generating..." : "Generate reset link"}
          </button>
        </form>

        {resetUrl && (
          <div className="alert alert-info mt-3 small">
            <strong>Development reset link:</strong>
            <br />
            <Link to={resetUrl.replace(window.location.origin, "")}>{resetUrl}</Link>
          </div>
        )}

        <div className="text-center mt-3">
          <Link to="/login">Back to login</Link>
        </div>
      </div>
    </div>
  );
}
