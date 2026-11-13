import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./adminbookings.css";
import API from "../../api";
import { toast } from "react-toastify";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBookings = async (page = 1, status = statusFilter) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;

      const res = await API.get("/admin/bookings", { params });
      setBookings(res.data?.bookings || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings(1, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  const updateBookingStatus = async (bookingId, status) => {
    if (!window.confirm(`${status === "cancelled" ? "Cancel" : "Mark"} this booking as ${status}?`)) {
      return;
    }

    try {
      const res = await API.put(`/admin/booking/${bookingId}/status`, { status });
      toast.success(res.data?.message || "Booking status updated");
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: res.data.booking.status }
            : booking
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update booking");
    }
  };

  const deleteBooking = async (id) => {
    if (!window.confirm("Delete this booking?")) return;

    try {
      await API.delete(`/admin/booking/${id}`);
      setBookings((prev) => prev.filter((b) => b._id !== id));
      toast.success("Booking deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete booking");
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "confirmed": return "badge bg-primary";
      case "completed": return "badge bg-success";
      case "cancelled": return "badge bg-danger";
      default: return "badge bg-warning text-dark";
    }
  };

  return (
    <div className="admin-bookings-page">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid mx-5">
          <Link to="/admin/dashboard" className="navbar-brand fw-bold" style={{ color: "red" }}>
            Hari Rentals — Admin
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="adminNav">
            <ul className="navbar-nav gap-4">
              <li className="nav-item"><Link to="/admin/dashboard" className="nav-link fw-semibold">Dashboard</Link></li>
              <li className="nav-item"><Link to="/admin/users" className="nav-link fw-semibold">Users</Link></li>
              <li className="nav-item"><Link to="/admin/bookings" className="nav-link fw-bold text-danger">Bookings</Link></li>
              <li className="nav-item"><Link to="/admin/vehicles" className="nav-link fw-semibold">Vehicles</Link></li>
              <li className="nav-item"><button className="btn btn-danger px-3" onClick={logout}>Logout</button></li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container my-5">
        <h2 className="fw-bold text-center mb-4">All Bookings</h2>

        <div className="row mb-4">
          <div className="col-md-4">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                fetchBookings(1, e.target.value);
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <p className="text-muted small">{pagination.total} booking(s)</p>

        {loading ? (
          <h5 className="text-center text-muted">Loading...</h5>
        ) : bookings.length === 0 ? (
          <h5 className="text-center text-muted">No bookings found.</h5>
        ) : (
          <div className="row g-4">
            {bookings.map((b) => {
              const currentStatus = b.status || "pending";

              return (
                <div key={b._id} className="col-12 col-sm-6 col-lg-4">
                  <div className="booking-card shadow-sm p-3 h-100">
                    <h5 className="fw-bold text-danger text-center mb-2">
                      <i className="bi bi-car-front-fill me-1"></i>
                      {b.vehicleId?.name || "Vehicle removed"}
                    </h5>

                    <div className="booking-info mt-2">
                      <p className="mb-1"><strong>User:</strong> {b.userId?.name || "User removed"}</p>
                      <p className="mb-1"><strong>Email:</strong> {b.userId?.email || "N/A"}</p>
                      <p className="mb-1">
                        <strong>Pickup:</strong>{" "}
                        {new Date(b.pickupDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                      </p>
                      <p className="mb-1">
                        <strong>Drop:</strong>{" "}
                        {new Date(b.dropDate).toLocaleDateString("en-IN", { timeZone: "UTC" })}
                      </p>
                      <p className="mb-1">
                        <strong>Status:</strong>{" "}
                        <span className={getStatusBadgeClass(currentStatus)}>{currentStatus}</span>
                      </p>
                      {b.totalPrice && <p className="mb-1"><strong>Total Price:</strong> ₹{b.totalPrice}</p>}
                      {b.cancellationReason && (
                        <p className="mb-1 small text-danger">Reason: {b.cancellationReason}</p>
                      )}
                    </div>

                    {currentStatus === "pending" && (
                      <div className="d-flex gap-2 mt-3">
                        <button className="btn btn-success btn-sm w-50" onClick={() => updateBookingStatus(b._id, "confirmed")}>
                          Confirm
                        </button>
                        <button className="btn btn-danger btn-sm w-50" onClick={() => updateBookingStatus(b._id, "cancelled")}>
                          Cancel
                        </button>
                      </div>
                    )}

                    {currentStatus === "confirmed" && (
                      <div className="d-flex gap-2 mt-3">
                        <button className="btn btn-primary btn-sm w-50" onClick={() => updateBookingStatus(b._id, "completed")}>
                          Complete
                        </button>
                        <button className="btn btn-danger btn-sm w-50" onClick={() => updateBookingStatus(b._id, "cancelled")}>
                          Cancel
                        </button>
                      </div>
                    )}

                    <div className="text-center mt-3">
                      <button className="btn btn-outline-danger btn-sm px-3" onClick={() => deleteBooking(b._id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-4">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchBookings(pagination.page - 1, statusFilter)}
            >
              Previous
            </button>
            <span className="align-self-center small">Page {pagination.page} of {pagination.pages}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchBookings(pagination.page + 1, statusFilter)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
