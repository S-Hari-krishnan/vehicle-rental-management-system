import { useCallback, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import ProfileModal from "../ProfileModal";
import { clearAuth } from "../../utils/auth";

const links = [
  { to: "/user/home", label: "Home", key: "home" },
  { to: "/vehicles/cars", label: "Cars", key: "cars" },
  { to: "/vehicles/bikes", label: "Bikes", key: "bikes" },
  { to: "/bookings/user", label: "My Bookings", key: "bookings" },
];

export default function UserNavbar({ active }) {
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
      <div className="container-fluid mx-3 mx-lg-5">
        <Link to="/user/home" className="navbar-brand fw-bold" style={{ color: "red" }}>
          Hari Rentals
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#userNav"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="userNav">
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
              <button className="btn btn-danger px-3" onClick={handleLogout}>
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
