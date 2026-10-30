export default function OwnerFooter() {
  return (
    <footer className="footer mt-5 py-4 text-white">
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
              <li><a href="/owner/dashboard" className="footer-link">Dashboard</a></li>
              <li><a href="/owner/my-vehicles" className="footer-link">My Vehicles</a></li>
              <li><a href="/owner/add-vehicle" className="footer-link">Add Vehicle</a></li>
              <li><a href="/owner/bookings" className="footer-link">Bookings</a></li>
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
