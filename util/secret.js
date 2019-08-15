"use strict";

const AWS = require("aws-sdk");

///remove before DEPLOY
// var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
// AWS.config.credentials = credentials;
// AWS.config.update({ region: "us-east-1" });

const omiPrivateKey = async () => {
  const kms = new AWS.KMS();

  const decryptedData = await kms
    .decrypt({
      CiphertextBlob: Buffer.from(process.env.OMI_PK, "base64")
    })
    .promise();
  return String(decryptedData.Plaintext);
};

module.exports = {
  omiPrivateKey
};
