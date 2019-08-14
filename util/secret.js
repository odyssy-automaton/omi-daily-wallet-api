"use strict";

const AWS = require("aws-sdk");

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
