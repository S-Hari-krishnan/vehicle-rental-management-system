import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ProfileModal from "../ProfileModal";
import { clearAuth } from "../../utils/auth";

const links = [
  { to: "/owner/dashboard", label: "Dashboard", key: "dashboard" },
  { to: "/owner/add-vehicle", label: "Add Vehicle", key: "add" },
  { to: "/owner/my-vehicles", label: "My Vehicles", key: "vehicles" },
  { to: "/owner/bookings", label: "Bookings", key: "bookings" },
];

export default function OwnerNavbar({ active }) {
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const closeProfile = useCallback(() => setShowProfile(false), []);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      clearAuth();
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container-fluid px-3 px-lg-5">
        <Link to="/owner/dashboard" className="navbar-brand fw-bold" style={{ color: "red" }}>
          Hari Rentals
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#ownerNav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="ownerNav">
          <ul className="navbar-nav gap-3 gap-lg-4 align-items-lg-center">
            {links.map((link) => (
              <li className="nav-item" key={link.key}>
                <Link
                  to={link.to}
                  className={`nav-link ${active === link.key ? "fw-bold text-danger" : ""}`}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            <li className="nav-item">
              <button
                type="button"
                className={`nav-link bg-transparent border-0 ${showProfile ? "fw-bold text-danger" : ""}`}
                onClick={() => setShowProfile(true)}
              >
                Profile
              </button>
            </li>

            <li className="nav-item">
              <button onClick={handleLogout} className="btn btn-danger px-3">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>

      <ProfileModal show={showProfile} onClose={closeProfile} />
    </nav>
  );
}
