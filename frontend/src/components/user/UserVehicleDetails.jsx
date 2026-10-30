import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API, { getImageUrl } from "../../api";
import "./vehicleDetails.css";
import UserFooter from "./UserFooter";

// IMPORT DATE PICKER
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function UserVehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking modal states
  const [showBookingModal, setShowBookingModal] = useState(false);

  // RANGE PICKER STATES
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;

  // BOOKED DATES
  const [bookedDates, setBookedDates] = useState([]);
  const MAX_BOOK_DAYS = 7;

  useEffect(() => {
    fetchVehicleDetails();
    fetchBookedDates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Format date as YYYY-MM-DD
  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // 1) Fetch vehicle details
  const fetchVehicleDetails = async () => {
    try {
      setLoading(true);

      const res = await API.get(`/vehicle/${id}`);
      setVehicle(res.data.vehicle);
    } catch (error) {
      console.log(error);
      setVehicle(null);
    } finally {
      setLoading(false);
    }
  };

  // 2) Fetch booked dates for this vehicle
  const fetchBookedDates = async () => {
    try {
      const res = await API.get(`/booking/booked-dates/${id}`);

      const expanded = [];

      res.data.bookings.forEach((b) => {
        let cur = new Date(b.pickupDate + "T00:00:00");
        let last = new Date(b.dropDate + "T00:00:00");

        while (cur <= last) {
          expanded.push(formatDate(cur));
          cur.setDate(cur.getDate() + 1);
        }
      });

      setBookedDates(expanded);
    } catch (err) {
      console.log(err);
    }
  };

  const handleBookClick = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!startDate || !endDate) {
      alert("Please select a date range.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedStartDate = new Date(startDate);
    selectedStartDate.setHours(0, 0, 0, 0);

    if (selectedStartDate < today) {
      alert("You cannot select past dates.");
      return;
    }

    // Max booking limit
    const diffDays = (endDate - startDate) / (1000 * 60 * 60 * 24);

    if (diffDays > MAX_BOOK_DAYS) {
      alert(`You can only book for a maximum of ${MAX_BOOK_DAYS} days.`);
      return;
    }

    // FRONTEND OVERLAP CHECK
    const selected = [];
    let cur = new Date(startDate);
    let last = new Date(endDate);

    while (cur <= last) {
      selected.push(formatDate(cur));
      cur.setDate(cur.getDate() + 1);
    }

    const overlap = selected.some((d) => bookedDates.includes(d));

    if (overlap) {
      alert("These dates are already booked. Please choose different dates.");
      return;
    }

    // SEND TO BACKEND
    try {
      const token = localStorage.getItem("token");

      await API.post(
        "/booking/create",
        {
          vehicleId: vehicle._id,
          pickupDate: formatDate(startDate),
          dropDate: formatDate(endDate),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Booking successful!");
      setShowBookingModal(false);
      navigate("/bookings/user");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Booking failed");
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <h4>Loading vehicle details...</h4>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="container text-center mt-5">
        <h4>Vehicle not found</h4>
        <button
          className="btn btn-outline-secondary mt-3"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div>
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
                <Link to="/vehicles/cars" className="nav-link fw-bold">
                  Cars
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/vehicles/bikes" className="nav-link">
                  Bikes
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/bookings/user" className="nav-link">
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

      <div className="container my-5 vehicle-details-page">
        <button
          className="btn btn-outline-secondary mb-3"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <div className="row">
          <div className="col-md-6">
            <img
              src={getImageUrl(vehicle.vehicleImage)}
              alt={vehicle.name}
              className="img-fluid rounded shadow"
            />
          </div>

          <div className="col-md-6">
            <h2 className="fw-bold">{vehicle.name}</h2>
            <p className="text-muted mb-1">{vehicle.type.toUpperCase()}</p>

            <h4 className="text-danger fw-bold">₹{vehicle.pricePerDay}/day</h4>

            <div className="mt-3">
              <p>
                <strong>Brand:</strong> {vehicle.brand}
              </p>
              <p>
                <strong>Model:</strong> {vehicle.model}
              </p>
              <p>
                <strong>Location:</strong> {vehicle.location}
              </p>
              <p>
                <strong>Contact:</strong> {vehicle.contactNumber}
              </p>
            </div>

            <button
              className="btn btn-primary px-4 mt-3"
              onClick={handleBookClick}
            >
              Book Now
            </button>
          </div>
        </div>
      </div>

      <UserFooter />

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="booking-modal-overlay">
          <div className="booking-modal">
            <h4 className="fw-bold mb-3 text-center">Book Vehicle</h4>

            <label className="form-label">Select Date Range</label>

            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              minDate={new Date()}
              maxDate={
                startDate
                  ? new Date(
                      startDate.getTime() + MAX_BOOK_DAYS * 24 * 60 * 60 * 1000
                    )
                  : null
              }
              excludeDates={bookedDates.map((d) => new Date(d + "T00:00:00"))}
              inline
              className="clean-date-picker"
            />

            <div className="text-end mt-3">
              <button
                className="btn btn-success me-2"
                onClick={handleConfirmBooking}
              >
                Confirm
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setShowBookingModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}