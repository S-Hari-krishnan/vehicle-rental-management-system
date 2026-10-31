import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./owner.css";
import { toast } from "react-toastify";
import OwnerFooter from "./OwnerFooter";
import OwnerNavbar from "./OwnerNavbar";
import VehicleImage from "../VehicleImage";
import API, { getImageUrl, getVehicleImage } from "../../api";

const emptyBlocked = { start: "", end: "", reason: "Maintenance" };

export default function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [blockedForm, setBlockedForm] = useState(emptyBlocked);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await API.get("/vehicle/my-vehicles");
      setVehicles(res.data?.vehicles || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch vehicles");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setBlockedForm(emptyBlocked);
  };

  const closeModal = () => setSelectedVehicle(null);

  const replaceVehicle = (vehicle) => {
    setVehicles((prev) => prev.map((item) => (item._id === vehicle._id ? vehicle : item)));
    setSelectedVehicle(vehicle);
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to delete this vehicle?")) return;

    try {
      await API.delete(`/vehicle/delete/${vehicleId}`);
      toast.success("Vehicle deleted successfully");
      setVehicles((prev) => prev.filter((v) => v._id !== vehicleId));
      closeModal();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete vehicle");
    }
  };

  const toggleAvailability = async (vehicle) => {
    try {
      const res = await API.put(`/vehicle/${vehicle._id}/availability`, {
        isAvailable: !vehicle.isAvailable,
      });
      replaceVehicle(res.data.vehicle);
      toast.success(res.data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update availability");
    }
  };

  const addBlockedDates = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post(`/vehicle/${selectedVehicle._id}/blocked-dates`, blockedForm);
      replaceVehicle(res.data.vehicle);
      setBlockedForm(emptyBlocked);
      toast.success("Dates blocked successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block dates");
    }
  };

  const removeBlockedDates = async (blockedId) => {
    try {
      const res = await API.delete(
        `/vehicle/${selectedVehicle._id}/blocked-dates/${blockedId}`
      );
      replaceVehicle(res.data.vehicle);
      toast.success("Blocked dates removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove blocked dates");
    }
  };

  const openDocument = async (vehicleId, type) => {
    try {
      const res = await API.get(`/vehicle/${vehicleId}/documents/${type}`);
      const url = getImageUrl(res.data.url);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error.response?.data?.message || "Document not found");
    }
  };

  return (
    <div className="page-shell">
      <OwnerNavbar active="vehicles" />

      <div className="container mt-4 page-main mb-5">
        <h3 className="fw-bold text-center mb-4">My Vehicles</h3>

        {loading ? (
          <h5 className="text-center mt-4">Loading...</h5>
        ) : vehicles.length === 0 ? (
          <h5 className="text-center mt-4">No vehicles added yet.</h5>
        ) : (
          <div className="row g-4">
            {vehicles.map((item) => (
              <div className="col-sm-6 col-lg-3" key={item._id}>
                <div
                  className="card h-100 shadow-sm"
                  style={{ cursor: "pointer" }}
                  onClick={() => openModal(item)}
                >
                  <VehicleImage
                    src={getVehicleImage(item)}
                    className="card-img-top"
                    style={{ height: "170px", objectFit: "cover" }}
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
                    <span
                      className={`badge ms-1 ${item.isAvailable ? "bg-primary" : "bg-secondary"}`}
                    >
                      {item.isAvailable ? "Visible" : "Hidden"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedVehicle && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <h4 className="text-center mb-3 fw-bold">{selectedVehicle.name}</h4>

            <div className="d-flex gap-2 overflow-auto mb-3">
              {(selectedVehicle.images?.length
                ? selectedVehicle.images
                : [{ url: selectedVehicle.vehicleImage }]
              ).map((image, index) => (
                <VehicleImage
                  key={`${image.url}-${index}`}
                  src={getImageUrl(image.url)}
                  className="rounded border"
                  style={{ width: "120px", height: "85px", objectFit: "cover" }}
                  alt={`${selectedVehicle.name} ${index + 1}`}
                />
              ))}
            </div>

            <div className="modal-details">
              <p><strong>Type:</strong> {selectedVehicle.type}</p>
              <p><strong>Brand:</strong> {selectedVehicle.brand}</p>
              <p><strong>Model:</strong> {selectedVehicle.model}</p>
              <p><strong>Price/Day:</strong> ₹{selectedVehicle.pricePerDay}</p>
              <p><strong>Location:</strong> {selectedVehicle.location}</p>
              <p><strong>Contact:</strong> {selectedVehicle.contactNumber}</p>
              <p>
                <strong>Approval:</strong>{" "}
                <span className="text-capitalize">{selectedVehicle.approvalStatus}</span>
              </p>
              {selectedVehicle.rejectionReason && (
                <p className="text-danger">
                  <strong>Rejection reason:</strong> {selectedVehicle.rejectionReason}
                </p>
              )}
              <p>
                <strong>Rating:</strong> {selectedVehicle.ratingAverage || 0} (
                {selectedVehicle.ratingCount || 0} reviews)
              </p>
            </div>

            <div className="d-flex gap-2 flex-wrap my-3">
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => openDocument(selectedVehicle._id, "rc")}
              >
                View RC
              </button>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => openDocument(selectedVehicle._id, "insurance")}
              >
                View Insurance
              </button>
              <button
                className={`btn btn-sm ${selectedVehicle.isAvailable ? "btn-outline-secondary" : "btn-outline-success"}`}
                onClick={() => toggleAvailability(selectedVehicle)}
              >
                {selectedVehicle.isAvailable ? "Mark unavailable" : "Mark available"}
              </button>
            </div>

            <hr />
            <h6 className="fw-bold">Blocked Dates</h6>

            {selectedVehicle.blockedDates?.length ? (
              <ul className="list-group mb-2">
                {selectedVehicle.blockedDates.map((blocked) => (
                  <li
                    key={blocked._id}
                    className="list-group-item d-flex justify-content-between align-items-center small"
                  >
                    <span>
                      {String(blocked.start).slice(0, 10)} to {String(blocked.end).slice(0, 10)}
                      {blocked.reason ? ` — ${blocked.reason}` : ""}
                    </span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeBlockedDates(blocked._id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted small">No blocked dates.</p>
            )}

            <form className="row g-2 align-items-end" onSubmit={addBlockedDates}>
              <div className="col-6">
                <label className="form-label small mb-1">Start</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={blockedForm.start}
                  onChange={(e) =>
                    setBlockedForm((prev) => ({ ...prev, start: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="col-6">
                <label className="form-label small mb-1">End</label>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={blockedForm.end}
                  onChange={(e) => setBlockedForm((prev) => ({ ...prev, end: e.target.value }))}
                  required
                />
              </div>
              <div className="col-8">
                <input
                  className="form-control form-control-sm"
                  placeholder="Reason"
                  value={blockedForm.reason}
                  onChange={(e) =>
                    setBlockedForm((prev) => ({ ...prev, reason: e.target.value }))
                  }
                />
              </div>
              <div className="col-4">
                <button className="btn btn-sm btn-danger w-100">Block</button>
              </div>
            </form>

            <div className="text-center mt-4">
              <button
                className="btn btn-primary px-4 me-2"
                onClick={() => navigate(`/owner/edit-vehicle/${selectedVehicle._id}`)}
              >
                Edit
              </button>
              <button
                className="btn btn-danger px-4 me-2"
                onClick={() => handleDelete(selectedVehicle._id)}
              >
                Delete
              </button>
              <button className="btn btn-secondary px-4" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <OwnerFooter />
    </div>
  );
}
