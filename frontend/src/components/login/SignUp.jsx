import { useState } from "react";
import "./SignUp.css";
import API from "../../api";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setUserData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !userData.name.trim() ||
      !userData.email.trim() ||
      !userData.password.trim() ||
      !userData.confirmPassword.trim() ||
      !userData.role
    ) {
      toast.error("Please fill in all required fields.", {
        position: "top-center",
      });
      return;
    }

    if (userData.password !== userData.confirmPassword) {
      toast.error("Passwords do not match!", {
        position: "top-center",
      });
      return;
    }

    if (userData.password.length < 8 || userData.password.length > 72) {
      toast.error("Password must be between 8 and 72 characters.", {
        position: "top-center",
      });
      return;
    }

    if (!/[A-Za-z]/.test(userData.password) || !/[0-9]/.test(userData.password)) {
      toast.error("Password must contain at least one letter and one number.", {
        position: "top-center",
      });
      return;
    }

    try {
      const res = await API.post("/auth/signup", userData);

      if (res.data.message === "User registered successfully") {
        toast.success("SignUp Successful!", {
          position: "top-center",
        });

        setUserData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "",
        });

        navigate("/login");
      } else {
        toast.error(res.data.message || "Signup failed!", {
          position: "top-center",
        });
      }
    } catch (error) {
      console.error("Signup Error:", error);

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
    <div className="container-fluid signup-page">
      <ToastContainer />

      <div className="container-fluid p-5">
        <div className="row">
          {/* Left side - Image */}
          <div className="col col-lg-6 bg-success s-img-container"></div>

          {/* Right side - Signup Form */}
          <div className="col col-lg-6 d-flex align-items-center justify-content-center s-main-con">
            <div className="col col-lg-9 d-flex flex-column justify-content-center align-items-center signup-container">
              <p className="d-flex justify-content-center c-a-a fw-bold fs-4">
                Create an Account
              </p>

              <form onSubmit={handleSubmit}>
                <div className="d-flex flex-column">
                  {/* Name */}
                  <label className="s-lab">Full Name</label>
                  <div className="s-inp">
                    <input
                      name="name"
                      value={userData.name}
                      onChange={handleChange}
                      type="text"
                      placeholder="Enter Full Name"
                      className="w-100"
                    />
                  </div>

                  {/* Email */}
                  <label className="s-lab">Email</label>
                  <div className="s-inp">
                    <input
                      name="email"
                      value={userData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="Enter Email"
                      className="w-100"
                    />
                  </div>

                  <label className="s-lab">Account Type</label>
                  <div className="s-inp">
                    <select
                      name="role"
                      value={userData.role}
                      onChange={handleChange}
                      className="form-select"
                    >
                      <option value="">Select Role</option>
                      <option value="user">User (Rent Vehicles)</option>
                      <option value="owner">Owner (List Vehicles)</option>
                    </select>
                  </div>

                  {/* Password */}
                  <label className="s-lab">Password</label>
                  <div className="d-flex mt-1 s-inp">
                    <input
                      name="password"
                      value={userData.password}
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

                  {/* Confirm Password */}
                  <label className="s-lab">Confirm Password</label>
                  <div className="d-flex mt-1 s-inp">
                    <input
                      name="confirmPassword"
                      value={userData.confirmPassword}
                      onChange={handleChange}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter Password"
                      className="w-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <ion-icon name="eye-off-outline"></ion-icon>
                      ) : (
                        <ion-icon name="eye-outline"></ion-icon>
                      )}
                    </button>
                  </div>

                  {/* Signup Button */}
                  <button className="my-1 btn">CREATE ACCOUNT</button>

                  {/* Already registered link */}
                  <div className="mx-4 mt-1 not-reg">
                    Already registered?{" "}
                    <span className="spn">
                      <Link to="/login">Login here</Link>
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}