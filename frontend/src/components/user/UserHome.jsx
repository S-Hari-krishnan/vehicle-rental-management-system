import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import API, { getVehicleImage } from "../../api";
import UserFooter from "./UserFooter";
import UserNavbar from "./UserNavbar";
import VehicleImage from "../VehicleImage";
import "./userhome.css";

export default function UserHome() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularVehicles = async () => {
      try {
        const res = await API.get("/vehicle/all", {
          params: { sort: "rating", limit: 8 },
        });
        setVehicles(res.data?.vehicles || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularVehicles();
  }, []);

  return (
    <div className="userhome-page page-shell">
      <UserNavbar active="home" />

      <main className="page-main">
      <div className="hero-section">
        <img src="/assets/bg1.jpg" className="h-img" alt="" />
        <div className="hero-content">
          <h1>Find the perfect ride for your journey</h1>
          <h4>Affordable • Fast • Reliable</h4>
        </div>
      </div>

      <div className="intro mt-5">
        <h3 className="fw-bold">Trusted by Thousands of Riders</h3>
        <h6>
          Choose from a wide range of well-maintained bikes and cars at the best prices.
        </h6>
      </div>

      <div className="container mt-5">
        <div className="row text-center g-4">
          {[
            ["bi-clock-history", "24/7 Support"],
            ["bi-cash-coin", "Affordable Pricing"],
            ["bi-geo-alt", "Pickup Anywhere"],
            ["bi-infinity", "Unlimited KMs"],
            ["bi-house-door", "Home Delivery Available"],
            ["bi-car-front", "Multiple Options"],
          ].map(([icon, text]) => (
            <div className="col col-md-4 col-lg-2 col-sm-6" key={text}>
              <i className={`bi ${icon} fs-1 text-danger`}></i>
              <p className="fw-semibold mt-2">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="vechicle-display my-5">
        <h2 className="fw-bold text-center mb-4">Popular Rentals</h2>

        {loading ? (
          <h5 className="text-center">Loading...</h5>
        ) : vehicles.length === 0 ? (
          <h5 className="text-center">No vehicles available</h5>
        ) : (
          <div className="scroll-container d-flex gap-3 mx-3">
            {vehicles.map((v) => (
              <div
                key={v._id}
                className="card col col-sm-6 col-lg-2 p-0"
                style={{ minWidth: "250px" }}
              >
                <VehicleImage
                  src={getVehicleImage(v)}
                  className="card-img-top"
                  alt={v.name}
                />

                <div className="card-body text-center">
                  <h6 className="fw-bold">{v.name}</h6>
                  <p className="mb-1 text-capitalize">{v.type}</p>
                  <p className="small mb-1">
                    <i className="bi bi-geo-alt"></i> {v.location}
                  </p>
                  <p className="small mb-1">
                    <i className="bi bi-star-fill text-warning"></i>{" "}
                    {v.ratingAverage || 0} ({v.ratingCount || 0})
                  </p>
                  <p className="fw-semibold">₹{v.pricePerDay}/day</p>

                  <Link to={`/vehicle/${v._id}`} className="btn btn-sm w-75 p-1">
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-4">
          <Link to="/vehicles/cars" className="btn btn-outline-danger me-2">
            Browse Cars
          </Link>
          <Link to="/vehicles/bikes" className="btn btn-outline-danger">
            Browse Bikes
          </Link>
        </div>
      </div>
      </main>

      <UserFooter />
    </div>
  );
}
