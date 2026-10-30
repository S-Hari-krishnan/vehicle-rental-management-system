import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const getImageUrl = (filename) => {
  if (!filename) return "";
  return `${import.meta.env.VITE_API_URL}/uploads/${filename}`;
};

export default API;