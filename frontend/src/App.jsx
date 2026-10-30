import "./App.css"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import RedirectRoot from "./components/RedirectRoot";

import Login from "./components/login/Login"
import Signup from "./components/login/SignUp"

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


export default function App(){
  return(
    <Router>
      <Routes>
        <Route path="/" element={<RedirectRoot />} />

        <Route path="/home" element={<Home/>}/>

        <Route path="/user/home" element={<UserHome/>}/>

        <Route path="/login" element={<Login/>}/>
        <Route path="/Signup" element={<Signup/>}/>

        <Route path="/owner/dashboard" element={<OwnerDashboard/>}/>
        <Route path="/owner/add-vehicle" element={<AddVehicle/>}/>
        <Route path="/owner/my-vehicles" element={<MyVehicles />} />
        <Route path="/owner/edit-vehicle/:id" element={<EditVehicle />} />
        <Route path="/owner/bookings" element={<OwnerBookings />} />

        
        <Route path="/vehicle/:id" element={<UserVehicleDetails />} />
        <Route path="/vehicles/cars" element={<UserCars />} />
        <Route path="/vehicles/bikes" element={<UserBikes />} />
        <Route path="/bookings/user" element={<UserBookings />} />

        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/vehicles" element={<AdminVehicles />} />
        
      </Routes>
      <ToastContainer position="top-center" autoClose={3000} />
    </Router>
  )
}