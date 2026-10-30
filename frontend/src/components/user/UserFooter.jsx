import { Link } from "react-router-dom";

export default function UserFooter() {
  return (
    <footer className="footer mt-5 py-4 text-white">
      <div className="container">

        <div className="row text-center text-md-start">
          <div className="col-md-4 mb-3">
            <h5 className="fw-bold">Vishnu Rentals</h5>
            <p className="small">Premium rentals at affordable rates.</p>
          </div>

          <div className="col-md-4 mb-3">
            <h6 className="fw-semibold">Explore</h6>
            <ul className="list-unstyled">
              <li><Link to="/user/home" className="footer-link">Home</Link></li>
              <li><Link to="/vehicles/cars" className="footer-link">Cars</Link></li>
              <li><Link to="/vehicles/bikes" className="footer-link">Bikes</Link></li>
            </ul>
          </div>

          <div className="col-md-4 mb-3">
            <h6 className="fw-semibold">Support</h6>
            <p className="small"><i className="bi bi-envelope-fill me-2"></i> help@vishnurentals.com</p>
            <p className="small"><i className="bi bi-telephone-fill me-2"></i> +91 98765 43210</p>
          </div>
        </div>

        <div className="text-center mt-3 border-top pt-3 small">
          © {new Date().getFullYear()} Vishnu Rentals. All Rights Reserved.
        </div>
      </div>
    </footer>
  );
}
