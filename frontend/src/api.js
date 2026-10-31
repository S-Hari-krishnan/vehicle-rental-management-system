import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const isAdminRequest =
    config.url?.startsWith("/admin") || config.url?.startsWith("admin");

  const token = isAdminRequest
    ? localStorage.getItem("adminToken")
    : localStorage.getItem("token");

  if (token && !config.headers?.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const isAdminRequest = url.startsWith("/admin") || url.startsWith("admin");

    if (status === 401) {
      if (isAdminRequest) {
        localStorage.removeItem("adminToken");
      } else {
        localStorage.removeItem("token");
      }
    }

    return Promise.reject(error);
  }
);

export const getImageUrl = (value) => {
  if (!value) return "";
  if (typeof value === "object") return getImageUrl(value.url || value.vehicleImage);
  if (value.startsWith("http") || value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/uploads/${value}`;
};

export const getVehicleImage = (vehicle) =>
  getImageUrl(vehicle?.images?.[0]?.url || vehicle?.vehicleImage);

export { API_BASE_URL };
export default API;
