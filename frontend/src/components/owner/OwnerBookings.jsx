import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import OwnerFooter from "./OwnerFooter";
import OwnerNavbar from "./OwnerNavbar";
import { toast } from "react-toastify";
import API, { getVehicleImage } from "../../api";
import VehicleImage from "../VehicleImage";
import "./owner.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { timeZone: "UTC" })
    : "N/A";

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await API.get("/booking/owner");
      setBookings(res.data?.bookings || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch bookings.");
    } finally {
      setLoading(false);
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

    const reason =
      status === "cancelled"
        ? window.prompt("Reason for cancellation (optional):", "")
        : undefined;

    try {
      const res = await API.put(`/booking/${bookingId}/status`, { status, reason });
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
    <div className="page-shell">
      <OwnerNavbar active="bookings" />

      <div className="container my-5 page-main">
        <h2 className="fw-bold mb-4 text-center">Bookings for Your Vehicles</h2>

        {loading ? (
          <h5 className="text-center text-muted">Loading...</h5>
        ) : bookings.length === 0 ? (
          <h5 className="text-center text-muted">No bookings yet.</h5>
        ) : (
          <div className="row g-4">
            {bookings.map((b) => {
              const currentStatus = b.status || "pending";
              const vehicle = b.vehicleId;

              return (
                <div key={b._id} className="col-md-4 col-lg-3 d-flex justify-content-center">
                  <div className="card shadow-sm owner-booking-card h-100 w-100">
                    <VehicleImage
                      src={getVehicleImage(vehicle)}
                      className="card-img-top"
                      alt={vehicle?.name || "vehicle"}
                    />

                    <div className="card-body d-flex flex-column">
                      <h5 className="fw-bold">{vehicle?.name || "Vehicle removed"}</h5>
                      <p className="mb-1">
                        <strong>Booked By:</strong> {b.userId?.name || "N/A"}
                      </p>
                      <p className="mb-1 small">
                        <strong>Email:</strong> {b.userId?.email || "N/A"}
                      </p>
                      <p className="mb-1 small">
                        <strong>Phone:</strong> {b.userId?.phone || "N/A"}
                      </p>
                      <p className="mb-1">
                        <strong>Pickup:</strong> {formatDate(b.pickupDate)}
                      </p>
                      <p className="mb-1">
                        <strong>Drop:</strong> {formatDate(b.dropDate)}
                      </p>
                      <p className="mb-1">
                        <strong>Status:</strong>{" "}
                        <span className={getStatusBadgeClass(currentStatus)}>{currentStatus}</span>
                      </p>

                      {b.cancellationReason && (
                        <p className="small text-danger mb-1">Reason: {b.cancellationReason}</p>
                      )}

                      <h6 className="text-danger fw-bold mt-2">₹{b.totalPrice}</h6>

                      {vehicle?._id && (
                        <Link
                          to={`/vehicle/${vehicle._id}`}
                          className="btn view-vehicle-btn btn-sm mt-2 w-100"
                        >
                          View Vehicle
                        </Link>
                      )}

                      {currentStatus === "pending" && (
                        <div className="d-flex gap-2 mt-2">
                          <button
                            className="btn btn-success btn-sm w-50"
                            onClick={() => updateBookingStatus(b._id, "confirmed")}
                          >
                            Confirm
                          </button>
                          <button
                            className="btn btn-danger btn-sm w-50"
                            onClick={() => updateBookingStatus(b._id, "cancelled")}
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {currentStatus === "confirmed" && (
                        <div className="d-flex gap-2 mt-2">
                          <button
                            className="btn btn-primary btn-sm w-50"
                            onClick={() => updateBookingStatus(b._id, "completed")}
                          >
                            Complete
                          </button>
                          <button
                            className="btn btn-danger btn-sm w-50"
                            onClick={() => updateBookingStatus(b._id, "cancelled")}
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
