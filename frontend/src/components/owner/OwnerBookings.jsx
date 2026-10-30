import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import OwnerFooter from "./OwnerFooter";
import { toast } from "react-toastify";
import API, { getImageUrl } from "../../api";
import "./owner.css";

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "owner") {
      navigate("/login");
      return;
    }

    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get("/booking/owner", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBookings(res.data?.bookings || []);
    } catch (error) {
      console.log(error);

      if (error.response && error.response.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      toast.error("Failed to fetch bookings.");
    }
  };

  const updateBookingStatus = async (bookingId, status) => {
    const confirmMessage =
      status === "confirmed"
        ? "Confirm this booking?"
        : status === "completed"
        ? "Mark this booking as completed?"
        : "Cancel this booking?";

    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem("token");

      const res = await API.put(
        `/booking/${bookingId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(res.data?.message || "Booking status updated");

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: res.data.booking.status }
            : booking
        )
      );
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to update booking");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "confirmed":
        return "badge bg-primary";
      case "completed":
        return "badge bg-success";
      case "cancelled":
        return "badge bg-danger";
      default:
        return "badge bg-warning text-dark";
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
    <div className="page-with-fixed-footer">
      {/* OWNER NAVBAR */}
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
                <Link to="/owner/my-vehicles" className="nav-link">
                  My Vehicles
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  to="/owner/bookings"
                  className="nav-link fw-bold text-danger"
                >
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
      {/* END NAVBAR */}

      <div className="container my-5">
        <h2 className="fw-bold mb-4 text-center">Bookings for Your Vehicles</h2>

        {bookings.length === 0 ? (
          <h5 className="text-center text-muted">No bookings yet.</h5>
        ) : (
          <div className="row g-4">
            {bookings.map((b) => {
              const currentStatus = b.status || "pending";

              return (
                <div
                  key={b._id}
                  className="col-md-3 col-sm-6 d-flex justify-content-center"
                >
                  <div className="card shadow-sm owner-booking-card">
                    <img
                      src={getImageUrl(b.vehicleId?.vehicleImage)}
                      className="card-img-top"
                      alt={b.vehicleId?.name || "vehicle"}
                    />

                    <div className="card-body">
                      <h5 className="fw-bold">{b.vehicleId?.name}</h5>

                      <p>
                        <strong>Booked By:</strong> {b.userId?.name}
                      </p>

                      <p>
                        <strong>Email:</strong> {b.userId?.email}
                      </p>

                      <p>
                        <strong>Pickup:</strong>{" "}
                        {new Date(b.pickupDate).toLocaleDateString()}
                      </p>

                      <p>
                        <strong>Drop:</strong>{" "}
                        {new Date(b.dropDate).toLocaleDateString()}
                      </p>

                      <p>
                        <strong>Status:</strong>{" "}
                        <span className={getStatusBadgeClass(currentStatus)}>
                          {currentStatus}
                        </span>
                      </p>

                      <h6 className="text-danger fw-bold mt-2">
                        ₹{b.totalPrice}
                      </h6>

                      <Link
                        to={`/vehicle/${b.vehicleId?._id}`}
                        className="btn view-vehicle-btn btn-sm mt-3 w-100"
                      >
                        View Vehicle
                      </Link>

                      {currentStatus === "pending" && (
                        <div className="d-flex gap-2 mt-2">
                          <button
                            className="btn btn-success btn-sm w-50"
                            onClick={() =>
                              updateBookingStatus(b._id, "confirmed")
                            }
                          >
                            Confirm
                          </button>

                          <button
                            className="btn btn-danger btn-sm w-50"
                            onClick={() =>
                              updateBookingStatus(b._id, "cancelled")
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {currentStatus === "confirmed" && (
                        <div className="d-flex gap-2 mt-2">
                          <button
                            className="btn btn-primary btn-sm w-50"
                            onClick={() =>
                              updateBookingStatus(b._id, "completed")
                            }
                          >
                            Complete
                          </button>

                          <button
                            className="btn btn-danger btn-sm w-50"
                            onClick={() =>
                              updateBookingStatus(b._id, "cancelled")
                            }
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <OwnerFooter />
    </div>
  );
}