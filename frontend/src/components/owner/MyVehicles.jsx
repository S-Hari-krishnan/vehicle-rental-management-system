import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./owner.css";
import { toast } from "react-toastify";
import OwnerFooter from "./OwnerFooter";
import API, { getImageUrl } from "../../api";

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "owner") {
      toast.error("Access denied!");
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

      if (error.response && error.response.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      toast.error("Failed to fetch vehicles");
    }
  };

  const openModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedVehicle(null);
    setShowModal(false);
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      const token = localStorage.getItem("token");

      await API.delete(`/vehicle/delete/${vehicleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Vehicle deleted successfully");

      setVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
      closeModal();
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to delete vehicle");
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
    <div>
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
                <Link
                  to="/owner/my-vehicles"
                  className="nav-link fw-bold text-danger"
                >
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

      <div className="container mt-4">
        <h3 className="fw-bold text-center mb-4">My Vehicles</h3>

        <div className="row gap-3">
          {vehicles.length === 0 ? (
            <h5 className="text-center mt-4">No vehicles added yet.</h5>
          ) : (
            vehicles.map((item) => (
              <div
                key={item._id}
                className="card col col-sm-6 col-lg-2"
                style={{
                  minHeight: "287px",
                  minWidth: "300px",
                  cursor: "pointer",
                }}
                onClick={() => openModal(item)}
              >
                <img
                  src={getImageUrl(item.vehicleImage)}
                  className="card-img-top"
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

      {/* Modal popup */}
      {showModal && selectedVehicle && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h4 className="text-center mb-3 fw-bold">
              {selectedVehicle.name}
            </h4>

            <img
              src={getImageUrl(selectedVehicle.vehicleImage)}
              className="modal-img"
              alt={selectedVehicle.name || "vehicle"}
            />

            <div className="modal-details mt-3">
              <p>
                <strong>Type:</strong> {selectedVehicle.type}
              </p>

              <p>
                <strong>Brand:</strong> {selectedVehicle.brand}
              </p>

              <p>
                <strong>Model:</strong> {selectedVehicle.model}
              </p>

              <p>
                <strong>Price/Day:</strong> ₹{selectedVehicle.pricePerDay}
              </p>

              <p>
                <strong>Location:</strong> {selectedVehicle.location}
              </p>

              <p>
                <strong>Contact:</strong> {selectedVehicle.contactNumber}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                <span className="text-capitalize">
                  {selectedVehicle.approvalStatus || "pending"}
                </span>
              </p>

              {/* RC Document */}
              <p>
                <strong>RC Document:</strong>
              </p>

              {selectedVehicle.rcDoc ? (
                <img
                  src={getImageUrl(selectedVehicle.rcDoc)}
                  className="doc-img"
                  alt="RC Document"
                />
              ) : (
                <p className="text-muted">No RC document uploaded</p>
              )}

              {/* Insurance Document */}
              <p className="mt-3">
                <strong>Insurance Document:</strong>
              </p>

              {selectedVehicle.insuranceDoc ? (
                <img
                  src={getImageUrl(selectedVehicle.insuranceDoc)}
                  className="doc-img"
                  alt="Insurance Document"
                />
              ) : (
                <p className="text-muted">No insurance document uploaded</p>
              )}
            </div>

            <div className="text-center mt-3">
              <button
                className="btn btn-primary px-4 me-2"
                onClick={() => {
                  navigate(`/owner/edit-vehicle/${selectedVehicle._id}`);
                }}
              >
                Edit
              </button>

              <button
                className="btn btn-danger px-4 me-2"
                onClick={() => handleDelete(selectedVehicle._id)}
              >
                Delete
              </button>

              <button className="btn btn-secondary px-4" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <OwnerFooter />
    </div>
  );
}