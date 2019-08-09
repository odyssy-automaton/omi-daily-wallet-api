"use strict";

require("dotenv").config();
const AWS = require("aws-sdk");
// var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
// AWS.config.credentials = credentials;
// AWS.config.update({ region: "us-east-1" });

const omiPrivateKey = async () => {
  const kms = new AWS.KMS();

  const decryptedData = await kms
    .decrypt({
      CiphertextBlob: Buffer.from(process.env.TEST_SECRET, "base64")
    })
    .promise();
  return String(decryptedData.Plaintext);
};

module.exports = {
  omiPrivateKey
};
