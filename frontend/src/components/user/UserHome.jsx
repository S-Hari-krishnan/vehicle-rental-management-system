import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API, { getImageUrl } from "../../api";
import UserFooter from "./UserFooter";
import "./userhome.css";

export default function UserHome() {
  const [vehicles, setVehicles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("token") !== null;

    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    fetchPopularVehicles();
  }, [navigate]);

  const fetchPopularVehicles = async () => {
    try {
      const res = await API.get("/vehicle/all");

      const allVehicles = res.data?.vehicles || [];

      const shuffled = [...allVehicles].sort(() => 0.5 - Math.random());
      setVehicles(shuffled.slice(0, 8));
    } catch (error) {
      console.log(error);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="userhome-page">
      {/* INLINE USER NAVBAR HERE */}
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
                <Link to="/user/home" className="nav-link fw-bold text-danger">
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
      {/* END INLINE NAVBAR */}

      {/* Hero Section */}
      <div className="hero-section">
        <img src="/assets/bg1.jpg" className="h-img" alt="" />
        <div className="hero-content">
          <h1>Find the perfect ride for your journey</h1>
          <h4>Affordable • Fast • Reliable</h4>
        </div>
      </div>

      {/* Intro */}
      <div className="intro mt-5">
        <h3 className="fw-bold">Trusted by Thousands of Riders</h3>
        <h6>
          Choose from a wide range of well-maintained bikes and cars at the best
          prices.
        </h6>
      </div>

      {/* Features */}
      <div className="container mt-5">
        <div className="row text-center g-4">
          {[
            ["bi-clock-history", "24/7 Support"],
            ["bi-cash-coin", "Affordable Pricing"],
            ["bi-geo-alt", "Pickup Anywhere"],
            ["bi-infinity", "Unlimited KMs"],
            ["bi-house-door", "Home Delivery Available"],
            ["bi-car-front", "Multiple Options"],
          ].map(([icon, text], i) => (
            <div className="col col-md-4 col-lg-2 col-sm-6" key={i}>
              <i className={`bi ${icon} fs-1 text-danger`}></i>
              <p className="fw-semibold mt-2">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Vehicles */}
      <div className="vechicle-display my-5">
        <h2 className="fw-bold text-center mb-4">Popular Rentals</h2>

        <div className="scroll-container d-flex gap-3 mx-3">
          {vehicles.length === 0 ? (
            <h5>No vehicles available</h5>
          ) : (
            vehicles.map((v) => (
              <div
                key={v._id}
                className="card col col-sm-6 col-lg-2 p-0"
                style={{ minWidth: "250px" }}
              >
                <img
                  src={getImageUrl(v.vehicleImage)}
                  className="card-img-top"
                  alt={v.name}
                />

                <div className="card-body text-center">
                  <h6 className="fw-bold">{v.name}</h6>
                  <p className="mb-1">{v.type}</p>
                  <p>₹{v.pricePerDay}/day</p>

                  <Link to={`/vehicle/${v._id}`} className="btn btn-sm w-50 p-1">
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <UserFooter />
    </div>
  );
}