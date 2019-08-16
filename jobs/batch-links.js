require("dotenv").config();
const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
AWS.config.credentials = credentials;
AWS.config.update({ region: "us-east-1" });

const { send } = require("../links/send");

const batchLinks = async count => {
  try {
    let req = {
      body: JSON.stringify({
        amount: ".1",
        senderAddress: process.env.OMI_ADDRESS
      })
    };

    for (let i = 0; i < count; i++) {
      await send(req);
    }

    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

batchLinks(10);
