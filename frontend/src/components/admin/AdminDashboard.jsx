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
    const token = localStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      const res = await API.get("/admin/stats", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setStats(res.data);
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

  if (!stats) {
    return <h4 className="text-center mt-5">Loading...</h4>;
  }

  const chartData = {
    labels: ["Users", "Owners", "Vehicles", "Bookings"],
    datasets: [
      {
        label: "Platform Statistics",
        data: [
          stats.totalUsers,
          stats.totalOwners,
          stats.totalVehicles,
          stats.totalBookings,
        ],
        backgroundColor: "#dc3545",
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="admin-dashboard-page">
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
            data-bs-target="#navAdmin"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div
            className="collapse navbar-collapse justify-content-end"
            id="navAdmin"
          >
            <ul className="navbar-nav gap-4">
              <li className="nav-item">
                <Link
                  to="/admin/dashboard"
                  className="nav-link fw-bold text-danger"
                >
                  Dashboard
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/admin/users" className="nav-link fw-semibold">
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

      <div className="container my-5">
        <h2 className="fw-bold text-center mb-4">Admin Overview</h2>

        <div className="row g-4">
          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm p-3 stat-card text-center">
              <h6 className="fw-bold">Users</h6>
              <p className="display-6 fw-bold text-danger">
                {stats.totalUsers}
              </p>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm p-3 stat-card text-center">
              <h6 className="fw-bold">Owners</h6>
              <p className="display-6 fw-bold text-danger">
                {stats.totalOwners}
              </p>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm p-3 stat-card text-center">
              <h6 className="fw-bold">Vehicles</h6>
              <p className="display-6 fw-bold text-danger">
                {stats.totalVehicles}
              </p>
            </div>
          </div>

          <div className="col-12 col-sm-6 col-lg-3">
            <div className="card shadow-sm p-3 stat-card text-center">
              <h6 className="fw-bold">Bookings</h6>
              <p className="display-6 fw-bold text-danger">
                {stats.totalBookings}
              </p>
            </div>
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-lg-8 mx-auto">
            <div className="card shadow-sm p-4">
              <h5 className="fw-bold text-center mb-3">
                System Overview Chart
              </h5>

              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}