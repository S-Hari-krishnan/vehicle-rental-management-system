import "./home.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API, { getImageUrl } from "../api";
import VehicleImage from "./VehicleImage";

export default function Home() {
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetchPopularVehicles();
  }, []);

  const fetchPopularVehicles = async () => {
    try {
      const res = await API.get("/vehicle/all");
      const allVehicles = res.data?.vehicles || [];

      // random 8 vehicles
      const shuffled = [...allVehicles].sort(() => 0.5 - Math.random());
      setVehicles(shuffled.slice(0, 8));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="home-page page-shell">
      {/* navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid px-3 px-lg-5">
          <Link to="/" className="navbar-brand fw-bold" style={{ color: "red" }}>
            Hari Rentals
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navContent"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="navContent">
            <ul className="navbar-nav gap-2 gap-lg-4 align-items-lg-center py-2 py-lg-0">
              <li className="nav-item">
                <Link to="/" className="nav-link active">
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
                <Link className="btn mb-2 mb-lg-0 px-3" to="/login">
                  Login
                </Link>
              </li>

              <li className="nav-item">
                <Link className="btn px-3" to="/signup">
                  SignUp
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main className="page-main">
        {/* hero section */}
      <div className="hero-section">
        <img src="/assets/bg1.jpg" className="h-img" alt="" />

        <div className="hero-content">
          <h1>Ride your dreams - anytime, anywhere</h1>
          <h4>Wheels that you want</h4>
        </div>
      </div>

      {/* intro section */}
      <div className="intro mt-5">
        <h3 className="fw-bold">The Biggest Online Car & Bike Rental Service</h3>
        <h6>
          We’ve simplified car & bike rentals. Easy & quick online booking with
          unbeatable rates. Clean & well-maintained vehicles at your fingertips.
        </h6>
      </div>

      {/* Features */}
      <div className="container mt-5">
        <div className="row text-center g-4">
          {[
            ["bi-clock-history", "24/7 Services"],
            ["bi-cash-coin", "No Hidden Charges"],
            ["bi-geo-alt", "Go Anywhere"],
            ["bi-infinity", "Unlimited KMs"],
            ["bi-house-door", "Doorstep Delivery"],
            ["bi-car-front", "Wide Range of Vehicles"],
          ].map(([icon, text], i) => (
            <div className="col col-md-4 col-lg-2 col-sm-6" key={i}>
              <i className={`bi ${icon} fs-1 text-danger`}></i>
              <p className="fw-semibold mt-2">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vehicle Display */}
      <div className="vechicle-display my-5">
        <h2 className="fw-bold text-center mb-4">Popular Rentals</h2>

        <div className="scroll-container d-flex gap-3">
          {vehicles.length === 0 ? (
            <h5 className="text-center">No vehicles available</h5>
          ) : (
            vehicles.map((v) => (
              <div
                key={v._id}
                className="card col col-sm-6 col-lg-2 p-0"
                style={{ minWidth: "250px" }}
              >
                <VehicleImage
                  src={getImageUrl(v.vehicleImage)}
                  className="card-img-top"
                  alt={v.name || "vehicle"}
                />

                <div className="card-body text-center">
                  <h6 className="fw-bold">{v.name}</h6>
                  <p className="mb-1">{v.type}</p>
                  <p>₹{v.pricePerDay}/day</p>

                  <Link to="/login" className="btn btn-sm w-25 p-1">
                    Book
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* owner call */}
      <div className="owner-call text-center my-5">
        <h3 className="fw-bold">Have a vehicle? Start Earning Today!</h3>
        <p className="text-muted">
          Join <span className="text-danger fw-semibold">Hari Rentals</span>{" "}
          and list your bike or car in minutes. Earn effortlessly by sharing your
          ride with trusted customers.
        </p>

        <Link to="/login" className="btn">
          List Your Vehicle
        </Link>
      </div>
      </main>

      {/* Footer Section */}
      <footer className="footer py-4 text-white">
        <div className="container">
          <div className="row text-center text-md-start">
            {/* Column 1 - Brand */}
            <div className="col-md-4 mb-3">
              <h5 className="fw-bold">Hari Rentals</h5>
              <p className="small">
                Your trusted platform for renting bikes and cars — fast, easy,
                and affordable.
              </p>
            </div>

            {/* Column 2 - Quick Links */}
            <div className="col-md-4 mb-3">
              <h6 className="fw-semibold">Quick Links</h6>
              <ul className="list-unstyled">
                <li>
                  <Link to="/" className="footer-link">
                    Home
                  </Link>
                </li>

                <li>
                  <Link to="/vehicles/cars" className="footer-link">
                    Cars
                  </Link>
                </li>

                <li>
                  <Link to="/vehicles/bikes" className="footer-link">
                    Bikes
                  </Link>
                </li>

                <li>
                  <Link to="/contact" className="footer-link">
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3 - Contact */}
            <div className="col-md-4 mb-3">
              <h6 className="fw-semibold">Get in Touch</h6>

              <p className="small mb-1">
                <i className="bi bi-envelope-fill me-2"></i>
                support@harirentals.com
              </p>

              <p className="small mb-1">
                <i className="bi bi-telephone-fill me-2"></i>
                +91 98765 43210
              </p>

              <p className="small">
                <i className="bi bi-geo-alt-fill me-2"></i>
                Madurai, Tamil Nadu
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="text-center mt-3 border-top pt-3 small">
            © {new Date().getFullYear()} Hari Rentals. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}