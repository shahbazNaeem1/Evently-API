const express = require("express");
const expressAsyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
const { Users, Event, Invitee } = require("../models");
const { generateToken, isAuth } = require("../utils.js");
const { google } = require("googleapis");
const QRCode = require("qrcode");
const moment = require("moment");
const Sequelize = require("sequelize");
const { default: axios } = require("axios");
const Op = Sequelize.Op;

dotenv.config();

const adminRouter = express.Router();

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_KEY,
  process.env.CLIENT_SECRET,
  "http://localhost:3000"
);

const expoOauth2Client = new google.auth.OAuth2(
  process.env.EXPO_CLIENT_KEY,
  process.env.EXPO_CLIENT_SECRET,
  "https://auth.expo.io/@hassaan123/qr-scanner"
);

adminRouter.get("/google", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("url", url);
  res.redirect(url);
});

adminRouter.post("/auth/token", async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.body.response.code);
    console.log("tokens", tokens);
    oauth2Client.setCredentials(tokens);
    return axios
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      })
      .then(async (response) => {
        console.log(response.data);
        try {
          const existingUser = await Users.findOne({
            where: { email: response.data.email },
          }).then(async (user) => {
            if (user) {
              console.log(tokens.refresh_token);
              res.cookie("refreshToken", tokens.refresh_token, {
                path: "/",
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 30 * 1000,
                sameSite: "lax",
                overwrite: true,
                domain: "localhost",
              });
              console.log("req.cookies", req.cookies);

              return res.status(201).send({
                message: "User Logged in Successfully",
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  phone: user && user.phone ? user.phone : "",
                  token: generateToken(user.dataValues),
                  tokens: tokens.access_token,
                },
              });
            } else {
              const user = await Users.create({
                username: response.data.givenName,
                email: response.data.email,
                phone: "",
              });
              res.cookie("refreshToken", tokens.refresh_token, {
                path: "/",
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 30 * 1000,
                sameSite: "lax",
                overwrite: true,
                domain: "localhost",
              });
              return res.status(201).send({
                message: "User Logged in Successfully",
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  phone: user && user.phone ? user.phone : "",
                  token: generateToken(user.dataValues),
                  tokens: tokens.access_token,
                },
              });
            }
          });
        } catch (err) {
          console.log(err);
          return res.status(500).send(err);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (e) {
    console.log("EEE", e);
  }
});

adminRouter.post("/auth/token/expo", async (req, res) => {
  console.log(req.body);
  try {
    const { tokens } = await expoOauth2Client.getToken(req.body.response);
    console.log("tokens", tokens);
    expoOauth2Client.setCredentials(tokens);
    return axios
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      })
      .then(async (response) => {
        console.log(response.data);
        try {
          const existingUser = await Users.findOne({
            where: { email: response.data.email },
          }).then(async (user) => {
            if (user) {
              console.log(tokens.refresh_token);
              res.cookie("refreshToken", tokens.refresh_token, {
                path: "/",
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 30 * 1000,
                sameSite: "lax",
                overwrite: true,
                domain: "localhost",
              });
              console.log("req.cookies", req.cookies);
              return res.status(201).send({
                message: "User Logged in Successfully",
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  phone: user && user.phone ? user.phone : "",
                  token: generateToken(user.dataValues),
                  tokens: tokens.access_token,
                },
              });
            } else {
              const user = await Users.create({
                username: response.data.givenName,
                email: response.data.email,
                phone: "",
              });
              res.cookie("refreshToken", tokens.refresh_token, {
                path: "/",
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 30 * 1000,
                sameSite: "lax",
                overwrite: true,
                domain: "localhost",
              });
              return res.status(201).send({
                message: "User Logged in Successfully",
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  phone: user && user.phone ? user.phone : "",
                  token: generateToken(user.dataValues),
                  tokens: tokens.access_token,
                },
              });
            }
          });
        } catch (err) {
          console.log(err);
          return res.status(500).send(err);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (e) {
    console.log("EEE", e);
  }
});

adminRouter.get("/auth/success", async (req, res) => {
  console.log("SUCCESS");
  res.send("success");
});

const calendar = google.calendar({
  version: "v3",
  auth: process.env.API_KEY,
  scope: SCOPES,
});

