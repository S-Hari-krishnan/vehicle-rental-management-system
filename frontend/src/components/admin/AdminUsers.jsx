import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./adminusers.css";
import API from "../../api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await API.get("/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(res.data?.users || []);
    } catch (error) {
      console.log(error);
      localStorage.removeItem("adminToken");
      navigate("/admin/login");
    }
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user and all their bookings & vehicles?")) {
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");

      await API.delete(`/admin/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers((prev) => prev.filter((u) => u._id !== id));
      alert("User deleted");
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to delete");
    }
  };

  return (
    <div className="admin-users-page">
      {/* NAVBAR */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid mx-5">
          <Link
            to="/admin/dashboard"
            className="navbar-brand fw-bold"
            style={{ color: "red" }}
          >
            Vishnu Rentals — Admin
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#adminNav"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="collapse navbar-collapse justify-content-end"
            id="adminNav"
          >
            <ul className="navbar-nav gap-4">
              <li className="nav-item">
                <Link to="/admin/dashboard" className="nav-link fw-semibold">
                  Dashboard
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/admin/users" className="nav-link fw-bold text-danger">
                  Users
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/admin/bookings" className="nav-link fw-semibold">
                  Bookings
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/admin/vehicles" className="nav-link fw-semibold">
                  Vehicles
                </Link>
              </li>

              <li className="nav-item">
                <button className="btn btn-danger px-3" onClick={logout}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* BODY CONTENT */}
      <div className="container my-5">
        <h2 className="fw-bold text-center mb-4">All Users</h2>

        {users.length === 0 ? (
          <h5 className="text-center text-muted">No users found.</h5>
        ) : (
          <div className="row g-4">
            {users.map((u) => (
              <div key={u._id} className="col-12 col-sm-6 col-lg-3">
                <div className="user-card shadow-sm p-3">
                  <div className="text-center">
                    <i className="bi bi-person-circle fs-1 text-danger"></i>
                  </div>

                  <div className="text-center mt-2">
                    <h6 className="fw-bold mb-1">{u.name}</h6>
                    <small className="text-muted">{u.email}</small>

                    <div>
                      <span className="badge bg-secondary mt-2">{u.role}</span>
                    </div>
                  </div>

                  <div className="text-center mt-3">
                    <button
                      className="btn btn-danger btn-sm px-3"
                      onClick={() => deleteUser(u._id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}