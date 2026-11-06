// จุดประสงค์: เริ่มต้น React และเชื่อมแอปเข้ากับ DOM พร้อมตัวครอบระดับแอป
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "leaflet/dist/leaflet.css";

import "./assets/css/variables.css";
import "./assets/css/style.css";
import "./assets/css/global.css";

import App from "./App";

// สร้าง React root และ render แอปภายใต้ BrowserRouter
ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);