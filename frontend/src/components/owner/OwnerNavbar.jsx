import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function OwnerNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container-fluid mx-5">
        <Link className="navbar-brand fw-bold" style={{ color: "red" }}>
          Vishnu Rentals
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse justify-content-end" id="navContent">
          <ul className="navbar-nav gap-5">
            <li className="nav-item">
              <Link to="/owner/dashboard" className="nav-link">
                Dashboard
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/owner/add-vehicle" className="nav-link">
                Add Vehicle
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/owner/my-vehicles" className="nav-link">
                My Vehicles
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/owner/bookings" className="nav-link">
                Bookings
              </Link>
            </li>

            <li className="nav-item">
              <button onClick={handleLogout} className="btn">
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
