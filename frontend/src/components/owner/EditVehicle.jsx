import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./owner.css";
import OwnerFooter from "./OwnerFooter";
import OwnerNavbar from "./OwnerNavbar";
import VehicleImage from "../VehicleImage";
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
  const [files, setFiles] = useState({ images: [], rcDoc: null, insuranceDoc: null });
  const [preview, setPreview] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await API.get("/vehicle/my-vehicles");
        const v = (res.data.vehicles || []).find((item) => item._id === id);
        if (!v) throw new Error("Vehicle not found");
        setVehicle(v);
        setIsAvailable(v.isAvailable !== false);

        setForm({
          name: v.name || "",
          type: v.type || "",
          brand: v.brand || "",
          model: v.model || "",
          pricePerDay: v.pricePerDay || "",
          location: v.location || "",
          contactNumber: v.contactNumber || "",
        });

        const images = v.images?.length
          ? v.images.map((image) => getImageUrl(image))
          : v.vehicleImage
          ? [getImageUrl(v.vehicleImage)]
          : [];
        setPreview(images);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load vehicle details.");
        navigate("/owner/my-vehicles");
      }
    };

    fetchVehicle();
  }, [id, navigate]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImagesChange = (e) => {
    const selected = Array.from(e.target.files || []).slice(0, 5);
    setFiles((prev) => ({ ...prev, images: selected }));
    setPreview(selected.map((file) => URL.createObjectURL(file)));
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
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    files.images.forEach((image) => data.append("images", image));
    if (files.rcDoc) data.append("rcDoc", files.rcDoc);
    if (files.insuranceDoc) data.append("insuranceDoc", files.insuranceDoc);

    try {
      await API.put(`/vehicle/update/${id}`, data);

      if (vehicle.isAvailable !== isAvailable) {
        await API.put(`/vehicle/${id}/availability`, { isAvailable });
      }

      toast.success("Vehicle updated successfully!");
      setTimeout(() => navigate("/owner/my-vehicles"), 700);
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) {
    return <div className="text-center mt-5"><h4>Loading vehicle details...</h4></div>;
  }

  return (
    <div className="page-shell">
      <ToastContainer />
      <OwnerNavbar active="vehicles" />

      <div className="container my-5 page-main">
        <h3 className="fw-bold text-center mb-2">Edit Vehicle</h3>
        {vehicle.approvalStatus === "rejected" && vehicle.rejectionReason && (
          <div className="alert alert-danger">
            <strong>Rejected:</strong> {vehicle.rejectionReason}
          </div>
        )}

        <div className="row text-center mb-4">
          {preview.length > 0 ? (
            preview.map((image, index) => (
              <div className="col-6 col-md-3 col-lg-2 mb-3" key={`${image}-${index}`}>
                <VehicleImage
                  src={image}
                  alt={`vehicle preview ${index + 1}`}
                  className="img-fluid rounded border"
                  style={{ height: "110px", width: "100%", objectFit: "cover" }}
                />
              </div>
            ))
          ) : (
            <p className="text-muted">No vehicle images uploaded</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Vehicle Name</label>
              <input className="form-control" name="name" value={form.name} onChange={handleChange} />
            </div>

            <div className="col-md-6">
              <label className="form-label">Type</label>
              <select className="form-select" name="type" value={form.type} onChange={handleChange}>
                <option value="">Select Type</option>
                <option value="bike">Bike</option>
                <option value="car">Car</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label">Brand</label>
              <input className="form-control" name="brand" value={form.brand} onChange={handleChange} />
            </div>

            <div className="col-md-6">
              <label className="form-label">Model</label>
              <input className="form-control" name="model" value={form.model} onChange={handleChange} />
            </div>

            <div className="col-md-6">
              <label className="form-label">Price Per Day (₹)</label>
              <input
                type="number"
                min="1"
                className="form-control"
                name="pricePerDay"
                value={form.pricePerDay}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Location</label>
              <input
                className="form-control"
                name="location"
                value={form.location}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Contact Number</label>
              <input
                className="form-control"
                name="contactNumber"
                value={form.contactNumber}
                onChange={handleChange}
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Replace Images (up to 5)</label>
              <input
                type="file"
                accept="image/*"
                multiple
                className="form-control"
                onChange={handleImagesChange}
              />
              <small className="text-muted">Leave empty to keep existing images.</small>
            </div>

            <div className="col-md-6">
              <label className="form-label">Replace RC Document</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="form-control"
                onChange={(e) =>
                  setFiles((prev) => ({ ...prev, rcDoc: e.target.files?.[0] || null }))
                }
              />
            </div>

            <div className="col-md-6">
              <label className="form-label">Replace Insurance Document</label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="form-control"
                onChange={(e) =>
                  setFiles((prev) => ({ ...prev, insuranceDoc: e.target.files?.[0] || null }))
                }
              />
            </div>

            <div className="col-12">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="availability"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="availability">
                  Vehicle is available for booking
                </label>
              </div>
              <small className="text-muted">
                Replacing documents sends the vehicle back for admin approval.
              </small>
            </div>
          </div>

          <div className="text-center mt-4">
            <button className="update-vehicle-btn px-4 me-3" type="submit" disabled={loading}>
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

      <OwnerFooter />
    </div>
  );
}
