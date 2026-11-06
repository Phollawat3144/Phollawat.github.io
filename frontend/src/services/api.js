// จุดประสงค์: กำหนดไคลเอนต์ HTTP กลางและการตั้งค่าคำขอไปยัง API
import axios from "axios";

// ตั้งค่าไคลเอนต์คำขอและค่าเริ่มต้นที่ใช้ร่วมกัน
const api = axios.create({
  baseURL: "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;