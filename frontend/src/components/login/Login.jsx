import { useEffect, useState } from "react";
import "./login.css";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../../api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) return;
    if (role === "owner") navigate("/owner/dashboard");
    else if (role === "admin") navigate("/admin/dashboard");
    else navigate("/user/home");
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setSubmitting(true);

    try {
      const res = await API.post("/auth/login", loginData);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("user", JSON.stringify(res.data.user || {}));

      if (res.data.role === "admin") {
        localStorage.setItem("adminToken", res.data.token);
      }

      toast.success("Login successful!");

      const redirectTo =
        location.state?.from ||
        (res.data.role === "owner"
          ? "/owner/dashboard"
          : res.data.role === "admin"
          ? "/admin/dashboard"
          : "/user/home");

      navigate(redirectTo, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-fluid login-page">
      <ToastContainer />

      <div className="container-fluid p-3 p-lg-5">
        <div className="row">
          <div className="col-12 col-lg-6 d-flex align-items-center justify-content-center main-con">
            <div className="col mx-lg-5 d-flex flex-column justify-content-center align-items-center login-container pt-4">
              <p className="d-flex justify-content-center l-t-a fw-bold fs-4">
                Login to your Account
              </p>

              <form onSubmit={handleSubmit} className="w-100">
                <div className="d-flex flex-column">
                  <label className="mt-1 lab">Email</label>
                  <div className="inp">
                    <input
                      name="email"
                      value={loginData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="Enter Email"
                      className="w-100"
                      autoComplete="email"
                    />
                  </div>

                  <div className="d-flex justify-content-between">
                    <div className="mt-2 lab">Password</div>
                    <div className="mt-2">
                      <Link className="spn" to="/forgot-password">
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  <div className="d-flex mt-1 inp">
                    <input
                      name="password"
                      value={loginData.password}
                      onChange={handleChange}
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Password"
                      className="w-100"
                      autoComplete="current-password"
                    />

                    <button type="button" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <ion-icon name="eye-off-outline"></ion-icon>
                      ) : (
                        <ion-icon name="eye-outline"></ion-icon>
                      )}
                    </button>
                  </div>

                  <button className="my-4 btn btn-secondary" disabled={submitting}>
                    {submitting ? "LOGGING IN..." : "LOGIN"}
                  </button>

                  <div className="mx-4 not-reg text-center">
                    Not registered yet?{" "}
                    <span className="spn">
                      <Link to="/signup">Create an account</Link>
                    </span>
                  </div>

                  <div className="mx-4 mt-2 text-center">
                    <Link to="/admin/login" className="spn">
                      Admin login
                    </Link>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="col-12 col-lg-6 bg-success img-container d-none d-lg-block"></div>
        </div>
      </div>
    </div>
  );
}
