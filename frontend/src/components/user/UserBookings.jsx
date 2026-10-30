import { useEffect, useState } from "react";
import UserFooter from "./UserFooter";
import { useNavigate, Link } from "react-router-dom";
import API, { getImageUrl } from "../../api";
import "./bookings.css";

export default function UserBookings() {
  const [bookings, setBookings] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      const res = await API.get("/booking/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setBookings(res.data?.bookings || []);
    } catch (error) {
      console.log(error);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      const res = await API.put(
        `/booking/${bookingId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(res.data?.message || "Booking cancelled successfully");

      setBookings((prev) =>
        prev.map((booking) =>
          booking._id === bookingId
            ? { ...booking, status: res.data.booking.status }
            : booking
        )
      );
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to cancel booking");
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

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="booking">
      {/* INLINE NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid mx-5">
          <Link
            to="/user/home"
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
                <Link to="/user/home" className="nav-link">
                  Home
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/vehicles/cars" className="nav-link">
                  Cars
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/vehicles/bikes" className="nav-link">
                  Bikes
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  to="/bookings/user"
                  className="nav-link fw-bold text-danger"
                >
                  My Bookings
                </Link>
              </li>

              <li className="nav-item">
                <button className="btn btn-danger px-3" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      {/* END NAVBAR */}

      <div className="container my-5">
        <h2 className="fw-bold mb-4 text-center">My Bookings</h2>

        {bookings.length === 0 ? (
          <h5 className="text-center text-muted">No bookings yet.</h5>
        ) : (
          <div className="row g-4">
            {bookings.map((b) => {
              const currentStatus = b.status || "pending";
              const canCancel =
                currentStatus === "pending" || currentStatus === "confirmed";

              return (
                <div key={b._id} className="col-md-4 col-lg-3">
                  <div className="card shadow-sm">
                    <img
                      src={getImageUrl(b.vehicleId?.vehicleImage)}
                      className="card-img-top"
                      alt={b.vehicleId?.name || "vehicle"}
                    />

                    <div className="card-body">
                      <h5 className="fw-bold">{b.vehicleId?.name}</h5>

                      <p className="mb-1">
                        <strong>Type:</strong> {b.vehicleId?.type}
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

                      <p className="small text-muted mb-2">
                        {getStatusText(currentStatus)}
                      </p>

                      <h6 className="text-danger fw-bold mt-2">
                        ₹{b.totalPrice}
                      </h6>

                      <Link
                        to={`/vehicle/${b.vehicleId?._id}`}
                        className="btn btn-sm w-100 view-btn"
                      >
                        View Vehicle
                      </Link>

                      {canCancel && (
                        <button
                          className="btn btn-danger btn-sm w-100 mt-2"
                          onClick={() => cancelBooking(b._id)}
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <UserFooter />
    </div>
  );
}