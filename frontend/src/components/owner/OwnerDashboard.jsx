import { useEffect, useMemo, useState } from "react";
import "./owner.css";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import OwnerFooter from "./OwnerFooter";
import OwnerNavbar from "./OwnerNavbar";
import VehicleImage from "../VehicleImage";
import API, { getVehicleImage } from "../../api";

export default function OwnerDashboard() {
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [vehicleRes, bookingRes] = await Promise.all([
          API.get("/vehicle/my-vehicles"),
          API.get("/booking/owner"),
        ]);
        setVehicles(vehicleRes.data?.vehicles || []);
        setBookings(bookingRes.data?.bookings || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const stats = useMemo(() => {
    const completed = bookings.filter((booking) => booking.status === "completed");
    return {
      totalVehicles: vehicles.length,
      approved: vehicles.filter((vehicle) => vehicle.approvalStatus === "approved").length,
      pending: vehicles.filter((vehicle) => vehicle.approvalStatus === "pending").length,
      activeBookings: bookings.filter((booking) =>
        ["pending", "confirmed"].includes(booking.status)
      ).length,
      completedBookings: completed.length,
      earnings: completed.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0),
    };
  }, [vehicles, bookings]);

  if (loading) return <h4 className="text-center mt-5">Loading dashboard...</h4>;

  return (
    <div className="ownerdashboard-page page-shell">
      <OwnerNavbar active="dashboard" />

      <main className="page-main">
      <div className="hero-section">
        <img src="/assets/bg2.jpg" className="h-img" alt="" />
        <div className="hero-content">
          <h1>List your cars and bikes — start earning instantly</h1>
          <h4>Manage Your Fleet With Ease</h4>
        </div>
      </div>

      <div className="container my-5">
        <div className="row g-3">
          {[
            ["Vehicles", stats.totalVehicles, "bi-car-front-fill"],
            ["Approved", stats.approved, "bi-check-circle-fill"],
            ["Pending approval", stats.pending, "bi-hourglass-split"],
            ["Active bookings", stats.activeBookings, "bi-calendar-check-fill"],
            ["Completed rides", stats.completedBookings, "bi-flag-fill"],
            ["Earnings", `₹${stats.earnings}`, "bi-cash-stack"],
          ].map(([label, value, icon]) => (
            <div className="col-6 col-md-4 col-lg-2" key={label}>
              <div className="card shadow-sm text-center p-3 h-100">
                <i className={`bi ${icon} fs-3 text-danger`}></i>
                <h5 className="fw-bold mt-2 mb-1">{value}</h5>
                <small className="text-muted">{label}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-5 mb-3">
          <h4 className="fw-bold mb-0">Recent Vehicles</h4>
          <Link to="/owner/my-vehicles" className="btn btn-sm btn-outline-danger">
            View all
          </Link>
        </div>

        <div className="row g-4">
          {vehicles.length === 0 ? (
            <h6 className="text-center mt-3 text-muted">No vehicles added yet.</h6>
          ) : (
            vehicles.slice(0, 6).map((item) => (
              <div className="col-sm-6 col-lg-3" key={item._id}>
                <div className="card shadow-sm h-100">
                  <VehicleImage
                    src={getVehicleImage(item)}
                    className="card-img-top"
                    style={{ height: "160px", objectFit: "cover" }}
                    alt={item.name || "vehicle"}
                  />
                  <div className="card-body text-center">
                    <h6 className="fw-bold">{item.name}</h6>
                    <p className="mb-1 text-capitalize">{item.type}</p>
                    <p className="mb-1">₹{item.pricePerDay}/day</p>
                    <span
                      className={`badge ${
                        item.approvalStatus === "approved"
                          ? "bg-success"
                          : item.approvalStatus === "rejected"
                          ? "bg-danger"
                          : "bg-warning text-dark"
                      }`}
                    >
                      {item.approvalStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-5 mb-3">
          <h4 className="fw-bold mb-0">Recent Bookings</h4>
          <Link to="/owner/bookings" className="btn btn-sm btn-outline-danger">
            View all
          </Link>
        </div>

        <div className="table-responsive card shadow-sm p-3">
          {bookings.length === 0 ? (
            <p className="text-muted mb-0">No bookings yet.</p>
          ) : (
            <table className="table table-sm align-middle mb-0">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Dates</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.vehicleId?.name || "Removed"}</td>
                    <td>{booking.userId?.name || "N/A"}</td>
                    <td className="small">
                      {new Date(booking.pickupDate).toLocaleDateString("en-IN", {
                        timeZone: "UTC",
                      })}{" "}
                      -{" "}
                      {new Date(booking.dropDate).toLocaleDateString("en-IN", {
                        timeZone: "UTC",
                      })}
                    </td>
                    <td>
                      <span className="badge bg-secondary text-capitalize">
                        {booking.status}
                      </span>
                    </td>
                    <td>₹{booking.totalPrice}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      </main>

      <OwnerFooter />
    </div>
  );
}
