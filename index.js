const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();
app.use(bodyParser.json());
const port = 3002;
const host = "localhost";
const csv = require("csvtojson");

const Vonage = require('@vonage/server-sdk')



function sendSMS() {
  const vonage = new Vonage({
    apiKey: "897fae8d",
    apiSecret: "19evLeGC8R91yOBo"
  })
  const from = "sa7ti"
  const to = "201554253515"
  const text = 'اهلا حمدى ؛ رقم طلبك هو 0001  ؛ سيتم التواصل معك وحجزك في اقرب وحدة صحية بالقرب منك'
  vonage.message.sendSms(from, to, text, (err, responseData) => {
    if (err) {
      console.log(err);
    } else {
      if (responseData.messages[0]['status'] === "0") {
        console.log("Message sent successfully.");
      } else {
        console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
      }
    }
  })
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
    const newPatient = `\n${name},${national_id},${phone},${address}`;
    fs.appendFile("patients.csv", newPatient, (err) => {
      if (err) {
        console.error(err);
      }
    });
    sendSMS();
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
