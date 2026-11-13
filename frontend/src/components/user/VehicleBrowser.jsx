import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API, { getVehicleImage } from "../../api";
import UserNavbar from "./UserNavbar";
import UserFooter from "./UserFooter";
import VehicleImage from "../VehicleImage";
import "./uservehicles.css";

const initialFilters = {
  search: "",
  location: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest",
};

export default function VehicleBrowser({ type, title, active }) {
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async (page = 1, currentFilters = filters) => {
    setLoading(true);

    try {
      const params = { type, page, limit: 12 };

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== "") params[key] = value;
      });

      const res = await API.get("/vehicle/all", { params });
      setVehicles(res.data.vehicles || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles(1, initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchVehicles(1, filters);
  };

  const reset = () => {
    setFilters(initialFilters);
    fetchVehicles(1, initialFilters);
  };

  return (
    <div className="vehicle-page page-shell">
      <UserNavbar active={active} />

      <div className="container my-5 page-main">
        <h2 className="fw-bold text-center mb-4">{title}</h2>

        <form className="card shadow-sm p-3 mb-4" onSubmit={handleSubmit}>
          <div className="row g-2 align-items-end">
            <div className="col-12 col-md-5">
              <label className="form-label small mb-1">Search</label>
              <input
                className="form-control"
                name="search"
                placeholder="Name, brand, model..."
                value={filters.search}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-4">
              <label className="form-label small mb-1">Location</label>
              <input
                className="form-control"
                name="location"
                placeholder="City or area"
                value={filters.location}
                onChange={handleChange}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label small mb-1">Min ₹</label>
              <input
                className="form-control"
                type="number"
                min="0"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleChange}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label small mb-1">Max ₹</label>
              <input
                className="form-control"
                type="number"
                min="0"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleChange}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label small mb-1">Sort</label>
              <select className="form-select" name="sort" value={filters.sort} onChange={handleChange}>
                <option value="newest">Newest</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="rating">Top rated</option>
                <option value="name">Name</option>
              </select>
            </div>

            <div className="col-12 col-md-6 d-flex gap-2">
              <button className="btn btn-danger flex-grow-1" type="submit">
                Go
              </button>
              <button className="btn btn-outline-secondary" type="button" onClick={reset}>
                ↺
              </button>
            </div>
          </div>
        </form>

        <p className="text-muted small">{pagination.total} vehicle(s) found</p>

        {loading ? (
          <h4 className="text-center">Loading...</h4>
        ) : vehicles.length === 0 ? (
          <h5 className="text-center">No vehicles match your filters.</h5>
        ) : (
          <div className="row g-4">
            {vehicles.map((vehicle) => (
              <div className="col-md-4 col-lg-3" key={vehicle._id}>
                <div className="card vehicle-card shadow-sm h-100">
                  <VehicleImage
                    src={getVehicleImage(vehicle)}
                    className="card-img-top"
                    alt={vehicle.name}
                  />

                  <div className="card-body text-center d-flex flex-column">
                    <h6 className="fw-bold">{vehicle.name}</h6>
                    <p className="mb-1 small text-muted">
                      {vehicle.brand} • {vehicle.model}
                    </p>
                    <p className="mb-1 small">
                      <i className="bi bi-geo-alt"></i> {vehicle.location}
                    </p>
                    <p className="mb-1 small">
                      <i className="bi bi-star-fill text-warning"></i>{" "}
                      {vehicle.ratingAverage || 0} ({vehicle.ratingCount || 0})
                    </p>
                    <p className="text-danger fw-bold">₹{vehicle.pricePerDay}/day</p>

                    <Link
                      to={`/vehicle/${vehicle._id}`}
                      className="btn btn-sm w-100 view-btn mt-auto"
                    >
                      View Details
                    </Link>
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
            <span className="align-self-center small">
              Page {pagination.page} of {pagination.pages}
            </span>
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

      <UserFooter />
    </div>
  );
}
