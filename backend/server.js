require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

// Database Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/career-genome';

global.HAS_DB = false;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("MongoDB Connected");
        global.HAS_DB = true;
    })
    .catch(err => {
        console.error("MongoDB Connection Error:", err.message);
        console.log("⚠️ Running in DEMO MODE (In-Memory Auth) due to DB connection failure.");
        global.HAS_DB = false;
    });

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/projects", require("./routes/projectGenerator"));
app.use("/api/skill-gap", require("./routes/skillGapClosure"));
const PORT = process.env.PORT || 8000;

app.get("/", (req, res) => {
    res.send("CareerGenome Backend is Running 🚀");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
