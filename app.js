const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const db = require("./models");
const job = require("./cron-job");

const adminController = require("./controllers/Admin.controller");

const app = express();
const port = process.env.PORT || 5000;
dotenv.config();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// const jwtClient = new google.auth.JWT(
//   GOOGLE_CLIENT_EMAIL,
//   null,
//   GOOGLE_PRIVATE_KEY,
//   SCOPES
// );

app.use("/api/admin", adminController);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

db.sequelize.sync().then((req) => {
  app.listen(port, () => {
    console.log(`Serve at http://localhost:${port}`);
  });
});
