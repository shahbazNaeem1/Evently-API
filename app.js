const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

const db = require("./models");
const { google } = require("googleapis");

const adminController = require("./controllers/Admin.controller");

const app = express();
const port = process.env.PORT || 5000;
dotenv.config();

app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/admin.directory.resource.calendar",
];
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;
const GOOGLE_CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const GOOGLE_PROJECT_NUMBER = process.env.GOOGLE_PROJECT_NUMBER;
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

const jwtClient = new google.auth.JWT(
  GOOGLE_CLIENT_EMAIL,
  null,
  GOOGLE_PRIVATE_KEY,
  SCOPES
);

const calendar = google.calendar({
  version: "v3",
  project: GOOGLE_PROJECT_NUMBER,
  auth: jwtClient,
});

var event = {
  summary: "My first event!",
  location: "Hyderabad,India",
  description: "First event with nodeJS!",
  start: {
    dateTime: "2023-02-07T09:00:00-07:00",
    timeZone: "Asia/Dhaka",
  },
  end: {
    dateTime: "2023-02-10T17:00:00-07:00",
    timeZone: "Asia/Dhaka",
  },
  creator: {
    email: process.env.email,
  },
  organizer: {
    email: process.env.email,
  },
  attendees: [],
  reminders: {
    useDefault: false,
    overrides: [
      { method: "email", minutes: 24 * 60 },
      { method: "popup", minutes: 10 },
    ],
  },
};

app.get("/", (req, res) => {
  // calendar.events.list(
  //   {
  //     calendarId: GOOGLE_CALENDAR_ID,
  //     timeMin: new Date().toISOString(),
  //     maxResults: 10,
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
  calendar.events.insert(
    {
      auth: jwtClient,
      calendarId: GOOGLE_CALENDAR_ID,
      resource: event,
    },
    function (err, event) {
      if (err) {
        console.log(
          "There was an error contacting the Calendar service: " + err
        );
        return;
      }
      console.log("Event created: %s", event.data);
      res.jsonp("Event successfully created!");
    }
  );
});

app.use("/api/admin", adminController);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

db.sequelize.sync().then((req) => {
  app.listen(port, () => {
    console.log(`Serve at http://localhost:${port}`);
  });
});