adminRouter.post(
  "/signin",
  expressAsyncHandler(async (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    const { givenName, email } = req.body.response.profileObj;
    console.log("req.body.response.profileObj", req.body.response);

    const token = {
      access_token: req.body.response.accessToken,
      refresh_token: req.cookies.refreshToken,
      scope:
        "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar",
      token_type: "Bearer",
      expiry_date: 1676372211144,
    };
    //     access_token: 'ya29.a0AVvZVsq1HDI0xIH5CFo90f7x6FHbHUbnE1ROGaT9jWG-uPIwG65z91IMRoUMM23uWSYPoI4h60RFfBvV8e0qnKeQ2j-YiC2dFhBjHXSeQYn2NP5RBFskUBRN93_5RlnQZMm-uEBZFJRyiu9WV_YrgYPWafslaCgYKAQsSARESFQGbdwaIAlpg5vRWaIT9JhrMutiEWA0163',
    // refresh_token: '1//03Xs6oK9oKED1CgYIARAAGAMSNwF-L9IrZsskhqSVwwBDnzVRv1KM0GcYqA16Z4JVihX1bJeoq3AImSsL_LIAQbGO-gB78FntlCg',
    // scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar',
    // token_type: 'Bearer',
    // expiry_date: 1676372211144
    console.log("token", token);
    oauth2Client.setCredentials(token);
    try {
      const existingUser = await Users.findOne({
        where: { email: email },
      }).then(async (user) => {
        if (user) {
          return res.status(201).send({
            message: "User Logged in Successfully",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              phone: user && user.phone ? user.phone : "",
              token: generateToken(user.dataValues),
            },
          });
        } else {
          const user = await Users.create({
            username: givenName,
            email: email,
            phone: "",
          });

          return res.status(201).send({
            message: "User Logged in Successfully",
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              phone: user && user.phone ? user.phone : "",
              token: generateToken(user.dataValues),
            },
          });
        }
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send(err);
    }
  })
);

adminRouter.post(
  "/createEvent",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    console.log("createEvent", req.body);
    try {
      oauth2Client.setCredentials({
        refresh_token: req.cookies.refreshToken,
      });
      oauth2Client.refreshAccessToken(function (err, tokens) {
        oauth2Client.setCredentials(tokens);
      });
      const startTime = moment(
        moment(`${req.body.date} ${req.body.startTime}`)
          .tz("Asia/Karachi")
          .format()
      ).format();
      const endTime = moment(
        moment(`${req.body.date} ${req.body.endTime}`)
          .tz("Asia/Karachi")
          .format()
      ).format();
      let event = {
        summary: req.body.title,
        location: req.body.venue,
        description: req.body.description,
        start: {
          dateTime: startTime,
          timeZone: "Asia/Karachi",
        },
        end: {
          dateTime: endTime,
          timeZone: "Asia/Karachi",
        },
        creator: {
          email: process.env.email,
        },
        organizer: {
          email: process.env.email,
        },
        attendees: req.body.attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 10 },
          ],
        },
      };
      calendar.events.insert(
        {
          auth: oauth2Client,
          calendarId: "primary",
          resource: event,
        },
        async function (err, event) {
          if (err) {
            console.log(
              "There was an error contacting the Calendar service: " + err
            );
            return res.status(500).send(err);
          }
          console.log("Event created: %s", JSON.stringify(event.data));
          const e = await Event.create({
            title: req.body.title,
            eventId: event.data.id,
            description: req.body.description,
            eventDate: req.body.date,
            eventStartTime: req.body.startTime,
            eventEndTime: req.body.endTime,
            venue: req.body.venue,
            registrationDeadline: req.body.registrationDeadline,
          });
          event?.data?.attendees?.map(async (attendee) => {
            await Invitee.create({
              email: attendee.email,
              eventId: e.dataValues.id,
            });
          });
          res.status(200).send({
            message: "Event Created Successfully.",
            event: e,
          });
        }
      );
    } catch (err) {
      console.log("error", err);
      return res.status(500).send(err);
    }
  })
);

adminRouter.post(
  "/updateEvent/:id",
  isAuth,
  expressAsyncHandler(async (req, res) => {
    console.log("updateEvent", req.body);
    try {
      oauth2Client.setCredentials({
        refresh_token: req.cookies.refreshToken,
      });
      oauth2Client.refreshAccessToken(function (err, tokens) {
        oauth2Client.setCredentials(tokens);
      });
      const startTime = moment(
        moment(`${req.body.date} ${req.body.startTime}`)
          .tz("Asia/Karachi")
          .format()
      ).format();
      const endTime = moment(
        moment(`${req.body.date} ${req.body.endTime}`)
          .tz("Asia/Karachi")
          .format()
      ).format();
      let event = {
        summary: req.body.title,
        location: req.body.venue,
        description: req.body.description,
        start: {
          dateTime: startTime,
          timeZone: "Asia/Karachi",
        },
        end: {
          dateTime: endTime,
          timeZone: "Asia/Karachi",
        },
        creator: {
          email: process.env.email,
        },
        organizer: {
          email: process.env.email,
        },
        attendees: req.body.attendees,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 10 },
          ],
        },
      };

      const invite = await Invitee.findAll({
        where: { eventId: req.params.id },
      });

      const response = await calendar.events.patch(
        {
          auth: oauth2Client,
          calendarId: "primary",
          eventId: req.body.eventId,
          resource: event,
        },
        async function (err, event) {
          if (err) {
            console.log(
              "There was an error contacting the Calendar service: " + err
            );
            return res.status(500).send(err);
          }
          console.log("Event created: %s", JSON.stringify(event.data));

          await Event.findOne({ where: { id: req.params.id } }).then(
            async (e) => {
              e.title = req.body.title;
              e.eventId = event.data.id;
              e.description = req.body.description;
              e.eventDate = req.body.date;
              e.eventStartTime = req.body.startTime;
              e.eventEndTime = req.body.endTime;
              e.venue = req.body.venue;
              e.registrationDeadline = req.body.registrationDeadline;
              await e.save();
            }
          );

          req.body?.attendees?.map(async (attendee) => {
            const exists = invite.find(
              (email) => email.dataValues.email === attendee.email
            );
            if (!exists) {
              await Invitee.create({
                email: attendee.email,
                eventId: req.params.id,
              });
            }
          });
          res.status(200).send({
            message: "Event Updated Successfully.",
          });
        }
      );
    } catch (err) {
      console.log("error", err);
      return res.status(500).send(err);
    }
  })
);

