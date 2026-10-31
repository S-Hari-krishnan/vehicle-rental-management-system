import { useEffect, useState } from "react";
import UserFooter from "./UserFooter";
import { Link } from "react-router-dom";
import API, { getVehicleImage } from "../../api";
import UserNavbar from "./UserNavbar";
import VehicleImage from "../VehicleImage";
import { toast } from "react-toastify";
import "./bookings.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { timeZone: "UTC" })
    : "N/A";

export default function UserBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewBooking, setReviewBooking] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await API.get("/booking/user");
      setBookings(res.data?.bookings || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    const reason = window.prompt("Reason for cancellation (optional):", "");

    try {
      const res = await API.put(`/booking/${bookingId}/cancel`, { reason });
      toast.success(res.data?.message || "Booking cancelled successfully");
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: res.data.booking.status }
            : booking
        )
      );
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel booking");
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();

    try {
      await API.post("/reviews", {
        bookingId: reviewBooking._id,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });

      toast.success("Review submitted successfully");
      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === reviewBooking._id ? { ...booking, isReviewed: true } : booking
        )
      );
      setReviewBooking(null);
      setReviewForm({ rating: 5, comment: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Review submission failed");
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

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Booking confirmed";
      case "completed":
        return "Ride completed";
      case "cancelled":
        return "Booking cancelled";
      default:
        return "Waiting for owner confirmation";
    }
  };

  return (
    <div className="booking page-shell">
      <UserNavbar active="bookings" />

      <div className="container my-5 page-main">
        <h2 className="fw-bold mb-4 text-center">My Bookings</h2>

        {loading ? (
          <h5 className="text-center text-muted">Loading...</h5>
        ) : bookings.length === 0 ? (
          <h5 className="text-center text-muted">No bookings yet.</h5>
        ) : (
          <div className="row g-4">
            {bookings.map((b) => {
              const currentStatus = b.status || "pending";
              const canCancel = currentStatus === "pending" || currentStatus === "confirmed";
              const canReview = currentStatus === "completed" && !b.isReviewed;
              const vehicle = b.vehicleId;

              return (
                <div key={b._id} className="col-md-4 col-lg-3">
                  <div className="card shadow-sm h-100">
                    <VehicleImage
                      src={getVehicleImage(vehicle)}
                      className="card-img-top"
                      alt={vehicle?.name || "vehicle"}
                    />

                    <div className="card-body d-flex flex-column">
                      <h5 className="fw-bold">{vehicle?.name || "Vehicle removed"}</h5>

                      <p className="mb-1">
                        <strong>Type:</strong> {vehicle?.type || "N/A"}
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
                      <p className="small text-muted mb-2">{getStatusText(currentStatus)}</p>

                      {b.cancellationReason && (
                        <p className="small text-danger mb-2">
                          Reason: {b.cancellationReason}
                        </p>
                      )}

                      <h6 className="text-danger fw-bold mt-2">₹{b.totalPrice}</h6>

                      {vehicle?._id && (
                        <Link
                          to={`/vehicle/${vehicle._id}`}
                          className="btn btn-sm w-100 view-btn mt-auto"
                        >
                          View Vehicle
                        </Link>
                      )}

                      {canCancel && (
                        <button
                          className="btn btn-danger btn-sm w-100 mt-2"
                          onClick={() => cancelBooking(b._id)}
                        >
                          Cancel Booking
                        </button>
                      )}

                      {canReview && (
                        <button
                          className="btn btn-outline-warning btn-sm w-100 mt-2"
                          onClick={() => {
                            setReviewBooking(b);
                            setReviewForm({ rating: 5, comment: "" });
                          }}
                        >
                          Write a Review
                        </button>
                      )}

                      {currentStatus === "completed" && b.isReviewed && (
                        <span className="badge bg-success mt-2">Reviewed</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {reviewBooking && (
        <div className="booking-modal-overlay">
          <div className="booking-modal" style={{ maxWidth: "480px" }}>
            <h4 className="fw-bold mb-3 text-center">
              Review {reviewBooking.vehicleId?.name}
            </h4>

            <form onSubmit={submitReview}>
              <label className="form-label">Rating</label>
              <select
                className="form-select mb-3"
                value={reviewForm.rating}
                onChange={(e) =>
                  setReviewForm((prev) => ({ ...prev, rating: e.target.value }))
                }
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option value={value} key={value}>
                    {value} star{value > 1 ? "s" : ""}
                  </option>
                ))}
              </select>

              <label className="form-label">Comment</label>
              <textarea
                className="form-control mb-3"
                rows="4"
                minLength={3}
                maxLength={1000}
                value={reviewForm.comment}
                onChange={(e) =>
                  setReviewForm((prev) => ({ ...prev, comment: e.target.value }))
                }
                required
              />

              <div className="text-end">
                <button className="btn btn-success me-2" type="submit">
                  Submit review
                </button>
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => setReviewBooking(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <UserFooter />
    </div>
  );
}
