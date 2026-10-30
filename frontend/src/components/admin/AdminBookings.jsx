import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./adminbookings.css";
import API from "../../api";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await API.get("/admin/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBookings(res.data?.bookings || []);
    } catch (error) {
      console.log(error);
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
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
      const token = localStorage.getItem("adminToken");

      const res = await API.put(
        `/admin/booking/${bookingId}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data?.message || "Booking status updated");

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: res.data.booking.status }
            : booking
        )
      );
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to update booking");
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;

    try {
      const token = localStorage.getItem("adminToken");

      await API.delete(`/admin/booking/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBookings((prev) => prev.filter((b) => b._id !== id));
      alert("Booking deleted");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to delete");
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

  return (
    <div className="admin-bookings-page">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid mx-5">
          <Link
            to="/admin/dashboard"
            className="navbar-brand fw-bold"
            style={{ color: "red" }}
          >
            Vishnu Rentals — Admin
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#adminNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="collapse navbar-collapse justify-content-end"
            id="adminNav"
          >
            <ul className="navbar-nav gap-4">
              <li className="nav-item">
                <Link to="/admin/dashboard" className="nav-link fw-semibold">
                  Dashboard
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/admin/users" className="nav-link fw-semibold">
                  Users
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  to="/admin/bookings"
                  className="nav-link fw-bold text-danger"
                >
                  Bookings
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/admin/vehicles" className="nav-link fw-semibold">
                  Vehicles
                </Link>
              </li>

              <li className="nav-item">
                <button className="btn btn-danger px-3" onClick={logout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* BOOKINGS CONTENT */}
      <div className="container my-5">
        <h2 className="fw-bold text-center mb-4">All Bookings</h2>

        {bookings.length === 0 ? (
          <h5 className="text-center text-muted">No bookings found.</h5>
        ) : (
          <div className="row g-4">
            {bookings.map((b) => {
              const currentStatus = b.status || "pending";

              return (
                <div key={b._id} className="col-12 col-sm-6 col-lg-4">
                  <div className="booking-card shadow-sm p-3">
                    <h5 className="fw-bold text-danger text-center mb-2">
                      <i className="bi bi-car-front-fill me-1"></i>
                      {b.vehicleId?.name || "Vehicle removed"}
                    </h5>

                    <div className="booking-info mt-2">
                      <p className="mb-1">
                        <strong>User:</strong>{" "}
                        {b.userId?.name || "User removed"}
                      </p>

                      <p className="mb-1">
                        <strong>Email:</strong> {b.userId?.email || "N/A"}
                      </p>

                      <p className="mb-1">
                        <strong>Pickup:</strong>{" "}
                        {new Date(b.pickupDate).toLocaleDateString()}
                      </p>

                      <p className="mb-1">
                        <strong>Drop:</strong>{" "}
                        {new Date(b.dropDate).toLocaleDateString()}
                      </p>

                      <p className="mb-1">
                        <strong>Status:</strong>{" "}
                        <span className={getStatusBadgeClass(currentStatus)}>
                          {currentStatus}
                        </span>
                      </p>

                      {b.totalPrice && (
                        <p className="mb-1">
                          <strong>Total Price:</strong> ₹{b.totalPrice}
                        </p>
                      )}
                    </div>

                    {currentStatus === "pending" && (
                      <div className="d-flex gap-2 mt-3">
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
                      <div className="d-flex gap-2 mt-3">
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

                    <div className="text-center mt-3">
                      <button
                        className="btn btn-outline-danger btn-sm px-3"
                        onClick={() => deleteBooking(b._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}