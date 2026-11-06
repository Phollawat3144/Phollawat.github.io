// =====================================================
// MySQL connection pool
// ใช้ร่วมกันทุก controller เพื่อป้องกันการเปิด connection
// ซ้ำและจัดการ query ไปยังฐานข้อมูล photoclub_db
// =====================================================




const mysql = require("mysql2/promise");

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "photoclub_db"
});

module.exports = pool;