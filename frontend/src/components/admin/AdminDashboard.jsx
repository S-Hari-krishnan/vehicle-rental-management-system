import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./admindashboard.css";
import API from "../../api";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/admin/stats");
        setStats(res.data);
      } catch (error) {
        console.error(error);
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
      }
    };

    fetchStats();
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/admin/login");
  };

  if (!stats) return <h4 className="text-center mt-5">Loading...</h4>;

  const revenueLabels = (stats.monthlyRevenue || []).map((item) => item._id);
  const revenueValues = (stats.monthlyRevenue || []).map((item) => item.revenue);

  const chartData = {
    labels: revenueLabels.length ? revenueLabels : ["No completed bookings"],
    datasets: [
      {
        label: "Revenue (₹)",
        data: revenueValues.length ? revenueValues : [0],
        backgroundColor: "#dc3545",
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } },
  };

  const cards = [
    ["Users", stats.totalUsers],
    ["Owners", stats.totalOwners],
    ["Vehicles", stats.totalVehicles],
    ["Pending approvals", stats.pendingVehicles],
    ["Bookings", stats.totalBookings],
    ["Active bookings", stats.activeBookings],
    ["Completed revenue", `₹${stats.totalRevenue || 0}`],
  ];

  return (
    <div className="admin-dashboard-page">
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
        <div className="container-fluid px-3 px-lg-5">
          <Link to="/admin/dashboard" className="navbar-brand fw-bold" style={{ color: "red" }}>
            Hari Rentals — Admin
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navAdmin"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse justify-content-end" id="navAdmin">
            <ul className="navbar-nav gap-2 gap-lg-4 align-items-lg-center py-2 py-lg-0">
              <li className="nav-item">
                <Link to="/admin/dashboard" className="nav-link fw-bold text-danger">
                  Dashboard
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/admin/users" className="nav-link fw-semibold">Users</Link>
              </li>
              <li className="nav-item">
                <Link to="/admin/bookings" className="nav-link fw-semibold">Bookings</Link>
              </li>
              <li className="nav-item">
                <Link to="/admin/vehicles" className="nav-link fw-semibold">Vehicles</Link>
              </li>
              <li className="nav-item">
                <button className="btn btn-danger px-3" onClick={logout}>Logout</button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div className="container my-5">
        <h2 className="fw-bold text-center mb-4">Admin Overview</h2>

        <div className="row g-3">
          {cards.map(([label, value]) => (
            <div className="col-6 col-md-4 col-lg-3" key={label}>
              <div className="card shadow-sm p-3 stat-card text-center h-100">
                <h6 className="fw-bold">{label}</h6>
                <p className="display-6 fw-bold text-danger mb-0">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {stats.pendingVehicles > 0 && (
          <div className="alert alert-warning mt-4 d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <span>{stats.pendingVehicles} vehicle(s) awaiting approval.</span>
            <Link to="/admin/vehicles?status=pending" className="btn btn-sm btn-warning">
              Review now
            </Link>
          </div>
        )}

        <div className="row mt-5 g-4">
          <div className="col-lg-7">
            <div className="card shadow-sm p-4">
              <h5 className="fw-bold text-center mb-3">Monthly Revenue</h5>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card shadow-sm p-4">
              <h5 className="fw-bold mb-3">Recent Bookings</h5>
              {(stats.recentBookings || []).length === 0 ? (
                <p className="text-muted mb-0">No bookings yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr><th>User</th><th>Vehicle</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {stats.recentBookings.map((booking) => (
                        <tr key={booking._id}>
                          <td>{booking.userId?.name || "N/A"}</td>
                          <td>{booking.vehicleId?.name || "Removed"}</td>
                          <td className="text-capitalize">{booking.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
