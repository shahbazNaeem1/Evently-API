const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./models");
const job = require("./cron-job");
const cookie = require("cookie-parser");

const adminController = require("./controllers/Admin.controller");

const app = express();
const corsOption = {
  origin: "http://localhost:3000",
  credentials: true,
};
const port = process.env.PORT || 5000;
dotenv.config();
app.use(cookie());
app.use(express.json());
app.use(cors(corsOption));
app.use(express.urlencoded({ extended: true }));

app.use("/api/admin", adminController);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

db.sequelize.sync().then((req) => {
  app.listen(port, () => {
    console.log(`Serve at http://localhost:${port}`);
  });
});
