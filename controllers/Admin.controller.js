const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const { Users, Event } = require("../models");
const bcrypt = require("bcryptjs");
const { generateToken, isAuth } = require("../utils.js");
const { google } = require("googleapis");

dotenv.config();

const adminRouter = express.Router();

const blogger = google.blogger({
  version: "v3",
  auth: "AIzaSyC9Y_pJPkIiHC8q5b5HIFYSMm1qt-C8CeQ",
});

const oauth2Client = new google.auth.OAuth2(
  "162519831332-32p47ro0kkv76jjfm11ab5161ls43gsl.apps.googleusercontent.com",
  "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",
  "http://localhost:5000"
);

google.options({
  version: "v3",
  http2: true,
  auth: oauth2Client,
});

adminRouter.post(
  "/register",
  expressAsyncHandler(async (req, res) => {
    console.log(req.body);
    const { email } = req.body;

    try {
      // Check if the email is in use
      const existingUser = await Users.findOne({
        where: { email: email },
      }).then(async (user) => {
        if (user) {
          return res.status(409).send({
            message: "Email is already in use.",
          });
        } else {
          const user = await Users.create({
            username: req.body.username,
            email: email,
            phone: req.body.phone,
            password: bcrypt.hashSync(req.body.password, 8),
          });
          res.status(200).send({
            message: "User Created Successfully.",
          });
        }
      });
    } catch (err) {
      return res.status(500).send(err);
    }
  })
);

adminRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    const { email } = req.body;
    // Check we have an email

    try {
      // Step 1 - Verify a user with the email exists
      const user = await Users.findOne({
        where: { email: email },
      }).then(async (user) => {
        console.log("user", user);
        if (!user) {
          return res.status(404).send({
            message: "User does not exists",
          });
        }
        if (user) {
          if (bcrypt.compareSync(req.body.password, user.password)) {
            res.status(201).send({
              message: "User Logged in Successfully",
              user: {
                id: user.id,
                username: user.username,
                email: user.email,
                phone: user.phone,
                token: generateToken(user.dataValues),
              },
            });
          } else {
            return res.status(404).send({
              message: "Incorrect Email or Password",
            });
          }
        }
      });
      // Step 2 - Ensure the account has been verified
    } catch (err) {
      return res.status(500).send(err);
    }
  })
);

adminRouter.post(
  "/createEvent",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    try {
      // const event = await Event.create({
      //   title: req.body.title,
      //   description: req.body.description,
      //   eventDate: req.body.date,
      //   eventStartTime: req.body.startTime,
      //   eventEndTime: req.body.endTime,
      //   venue: req.body.venue,
      //   registrationDeadline: req.body.deadline,
      // });
      // res.status(200).send({
      //   message: "Event Created Successfully.",
      // });
    } catch (err) {
      console.log("error", err);
      return res.status(500).send(err);
    }
  })
);

module.exports = adminRouter;
