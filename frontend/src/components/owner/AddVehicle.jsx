import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import "./addvehicle.css";
import { useState } from "react";
import API from "../../api";
import OwnerFooter from "./OwnerFooter";
import OwnerNavbar from "./OwnerNavbar";

const initialDetails = {
  name: "",
  type: "",
  brand: "",
  model: "",
  pricePerDay: "",
  location: "",
  contactNumber: "",
};

export default function AddVehicle() {
  const [details, setDetails] = useState(initialDetails);
  const [images, setImages] = useState([]);
  const [rcDoc, setRcDoc] = useState(null);
  const [insuranceDoc, setInsuranceDoc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !details.name ||
      !details.type ||
      !details.brand ||
      !details.model ||
      !details.pricePerDay ||
      !details.location ||
      !details.contactNumber
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (images.length === 0) {
      toast.error("Please upload at least one vehicle image.");
      return;
    }

    const data = new FormData();
    Object.entries(details).forEach(([key, value]) => data.append(key, value));
    images.slice(0, 5).forEach((image) => data.append("images", image));
    if (rcDoc) data.append("rcDoc", rcDoc);
    if (insuranceDoc) data.append("insuranceDoc", insuranceDoc);

    setSubmitting(true);

    try {
      await API.post("/vehicle/add", data);
      toast.success("Vehicle added successfully! It is pending admin approval.");
      navigate("/owner/my-vehicles");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding vehicle. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="addvehicle-page page-shell">
      <OwnerNavbar active="add" />

      <div className="container form-container page-main mb-5">
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
              <label className="form-label">Price per Day (₹)</label>
              <input
                type="number"
                min="1"
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
              <label className="form-label">Vehicle Images (up to 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setImages(Array.from(e.target.files || []).slice(0, 5))}
                className="form-control"
              />
              {images.length > 0 && (
                <small className="text-muted">{images.length} image(s) selected</small>
              )}
            </div>

            <div className="col-md-6">
              <label className="form-label">RC Document (image/PDF)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setRcDoc(e.target.files?.[0] || null)}
                className="form-control"
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Insurance Document (image/PDF)</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setInsuranceDoc(e.target.files?.[0] || null)}
                className="form-control"
              />
            </div>
          </div>

          <div className="text-center mt-5">
            <button type="submit" className="btn btn-success px-5 me-3" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
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
