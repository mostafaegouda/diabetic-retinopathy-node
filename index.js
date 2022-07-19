const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();
app.use(bodyParser.json());
const port = 3001;
const host = "localhost";
const csv = require("csvtojson");
require('dotenv').config();
const Vonage = require('@vonage/server-sdk')



// function sendSMS(name) {
//   const vonage = new Vonage({
//     apiKey: "897fae8d",
//     apiSecret: "19evLeGC8R91yOBo"
//   })
//   const from = "sa7ti"
//   const to = "201554253515"
//   const text = `Hello ${name}, thanks for using FCDS Diabetic Retinopathy Detection Tool.\nYour data has been recorded and we will contact you soon`
//   vonage.message.sendSms(from, to, text, (err, responseData) => {
//     if (err) {
//       console.log(err);
//     } else {
//       if (responseData.messages[0]['status'] === "0") {
//         console.log("Message sent successfully.");
//       } else {
//         console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
//       }
//     }
//   })
// }

function sendSMS(name, number) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);
  client.messages
    .create({
      body: `Hello ${name}, thanks for using FCDS Diabetic Retinopathy Detection Tool.\nYour data has been recorded and we will contact you soon`,
      from: '+16203128313',
      to: `+201121377753`
    })
    .then(message => console.log(message.sid))
    .catch(err => console.log(err.message));
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async function patientExists(national_id) {
  let patients = await csv().fromFile("patients.csv");
  for (let i = 0; i < patients.length; i++) {
    if (national_id === patients[i].national_id) {
      return true;
    }
  }
  return false;
}

app.post("/patients", async (req, res) => {
  const { name, national_id, phone, address } = req.body;
  if (await patientExists(national_id)) {
    res.status(303).send("Patient Exists");
  }
  else {
    try {
      sendSMS(name, phone);
    } catch (error) {
      res.send(error.message)
    }
    const newPatient = `\n${name},${national_id},${phone},${address}`;
    fs.appendFile("patients.csv", newPatient, (err) => {
      if (err) {
        console.error(err);
      }
    });
    res.send({ name, national_id, phone, address });
  }
});

app.get("/patients", (req, res) => {
  csv()
    .fromFile("patients.csv")
    .then((jsonObj) => {
      res.send(jsonObj);
    });
});

app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});