adminRouter.get("/events", async (req, res) => {
  const events = await Event.findAll({});
  res.send(events);

  // calendar.events.list(
  //   {
  //     auth: oauth2Client,
  //     calendarId: "primary",
  //     // timeMin: new Date().toISOString(),
  //     // maxResults: 10,
  //     singleEvents: true,
  //     orderBy: "startTime",
  //   },
  //   (error, result) => {
  //     if (error) {
  //       res.send(JSON.stringify({ error: error }));
  //     } else {
  //       if (result.data.items.length) {
  //         res.send(JSON.stringify({ events: result.data.items }));
  //       } else {
  //         res.send(JSON.stringify({ message: "No upcoming events found." }));
  //       }
  //     }
  //   }
  // );
});

adminRouter.get("/eventshappeningnow", async (req, res) => {
  const todayDate = moment().format("YYYY-MM-DD");
  const todayTime = moment().format("HH:mm:ss");
  console.log("todayDate", todayDate);
  console.log("todayTime", todayTime);
  const events = await Event.findAll({
    where: {
      eventDate: {
        $eq: todayDate,
      },
      eventStartTime: {
        [Op.lt]: todayTime,
      },
      eventEndTime: {
        [Op.gt]: todayTime,
      },
    },
  });
  console.log("Happening events", events);
  res.send(events);
});

adminRouter.post("/delete/:id", isAuth, async (req, res) => {
  oauth2Client.setCredentials({
    refresh_token: req.cookies.refreshToken,
  });
  oauth2Client.refreshAccessToken(function (err, tokens) {
    oauth2Client.setCredentials(tokens);
  });
  calendar.events.delete(
    { auth: oauth2Client, calendarId: "primary", eventId: req.body.eventId },
    function (err) {
      if (err) {
        console.log(
          "There was an error contacting the Calendar service: " + err
        );
        return res.status(500).send(err);
      }
      Event.destroy({
        where: {
          id: req.params.id,
        },
      }).then(
        async function (rowDeleted) {
          const events = await Event.findAll({});
          res.status(201).send({
            message: "Event Deleted Successfully",
            events: events,
          });
        },
        function (err) {
          console.log(err);
          return res.status(500).send(err);
        }
      );
    }
  );
});

adminRouter.get("/event/:id", isAuth, async (req, res) => {
  let event = await Event.findOne({ where: { id: req.params.id } });
  oauth2Client.setCredentials({
    refresh_token: req.cookies.refreshToken,
  });
  oauth2Client.refreshAccessToken(function (err, tokens) {
    oauth2Client.setCredentials(tokens);
  });

  const response = await calendar.events.get({
    auth: oauth2Client,
    calendarId: "primary",
    eventId: event.eventId,
  });

  event = { ...event?.dataValues, attendee: response.data.attendees };

  res.send(event);
});

adminRouter.post(
  "/scanqr",
  expressAsyncHandler(async (req, res) => {
    const { email, eventId, id } = req.body;

    let img = await QRCode.toDataURL(`${email} ${eventId}`);
    if (id === eventId) {
      const event = await Invitee.findOne({
        where: { eventId: eventId, email: email, qrCode: img },
      });
      if (event) {
        if (event.dataValues.scanned) {
          console.log("IFF");
          return res.status(401).json({ error: "Qrcode Already Scanned" });
        } else {
          await Invitee.findOne({
            where: { email: email, eventId: eventId },
          }).then(async (e) => {
            e.scanned = true;
            await e.save();
          });
          return res
            .status(200)
            .json({ message: "Qrcode Scanned Successfully" });
        }
      } else {
        return res
          .status(404)
          .json({ message: "You are not Invited for this event" });
      }
    } else {
      return res
        .status(404)
        .json({ message: "You are not Invited for this event" });
    }
  })
);

adminRouter.get("/logout", function (req, res) {
  res.clearCookie("refreshToken");
  res.status(201).send({ message: "Logout successfully" });
});

module.exports = adminRouter;
