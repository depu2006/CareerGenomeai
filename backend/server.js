require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

/* =========================
   CORS CONFIGURATION
   ========================= */
app.use(cors({
    origin: "http://localhost:5176",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

/* =========================
   DATABASE CONNECTION
   ========================= */
const MONGO_URI =
    process.env.MONGO_URI || "mongodb://localhost:27017/career-genome";

global.HAS_DB = false;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
        global.HAS_DB = true;
    })
    .catch(err => {
        console.error("MongoDB Connection Error:", err.message);
        console.log(
            "⚠️ Running in DEMO MODE (In-Memory Auth) due to DB connection failure."
        );
        global.HAS_DB = false;
    });

/* =========================
   ROUTES
   ========================= */
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projectGenerator"));
app.use("/api/skill-gap", require("./routes/skillGapClosure"));

/* =========================
   SERVER START
   ========================= */
const PORT = 8000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
