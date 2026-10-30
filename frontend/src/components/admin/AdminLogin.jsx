import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";
import "./adminlogin.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post("/admin/login", {
        email,
        password,
      });

      localStorage.setItem("adminToken", res.data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="admin-login-wrapper d-flex justify-content-center align-items-center">
      <div
        className="card shadow-lg p-4"
        style={{ width: "100%", maxWidth: "380px" }}
      >
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

          <button className="btn btn-primary btn-lg w-100 mt-2">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}