import { useEffect, useState } from "react";
import "./login.css";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (token) {
      if (role === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/user/home");
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields", {
        position: "top-center",
      });
      return;
    }

    try {
      const res = await API.post("/auth/login", loginData);

      if (res.data.message === "Login Successful!") {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("userId", res.data.userId);

        toast.success("Login Successful!", {
          position: "top-center",
        });

        if (res.data.role === "owner") {
          navigate("/owner/dashboard");
        } else {
          navigate("/user/home");
        }
      } else {
        toast.error(res.data.message || "Login failed!", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.log("Login error", error);

      if (error.response) {
        toast.error(error.response.data.message || "Server error", {
          position: "top-center",
        });
      } else {
        toast.error("Network error. Please try again.", {
          position: "top-center",
        });
      }
    }
  };

  return (
    <div className="container-fluid login-page">
      <ToastContainer />

      <div className="container-fluid p-5">
        <div className="row">
          <div className="col col-lg-6 d-flex align-items-center justify-content-center main-con">
            <div className="col mx-lg-5 d-flex flex-column justify-content-center align-items-center login-container pt-4">
              <p className="d-flex justify-content-center l-t-a fw-bold fs-4">
                Login to your Account
              </p>

              <form onSubmit={handleSubmit}>
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
                    />
                  </div>

                  <div className="d-flex justify-content-between">
                    <div className="mt-2 lab">Password</div>
                    <div className="mt-2">
                      <span className="spn">forgot password?</span>
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
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <ion-icon name="eye-off-outline"></ion-icon>
                      ) : (
                        <ion-icon name="eye-outline"></ion-icon>
                      )}
                    </button>
                  </div>

                  <button className="my-4 btn btn-secondary">LOGIN</button>

                  <div className="mx-4 not-reg">
                    Not registered yet?{" "}
                    <span className="spn">
                      <Link to="/signup">Create an account</Link>
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="col col-lg-6 bg-success img-container"></div>
        </div>
      </div>
    </div>
  );
}