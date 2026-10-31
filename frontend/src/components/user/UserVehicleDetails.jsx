import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API, { getImageUrl, getVehicleImage } from "../../api";
import "./vehicleDetails.css";
import UserFooter from "./UserFooter";
import UserNavbar from "./UserNavbar";
import VehicleImage from "../VehicleImage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-toastify";

const MAX_BOOK_DAYS = 30;

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const dateOnlyFromValue = (value) => String(value || "").slice(0, 10);

const expandRange = (startValue, endValue) => {
  const dates = [];
  const start = new Date(`${dateOnlyFromValue(startValue)}T00:00:00`);
  const end = new Date(`${dateOnlyFromValue(endValue)}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return dates;

  const current = new Date(start);
  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export default function UserVehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [bookedDates, setBookedDates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState("");

  const images = useMemo(() => {
    if (!vehicle) return [];
    if (vehicle.images?.length) return vehicle.images.map((image) => getImageUrl(image));
    return vehicle.vehicleImage ? [getImageUrl(vehicle.vehicleImage)] : [];
  }, [vehicle]);

  useEffect(() => {
    const fetchVehicleDetails = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/vehicle/${id}`);
        setVehicle(res.data.vehicle);
        const first = res.data.vehicle?.images?.[0]?.url || res.data.vehicle?.vehicleImage;
        setActiveImage(first ? getImageUrl(first) : "");
      } catch (error) {
        console.error(error);
        setVehicle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleDetails();
  }, [id]);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await API.get(`/vehicle/${id}/availability`);
        const excluded = [];

        (res.data.bookings || []).forEach((booking) => {
          excluded.push(...expandRange(booking.pickupDate, booking.dropDate));
        });

        (res.data.blockedDates || []).forEach((blocked) => {
          excluded.push(...expandRange(blocked.start, blocked.end));
        });

        setBookedDates([...new Set(excluded)]);
      } catch (error) {
        console.error(error);
      }
    };

    const fetchReviews = async () => {
      try {
        const res = await API.get(`/reviews/vehicle/${id}`, { params: { limit: 6 } });
        setReviews(res.data.reviews || []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAvailability();
    fetchReviews();
  }, [id]);

  const handleBookClick = () => {
    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    if (vehicle?.isAvailable === false) {
      toast.error("This vehicle is currently unavailable");
      return;
    }

    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select a date range.");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selectedStart = new Date(startDate);
    selectedStart.setHours(0, 0, 0, 0);

    if (selectedStart < today) {
      toast.error("You cannot select past dates.");
      return;
    }

    const days = (endDate - startDate) / (1000 * 60 * 60 * 24);
    if (days > MAX_BOOK_DAYS) {
      toast.error(`You can only book for a maximum of ${MAX_BOOK_DAYS} days.`);
      return;
    }

    const selected = expandRange(startDate, endDate);
    if (selected.some((date) => bookedDates.includes(date))) {
      toast.error("These dates are not available. Please choose different dates.");
      return;
    }

    try {
      await API.post("/booking/create", {
        vehicleId: vehicle._id,
        pickupDate: formatDate(startDate),
        dropDate: formatDate(endDate),
      });

      toast.success("Booking created successfully!");
      setShowBookingModal(false);
      navigate("/bookings/user");
    } catch (error) {
      toast.error(error.response?.data?.message || "Booking failed");
    }
  };

  if (loading) {
    return <h4 className="text-center mt-5">Loading vehicle details...</h4>;
  }

  if (!vehicle) {
    return (
      <div className="container text-center mt-5">
        <h4>Vehicle not found</h4>
        <button className="btn btn-outline-secondary mt-3" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <UserNavbar active="" />

      <div className="container my-5 vehicle-details-page page-main">
        <button className="btn btn-outline-secondary mb-3" onClick={() => navigate(-1)}>
          Back
        </button>

        <div className="row g-4">
          <div className="col-md-6">
            <VehicleImage
              src={activeImage || getVehicleImage(vehicle)}
              alt={vehicle.name}
              className="img-fluid rounded shadow w-100"
              style={{ maxHeight: "430px", objectFit: "cover" }}
            />

            {images.length > 1 && (
              <div className="d-flex gap-2 mt-2 overflow-auto">
                {images.map((image, index) => (
                  <VehicleImage
                    key={`${image}-${index}`}
                    src={image}
                    alt={`${vehicle.name} ${index + 1}`}
                    onClick={() => setActiveImage(image)}
                    className={`rounded border ${activeImage === image ? "border-danger" : ""}`}
                    style={{ width: "82px", height: "62px", objectFit: "cover", cursor: "pointer" }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="col-md-6 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-start gap-3">
              <div>
                <h2 className="fw-bold mb-1">{vehicle.name}</h2>
                <div className="d-flex flex-wrap gap-2 align-items-center mt-1">
                  <span className="badge bg-secondary text-uppercase">{vehicle.type}</span>
                  <span className={`badge ${vehicle.isAvailable ? "bg-success" : "bg-secondary"}`}>
                    {vehicle.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>
              <div className="text-end">
                <div className="text-danger fw-bold fs-4 lh-1">
                  ₹{vehicle.pricePerDay}
                  <small className="fs-6 fw-normal text-muted">/day</small>
                </div>
              </div>
            </div>

            <p className="mb-3 mt-2">
              <i className="bi bi-star-fill text-warning"></i>{" "}
              <strong>{vehicle.ratingAverage || 0}</strong> ({vehicle.ratingCount || 0} reviews)
            </p>

            <div className="row row-cols-1 row-cols-sm-2 g-3">
              <div className="col">
                <div className="vehicle-spec-card h-100">
                  <small className="text-muted d-block text-uppercase">
                    <i className="bi bi-tag me-1"></i>Brand
                  </small>
                  <span className="fw-semibold text-break">{vehicle.brand}</span>
                </div>
              </div>
              <div className="col">
                <div className="vehicle-spec-card h-100">
                  <small className="text-muted d-block text-uppercase">
                    <i className="bi bi-car-front me-1"></i>Model
                  </small>
                  <span className="fw-semibold text-break">{vehicle.model}</span>
                </div>
              </div>
              <div className="col">
                <div className="vehicle-spec-card h-100">
                  <small className="text-muted d-block text-uppercase">
                    <i className="bi bi-geo-alt me-1"></i>Location
                  </small>
                  <span className="fw-semibold text-break">{vehicle.location}</span>
                </div>
              </div>
              <div className="col">
                <div className="vehicle-spec-card h-100">
                  <small className="text-muted d-block text-uppercase">
                    <i className="bi bi-telephone me-1"></i>Contact
                  </small>
                  <span className="fw-semibold text-break">{vehicle.contactNumber}</span>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end mt-auto pt-4">
              <button
                className="btn btn-primary px-4"
                onClick={handleBookClick}
                disabled={!vehicle.isAvailable}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <h4 className="fw-bold mb-3">Reviews</h4>

          {reviews.length === 0 ? (
            <p className="text-muted">No reviews yet.</p>
          ) : (
            <div className="row g-3">
              {reviews.map((review) => (
                <div className="col-md-6" key={review._id}>
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <strong>{review.userId?.name || "User"}</strong>
                        <span className="text-warning">
                          {"★".repeat(review.rating)}
                          <span className="text-muted">{"★".repeat(5 - review.rating)}</span>
                        </span>
                      </div>
                      <p className="mb-1 mt-2">{review.comment}</p>
                      <small className="text-muted">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <UserFooter />

      {showBookingModal && (
        <div className="vehicle-booking-overlay">
          <div className="vehicle-booking-modal">
            <h4 className="fw-bold mb-3 text-center">Book {vehicle.name}</h4>

            <label className="form-label">Select Date Range</label>

            <DatePicker
              selectsRange
              startDate={startDate}
              endDate={endDate}
              onChange={(update) => setDateRange(update)}
              minDate={new Date()}
              maxDate={
                startDate ? new Date(startDate.getTime() + MAX_BOOK_DAYS * 24 * 60 * 60 * 1000) : null
              }
              excludeDates={bookedDates.map((date) => new Date(`${date}T00:00:00`))}
              inline
              className="clean-date-picker"
            />

            <p className="small text-muted mt-2 mb-0">
              Maximum {MAX_BOOK_DAYS} days. Unavailable dates are disabled.
            </p>

            <div className="text-end mt-3">
              <button className="btn btn-success me-2" onClick={handleConfirmBooking}>
                Confirm
              </button>
              <button className="btn btn-secondary" onClick={() => setShowBookingModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
