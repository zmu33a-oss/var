const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcrypt");
require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// إعداد الاتصال بقاعدة البيانات
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// تجربة الاتصال
pool.connect((err, client, release) => {
  if (err) {
    return console.error("خطأ في الاتصال بالقاعدة:", err.stack);
  }
  console.log("تم الاتصال بقاعدة البيانات بنجاح! ✅");
  release();
});

// مسار تجريبي للتأكد أن السيرفر يعمل
app.get("/", (req, res) => {
  res.send("السيرفر شغال تمام!");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`السيرفر شغال على المنفذ: ${PORT}`);
});
