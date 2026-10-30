import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function RedirectRoot() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      navigate("/home");         // Public Home without login
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
    localStorage.clear();
    navigate("/login");
  }, [navigate]);

  return null;
}
