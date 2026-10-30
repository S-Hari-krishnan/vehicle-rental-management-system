import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom";
import "./addvehicle.css";
import { useEffect, useState } from "react";
import API from "../../api";
import OwnerFooter from "./OwnerFooter";

export default function AddVehicle() {
  const [details, setDetails] = useState({
    name: "",
    type: "",
    brand: "",
    model: "",
    pricePerDay: "",
    location: "",
    contactNumber: "",
    rcDoc: null,
    insuranceDoc: null,
    vehicleImage: null,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "owner") {
      toast.error("Please login as owner to access this page", {
        position: "top-center",
      });
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setDetails((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const {
      name,
      type,
      brand,
      model,
      pricePerDay,
      location,
      contactNumber,
      vehicleImage,
    } = details;

    if (
      !name ||
      !type ||
      !brand ||
      !model ||
      !pricePerDay ||
      !location ||
      !contactNumber
    ) {
      toast.error("Please fill in all required fields.", {
        position: "top-center",
      });
      return;
    }

    if (!vehicleImage) {
      toast.error("Please upload the vehicle image (mandatory)", {
        position: "top-center",
      });
      return;
    }

    const data = new FormData();

    for (const key in details) {
      if (details[key] !== null && details[key] !== "") {
        data.append(key, details[key]);
      }
    }

    const token = localStorage.getItem("token");

    try {
      const res = await API.post("/vehicle/add", data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.data.message === "Vehicle added successfully") {
        toast.success("Vehicle added successfully!", {
          position: "top-center",
        });
        navigate("/owner/my-vehicles");
      }
    } catch (error) {
      console.log(error);

      if (error.response && error.response.status === 403) {
        toast.error("Session expired. Please login again.", {
          position: "top-center",
        });
        localStorage.clear();
        navigate("/login");
        return;
      }

      toast.error(error.response?.data?.message || "Error adding vehicle. Try again.", {
        position: "top-center",
      });
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      toast.success("Logged out successfully", {
        position: "top-center",
      });
      navigate("/login");
    }
  };

  return (
    <div className="addvehicle-page">
      {/* Owner Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid mx-5">
          <Link
            to="/owner/dashboard"
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
                <Link to="/owner/dashboard" className="nav-link">
                  Dashboard
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  to="/owner/add-vehicle"
                  className="nav-link fw-bold text-danger"
                >
                  Add Vehicle
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/owner/my-vehicles" className="nav-link">
                  My Vehicles
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/owner/bookings" className="nav-link">
                  Bookings
                </Link>
              </li>

              <li className="nav-item">
                <button onClick={handleLogout} className="btn">
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Form */}
      <div className="container form-container">
        <h3 className="text-center my-4 fw-bold">Add Vehicle</h3>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Vehicle Name</label>
              <input
                type="text"
                name="name"
                value={details.name}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Type</label>
              <select
                name="type"
                value={details.type}
                className="form-select"
                onChange={handleChange}
              >
                <option value="">Select Type</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Brand</label>
              <input
                type="text"
                name="brand"
                value={details.brand}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Model</label>
              <input
                type="text"
                name="model"
                value={details.model}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Price per Day(₹)</label>
              <input
                type="number"
                name="pricePerDay"
                value={details.pricePerDay}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Location</label>
              <input
                type="text"
                name="location"
                value={details.location}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Contact Number</label>
              <input
                type="text"
                name="contactNumber"
                value={details.contactNumber}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Upload RC Document</label>
              <input
                type="file"
                name="rcDoc"
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Upload Insurance Document</label>
              <input
                type="file"
                name="insuranceDoc"
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Upload Vehicle Image</label>
              <input
                type="file"
                name="vehicleImage"
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>

          <div className="text-center mt-5">
            <button type="submit" className="btn btn-success px-5 me-3">
              Submit
            </button>

            <button
              type="button"
              className="btn btn-dark px-5"
              onClick={() => navigate("/owner/dashboard")}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <OwnerFooter />
    </div>
  );
}