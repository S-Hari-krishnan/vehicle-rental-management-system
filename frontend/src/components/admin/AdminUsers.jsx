import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./adminusers.css";
import API from "../../api";
import { toast } from "react-toastify";

const initialFilters = { search: "", role: "" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = async (page = 1, currentFilters = filters) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.role) params.role = currentFilters.role;

      const res = await API.get("/admin/users", { params });
      setUsers(res.data?.users || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch {
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(1, initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user and all their bookings, vehicles and reviews?")) return;

    try {
      await API.delete(`/admin/user/${id}`);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      toast.success("User deleted");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const createResetLink = async (user) => {
    try {
      const res = await API.post(`/admin/user/${user._id}/reset-link`);
      await navigator.clipboard?.writeText(res.data.resetUrl).catch(() => {});
      window.prompt(`Password reset link for ${user.email} (copy and send):`, res.data.resetUrl);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create reset link");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1, filters);
  };

  return (
    <div className="admin-users-page">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid mx-5">
          <Link to="/admin/dashboard" className="navbar-brand fw-bold" style={{ color: "red" }}>
            Vishnu Rentals — Admin
          </Link>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="adminNav">
            <ul className="navbar-nav gap-4">
              <li className="nav-item"><Link to="/admin/dashboard" className="nav-link fw-semibold">Dashboard</Link></li>
              <li className="nav-item"><Link to="/admin/users" className="nav-link fw-bold text-danger">Users</Link></li>
              <li className="nav-item"><Link to="/admin/bookings" className="nav-link fw-semibold">Bookings</Link></li>
              <li className="nav-item"><Link to="/admin/vehicles" className="nav-link fw-semibold">Vehicles</Link></li>
              <li className="nav-item"><button className="btn btn-danger px-3" onClick={logout}>Logout</button></li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container my-5">
        <h2 className="fw-bold text-center mb-4">All Users</h2>

        <form className="row g-2 mb-4" onSubmit={handleSubmit}>
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Search name or email"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={filters.role}
              onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="">All roles</option>
              <option value="user">Users</option>
              <option value="owner">Owners</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-danger w-100">Search</button>
          </div>
        </form>

        <p className="text-muted small">{pagination.total} user(s)</p>

        {loading ? (
          <h5 className="text-center text-muted">Loading...</h5>
        ) : users.length === 0 ? (
          <h5 className="text-center text-muted">No users found.</h5>
        ) : (
          <div className="row g-4">
            {users.map((u) => (
              <div key={u._id} className="col-12 col-sm-6 col-lg-3">
                <div className="user-card shadow-sm p-3 h-100">
                  <div className="text-center">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="rounded-circle"
                        style={{ width: "64px", height: "64px", objectFit: "cover" }}
                      />
                    ) : (
                      <i className="bi bi-person-circle fs-1 text-danger"></i>
                    )}
                  </div>

                  <div className="text-center mt-2">
                    <h6 className="fw-bold mb-1">{u.name}</h6>
                    <small className="text-muted d-block">{u.email}</small>
                    <small className="text-muted d-block">{u.phone || "No phone"}</small>
                    <span className="badge bg-secondary mt-2">{u.role}</span>
                  </div>

                  <div className="d-grid gap-2 mt-3">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => createResetLink(u)}
                    >
                      Reset link
                    </button>
                    {u.role !== "admin" && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteUser(u._id)}
                      >
                        Delete
                      </button>
                    )}
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
              onClick={() => fetchUsers(pagination.page - 1, filters)}
            >
              Previous
            </button>
            <span className="align-self-center small">Page {pagination.page} of {pagination.pages}</span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchUsers(pagination.page + 1, filters)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
