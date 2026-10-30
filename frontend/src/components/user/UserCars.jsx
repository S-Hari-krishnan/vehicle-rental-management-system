import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API, { getImageUrl } from "../../api";
import "./uservehicles.css";
import UserFooter from "./UserFooter";

export default function UserCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    getCars();
  }, [navigate]);

  const getCars = async () => {
    try {
      const res = await API.get("/vehicle/all");
      const vehicles = res.data?.vehicles || [];

      const carList = vehicles.filter((v) => v.type === "car");
      setCars(carList);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  return (
    <div className="vehicle-page">
      {/* INLINE USER NAVBAR */}
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
                <Link to="/vehicles/cars" className="nav-link fw-bold text-danger">
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

      <div className="container my-5">
        <h2 className="fw-bold text-center mb-4">Available Cars</h2>

        {loading ? (
          <h4 className="text-center">Loading...</h4>
        ) : cars.length === 0 ? (
          <h5 className="text-center">No cars available at the moment.</h5>
        ) : (
          <div className="row g-4">
            {cars.map((car) => (
              <div className="col-md-4 col-lg-3" key={car._id}>
                <div className="card vehicle-card shadow-sm">
                  <img
                    src={getImageUrl(car.vehicleImage)}
                    className="card-img-top"
                    alt={car.name}
                  />

                  <div className="card-body text-center">
                    <h6 className="fw-bold">{car.name}</h6>
                    <p className="mb-1">
                      {car.brand} • {car.model}
                    </p>
                    <p className="text-danger fw-bold">
                      ₹{car.pricePerDay}/day
                    </p>

                    <Link
                      to={`/vehicle/${car._id}`}
                      className="btn btn-sm w-75 view-btn"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UserFooter />
    </div>
  );
}