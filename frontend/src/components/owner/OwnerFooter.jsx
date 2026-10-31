import { Link } from "react-router-dom";

export default function OwnerFooter() {
  return (
    <footer className="footer py-4 text-white">
      <div className="container">
        <div className="row text-center text-md-start">
          <div className="col-md-4 mb-3">
            <h5 className="fw-bold">Vishnu Rentals</h5>
            <p className="small">
              Manage your fleet and grow your rental business effortlessly.
            </p>
          </div>

          <div className="col-md-4 mb-3">
            <h6 className="fw-semibold">Owner Panel</h6>
            <ul className="list-unstyled">
              <li><Link to="/owner/dashboard" className="footer-link">Dashboard</Link></li>
              <li><Link to="/owner/my-vehicles" className="footer-link">My Vehicles</Link></li>
              <li><Link to="/owner/add-vehicle" className="footer-link">Add Vehicle</Link></li>
              <li><Link to="/owner/bookings" className="footer-link">Bookings</Link></li>
            </ul>
          </div>

          <div className="col-md-4 mb-3">
            <h6 className="fw-semibold">Support</h6>
            <p className="small"><i className="bi bi-envelope-fill me-2"></i>owner@vishnurentals.com</p>
            <p className="small"><i className="bi bi-telephone-fill me-2"></i>+91 98765 00000</p>
          </div>
        </div>

        <div className="text-center mt-3 border-top pt-3 small">
          © {new Date().getFullYear()} Vishnu Rentals — Owner Panel
        </div>
      </div>
    </footer>
  );
}
