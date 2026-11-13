import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "./adminvehicles.css";
import API, { getImageUrl, getVehicleImage } from "../../api";
import VehicleImage from "../VehicleImage";
import { toast } from "react-toastify";

export default function AdminVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const fetchVehicles = async (page = 1, currentFilters = filters) => {
    setLoading(true);

    try {
      const params = { page, limit: 12 };
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.status) params.status = currentFilters.status;

      const res = await API.get("/admin/vehicles", { params });
      setVehicles(res.data?.vehicles || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const statusFromUrl = searchParams.get("status") || "";
    const initial = { search: "", status: statusFromUrl };
    setFilters(initial);
    fetchVehicles(1, initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const approveVehicle = async (id) => {
    if (!window.confirm("Approve this vehicle?")) return;

    try {
      const res = await API.post(`/admin/vehicle/approve/${id}`);
      setVehicles((prev) =>
        prev.map((v) => (v._id === id ? { ...v, ...res.data.vehicle } : v))
      );
      setSelectedVehicle((prev) =>
        prev?._id === id ? { ...prev, ...res.data.vehicle } : prev
      );
      toast.success("Vehicle approved");
    } catch (error) {
      toast.error(error.response?.data?.message || "Approve failed");
    }
  };

  const rejectVehicle = async (vehicle) => {
    const reason = window.prompt("Enter rejection reason:", "");
    if (reason === null) return;
    if (reason.trim().length < 3) {
      toast.error("Rejection reason must be at least 3 characters");
      return;
    }

    try {
      const res = await API.post(`/admin/vehicle/reject/${vehicle._id}`, { reason });
      setVehicles((prev) =>
        prev.map((v) => (v._id === vehicle._id ? { ...v, ...res.data.vehicle } : v))
      );
      setSelectedVehicle((prev) =>
        prev?._id === vehicle._id ? { ...prev, ...res.data.vehicle } : prev
      );
      toast.success("Vehicle rejected");
    } catch (error) {
      toast.error(error.response?.data?.message || "Reject failed");
    }
  };

  const deleteVehicle = async (id) => {
    if (!window.confirm("Delete this vehicle and related bookings?")) return;

    try {
      await API.delete(`/admin/vehicle/${id}`);
      setVehicles((prev) => prev.filter((v) => v._id !== id));
      setSelectedVehicle(null);
      toast.success("Vehicle deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    }
  };

  const openDocument = async (vehicleId, type) => {
    try {
      const adminToken = localStorage.getItem("adminToken");
      const res = await API.get(`/vehicle/${vehicleId}/documents/${type}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      window.open(getImageUrl(res.data.url), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error.response?.data?.message || "Document not found");
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchVehicles(1, filters);
  };

  const statusClass = (status) =>
    status === "approved" ? "bg-success" : status === "rejected" ? "bg-danger" : "bg-warning text-dark";

  return (
    <div className="admin-vehicles-page">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid mx-5">
          <Link to="/admin/dashboard" className="navbar-brand fw-bold" style={{ color: "red" }}>
            Hari Rentals — Admin
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="adminNav">
            <ul className="navbar-nav gap-4">
              <li className="nav-item"><Link to="/admin/dashboard" className="nav-link fw-semibold">Dashboard</Link></li>
              <li className="nav-item"><Link to="/admin/users" className="nav-link fw-semibold">Users</Link></li>
              <li className="nav-item"><Link to="/admin/bookings" className="nav-link fw-semibold">Bookings</Link></li>
              <li className="nav-item"><Link to="/admin/vehicles" className="nav-link fw-bold text-danger">Vehicles</Link></li>
              <li className="nav-item"><button className="btn btn-danger px-3" onClick={logout}>Logout</button></li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container my-5">
        <h2 className="fw-bold text-center mb-4">Vehicles</h2>

        <form className="row g-2 mb-4" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Search name, brand, model, location"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-danger w-100">Search</button>
          </div>
        </form>

        <p className="text-muted small">{pagination.total} vehicle(s)</p>

        {loading ? (
          <p className="text-center text-muted">Loading...</p>
        ) : vehicles.length === 0 ? (
          <p className="text-center text-muted">No vehicles found.</p>
        ) : (
          <div className="row g-4">
            {vehicles.map((v) => (
              <div key={v._id} className="col-12 col-sm-6 col-md-4 col-lg-3">
                <div
                  className="vehicle-card shadow-sm h-100"
                  onClick={() => setSelectedVehicle(v)}
                  style={{ cursor: "pointer" }}
                >
                  <VehicleImage
                    src={getVehicleImage(v)}
                    alt={v.name || "vehicle"}
                    className="vehicle-img"
                    style={{ height: "170px", width: "100%", objectFit: "cover" }}
                  />

                  <div className="p-3 text-center">
                    <h6 className="fw-bold mb-1">{v.name}</h6>
                    <div className="text-muted text-capitalize">{v.type}</div>
                    <div className="fw-semibold">₹{v.pricePerDay}/day</div>
                    <span className={`badge mt-2 text-capitalize ${statusClass(v.approvalStatus)}`}>
                      {v.approvalStatus}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="d-flex justify-content-center gap-2 mt-4">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={pagination.page <= 1}
              onClick={() => fetchVehicles(pagination.page - 1, filters)}
            >
              Previous
            </button>
            <span className="align-self-center small">Page {pagination.page} of {pagination.pages}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchVehicles(pagination.page + 1, filters)}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {selectedVehicle && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxHeight: "90vh", overflowY: "auto" }}>
            <h4 className="fw-bold mb-3 text-center">{selectedVehicle.name}</h4>

            <div className="d-flex gap-2 overflow-auto mb-3">
              {(selectedVehicle.images?.length
                ? selectedVehicle.images
                : [{ url: selectedVehicle.vehicleImage }]
              ).map((image, index) => (
                <VehicleImage
                  key={`${image.url}-${index}`}
                  src={getImageUrl(image.url)}
                  alt={`${selectedVehicle.name} ${index + 1}`}
                  className="rounded border"
                  style={{ width: "130px", height: "90px", objectFit: "cover" }}
                />
              ))}
            </div>

            <p><strong>Type:</strong> {selectedVehicle.type}</p>
            <p><strong>Brand:</strong> {selectedVehicle.brand}</p>
            <p><strong>Model:</strong> {selectedVehicle.model}</p>
            <p><strong>Location:</strong> {selectedVehicle.location}</p>
            <p><strong>Contact:</strong> {selectedVehicle.contactNumber}</p>
            <p><strong>Price:</strong> ₹{selectedVehicle.pricePerDay}/day</p>
            <p><strong>Owner:</strong> {selectedVehicle.ownerId?.name || "N/A"}</p>
            <p><strong>Owner email:</strong> {selectedVehicle.ownerId?.email || "N/A"}</p>
            <p>
              <strong>Status:</strong>{" "}
              <span className={`badge text-capitalize ${statusClass(selectedVehicle.approvalStatus)}`}>
                {selectedVehicle.approvalStatus}
              </span>
            </p>
            {selectedVehicle.rejectionReason && (
              <p className="text-danger"><strong>Rejection:</strong> {selectedVehicle.rejectionReason}</p>
            )}

            <div className="d-flex gap-2 flex-wrap mb-3">
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
            </div>

            <div className="d-flex justify-content-end gap-2 mt-4">
              {selectedVehicle.approvalStatus !== "approved" && (
                <button className="btn approve-btn" onClick={() => approveVehicle(selectedVehicle._id)}>
                  Approve
                </button>
              )}
              {selectedVehicle.approvalStatus !== "rejected" && (
                <button className="btn btn-warning" onClick={() => rejectVehicle(selectedVehicle)}>
                  Reject
                </button>
              )}
              <button className="btn del-btn" onClick={() => deleteVehicle(selectedVehicle._id)}>
                Delete
              </button>
              <button className="btn btn-secondary" onClick={() => setSelectedVehicle(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
