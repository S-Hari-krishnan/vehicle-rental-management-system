import "./App.css"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RedirectRoot from "./components/RedirectRoot";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./components/login/Login"
import Signup from "./components/login/SignUp"
import ForgotPassword from "./components/login/ForgotPassword";
import ResetPassword from "./components/login/ResetPassword";

import Home from "./components/Home";

import OwnerDashboard from "./components/owner/OwnerDashboard";
import AddVehicle from "./components/owner/AddVehicle";
import MyVehicles from "./components/owner/MyVehicles";
import EditVehicle from "./components/owner/EditVehicle";
import OwnerBookings from "./components/owner/OwnerBookings";

import UserHome from "./components/user/UserHome";
import UserVehicleDetails from "./components/user/UserVehicleDetails";
import UserCars from "./components/user/UserCars";
import UserBikes from "./components/user/UserBikes";
import UserBookings from "./components/user/UserBookings";

import AdminLogin from "./components/admin/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminUsers from "./components/admin/AdminUsers";
import AdminBookings from "./components/admin/AdminBookings";
import AdminVehicles from "./components/admin/AdminVehicles";

const protect = (element, role) => (
  <ProtectedRoute role={role}>{element}</ProtectedRoute>
);

const protectAdmin = (element) => (
  <ProtectedRoute admin>{element}</ProtectedRoute>
);

export default function App(){
  return(
    <Router>
      <Routes>
        <Route path="/" element={<RedirectRoot />} />

        <Route path="/home" element={<Home/>}/>

        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/Signup" element={<Signup/>}/>
        <Route path="/forgot-password" element={<ForgotPassword/>}/>
        <Route path="/reset-password/:token" element={<ResetPassword/>}/>


        <Route path="/user/home" element={protect(<UserHome/>, "user")}/>
        <Route path="/vehicles/cars" element={protect(<UserCars />, "user")} />
        <Route path="/vehicles/bikes" element={protect(<UserBikes />, "user")} />
        <Route path="/vehicle/:id" element={protect(<UserVehicleDetails />)} />
        <Route path="/bookings/user" element={protect(<UserBookings />, "user")} />

        <Route path="/owner/dashboard" element={protect(<OwnerDashboard/>, "owner")}/>
        <Route path="/owner/add-vehicle" element={protect(<AddVehicle/>, "owner")}/>
        <Route path="/owner/my-vehicles" element={protect(<MyVehicles />, "owner")} />
        <Route path="/owner/edit-vehicle/:id" element={protect(<EditVehicle />, "owner")} />
        <Route path="/owner/bookings" element={protect(<OwnerBookings />, "owner")} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={protectAdmin(<AdminDashboard />)} />
        <Route path="/admin/users" element={protectAdmin(<AdminUsers />)} />
        <Route path="/admin/bookings" element={protectAdmin(<AdminBookings />)} />
        <Route path="/admin/vehicles" element={protectAdmin(<AdminVehicles />)} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  )
}
