import { useEffect, useState } from "react";
import "./owner.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom";
import OwnerFooter from "./OwnerFooter";
import API, { getImageUrl } from "../../api";

export default function OwnerDashboard() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "owner") {
      navigate("/login");
      return;
    }

    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchVehicles = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get("/vehicle/my-vehicles", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setVehicles(res.data?.vehicles || []);
    } catch (error) {
      console.log(error);

      toast.error("Failed to load vehicles");

      if (error.response && error.response.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/login");
        return;
      }
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  return (
    <div className="ownerdashboard-page">
      {/* Owner Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid mx-5">
          <Link
            to="/owner/dashboard"
            className="navbar-brand fw-bold"
            style={{ color: "red" }}
          >
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

          <div
            className="collapse navbar-collapse justify-content-end"
            id="navContent"
          >
            <ul className="navbar-nav gap-5">
              <li className="nav-item">
                <Link
                  to="/owner/dashboard"
                  className="nav-link fw-bold text-danger"
                >
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

      {/* Hero section */}
      <div className="hero-section">
        <img src="/assets/bg2.jpg" className="h-img" alt="" />

        <div className="hero-content">
          <h1>List your cars and bikes — start earning instantly</h1>
          <h4>Manage Your Fleet With Ease</h4>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="vehicle-display container-fluid my-5">
        <h4 className="fw-bold text-center mb-4">Your Listed Vehicles</h4>

        <div className="row gap-4 ms-3">
          {vehicles.length === 0 ? (
            <h6 className="text-center mt-3 text-muted">
              No vehicles added yet.
            </h6>
          ) : (
            vehicles.slice(0, 6).map((item) => (
              <div
                key={item._id}
                className="card col col-sm-6 col-lg-2 p-0"
                style={{ minWidth: "250px" }}
              >
                <img
                  src={getImageUrl(item.vehicleImage)}
                  className="card-img-top"
                  style={{ width: "100%", height: "140px", objectFit: "cover" }}
                  alt={item.name || "vehicle"}
                />

                <div className="card-body text-center">
                  <h6 className="fw-bold">{item.name}</h6>
                  <p className="mb-1">{item.type}</p>
                  <p>₹{item.pricePerDay}/day</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <OwnerFooter />
    </div>
  );
}