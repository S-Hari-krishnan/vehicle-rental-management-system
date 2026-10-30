import React, { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./owner.css";
import OwnerFooter from "./OwnerFooter";
import API, { getImageUrl } from "../../api";

export default function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "",
    brand: "",
    model: "",
    pricePerDay: "",
    location: "",
    contactNumber: "",
  });

  const [files, setFiles] = useState({
    vehicleImage: null,
    rcDoc: null,
    insuranceDoc: null,
  });

  const [preview, setPreview] = useState({
    vehicleImage: "",
    rcDoc: "",
    insuranceDoc: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || role !== "owner") {
      toast.error("Access denied!");
      navigate("/login");
      return;
    }

    fetchVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const fetchVehicle = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await API.get(`/vehicle/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const v = res.data.vehicle;
      setVehicle(v);

      setForm({
        name: v.name || "",
        type: v.type || "",
        brand: v.brand || "",
        model: v.model || "",
        pricePerDay: v.pricePerDay || "",
        location: v.location || "",
        contactNumber: v.contactNumber || "",
      });

      setPreview({
        vehicleImage: getImageUrl(v.vehicleImage),
        rcDoc: v.rcDoc ? getImageUrl(v.rcDoc) : "",
        insuranceDoc: v.insuranceDoc ? getImageUrl(v.insuranceDoc) : "",
      });
    } catch (err) {
      console.error(err);

      if (err.response && err.response.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      toast.error("Failed to load vehicle details.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    const file = selectedFiles[0];

    if (!file) return;

    setFiles((prev) => ({
      ...prev,
      [name]: file,
    }));

    setPreview((prev) => ({
      ...prev,
      [name]: URL.createObjectURL(file),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name ||
      !form.type ||
      !form.brand ||
      !form.model ||
      !form.pricePerDay ||
      !form.location ||
      !form.contactNumber
    ) {
      toast.error("Please fill required fields.");
      return;
    }

    setLoading(true);

    const data = new FormData();

    Object.keys(form).forEach((key) => {
      data.append(key, form[key]);
    });

    if (files.vehicleImage) data.append("vehicleImage", files.vehicleImage);
    if (files.rcDoc) data.append("rcDoc", files.rcDoc);
    if (files.insuranceDoc) data.append("insuranceDoc", files.insuranceDoc);

    try {
      const token = localStorage.getItem("token");

      await API.put(`/vehicle/update/${id}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Vehicle updated successfully!");
      setTimeout(() => navigate("/owner/my-vehicles"), 800);
    } catch (err) {
      console.error(err);

      if (err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/login");
        return;
      }

      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      toast.success("Logged out successfully");
      navigate("/login");
    }
  };

  if (!vehicle) {
    return (
      <div className="text-center mt-5">
        <h4>Loading vehicle details...</h4>
      </div>
    );
  }

  return (
    <div className="page-with-fixed-footer">
      <ToastContainer />

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
                <Link to="/owner/add-vehicle" className="nav-link">
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

      <div className="container my-4">
        <h3 className="fw-bold text-center mb-4">Edit Vehicle</h3>

        <div className="row text-center mb-4">
          <div className="col-md-4 mb-3">
            <h6 className="fw-bold mb-2">Vehicle Image</h6>

            {preview.vehicleImage ? (
              <img
                src={preview.vehicleImage}
                alt="vehicle preview"
                className="img-fluid rounded border"
                style={{ maxHeight: "200px", objectFit: "cover" }}
              />
            ) : (
              <p className="text-muted">No vehicle image uploaded</p>
            )}
          </div>

          <div className="col-md-4 mb-3">
            <h6 className="fw-bold mb-2">RC Document</h6>

            {preview.rcDoc ? (
              <img
                src={preview.rcDoc}
                alt="rc preview"
                className="img-fluid rounded border"
                style={{ maxHeight: "200px", objectFit: "cover" }}
              />
            ) : (
              <p className="text-muted">No RC uploaded</p>
            )}
          </div>

          <div className="col-md-4 mb-3">
            <h6 className="fw-bold mb-2">Insurance Document</h6>

            {preview.insuranceDoc ? (
              <img
                src={preview.insuranceDoc}
                alt="insurance preview"
                className="img-fluid rounded border"
                style={{ maxHeight: "200px", objectFit: "cover" }}
              />
            ) : (
              <p className="text-muted">No Insurance uploaded</p>
            )}
          </div>
        </div>

        {/* EDIT VEHICLE FORM BELOW */}
        <div className="row mx-4">
          <div className="col-12">
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* Vehicle Name */}
                <div className="col-md-6">
                  <label className="form-label">Vehicle Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                {/* Type */}
                <div className="col-md-6">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                  >
                    <option value="">Select Type</option>
                    <option value="bike">Bike</option>
                    <option value="car">Car</option>
                  </select>
                </div>

                {/* Brand */}
                <div className="col-md-6">
                  <label className="form-label">Brand</label>
                  <input
                    className="form-control"
                    name="brand"
                    value={form.brand}
                    onChange={handleChange}
                  />
                </div>

                {/* Model */}
                <div className="col-md-6">
                  <label className="form-label">Model</label>
                  <input
                    className="form-control"
                    name="model"
                    value={form.model}
                    onChange={handleChange}
                  />
                </div>

                {/* Price */}
                <div className="col-md-6">
                  <label className="form-label">Price Per Day (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="pricePerDay"
                    value={form.pricePerDay}
                    onChange={handleChange}
                  />
                </div>

                {/* Location */}
                <div className="col-md-6">
                  <label className="form-label">Location</label>
                  <input
                    className="form-control"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                  />
                </div>

                {/* Contact */}
                <div className="col-md-6">
                  <label className="form-label">Contact Number</label>
                  <input
                    className="form-control"
                    name="contactNumber"
                    value={form.contactNumber}
                    onChange={handleChange}
                  />
                </div>

                {/* Replace Vehicle Image */}
                <div className="col-md-6">
                  <label className="form-label">Replace Vehicle Image</label>
                  <input
                    type="file"
                    name="vehicleImage"
                    className="form-control"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Replace RC */}
                <div className="col-md-6">
                  <label className="form-label">Replace RC Document</label>
                  <input
                    type="file"
                    name="rcDoc"
                    className="form-control"
                    onChange={handleFileChange}
                  />
                </div>

                {/* Replace Insurance */}
                <div className="col-md-6">
                  <label className="form-label">
                    Replace Insurance Document
                  </label>
                  <input
                    type="file"
                    name="insuranceDoc"
                    className="form-control"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              {/* BUTTONS */}
              <div className="text-center mt-4">
                <button
                  className="update-vehicle-btn px-4 me-3"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Vehicle"}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary px-4"
                  onClick={() => navigate("/owner/my-vehicles")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <OwnerFooter />
    </div>
  );
}