// import { Link, useNavigate } from "react-router-dom";

// export default function UserNavbar() {
//   const navigate = useNavigate();
//   const isLoggedIn = localStorage.getItem("token");

//   const handleLogout = () => {
//     if (window.confirm("Are you sure you want to logout?")) {
//       localStorage.clear();
//       navigate("/login");
//     }
//   };

//   return (
//     <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
//       <div className="container-fluid mx-5">
//         <Link className="navbar-brand fw-bold" style={{ color: "red" }}>
//           Vishnu Rentals
//         </Link>

//         <button
//           className="navbar-toggler"
//           type="button"
//           data-bs-toggle="collapse"
//           data-bs-target="#navContent"
//         >
//           <span className="navbar-toggler-icon"></span>
//         </button>

//         <div className="collapse navbar-collapse justify-content-end" id="navContent">
//           <ul className="navbar-nav gap-5">
//             <li className="nav-item">
//               <Link to="/user/home" className="nav-link">Home</Link>
//             </li>

//             <li className="nav-item">
//               <Link to="/vehicles/cars" className="nav-link">Cars</Link>
//             </li>

//             <li className="nav-item">
//               <Link to="/vehicles/bikes" className="nav-link">Bikes</Link>
//             </li>
//             <li className="nav-item">
//               <Link to="/bookings/user" className="nav-link">My Bookings</Link>
//             </li>

//             <li className="nav-item">
//               <button className="btn btn-danger px-3" onClick={handleLogout}>
//                 Logout
//               </button>
//             </li>
//           </ul>
//         </div>
//       </div>
//     </nav>
//   );
// }
