"use strict";

// require("dotenv").config();
// const AWS = require("aws-sdk");
// var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
// AWS.config.credentials = credentials;
// AWS.config.update({ region: "us-east-1" });
// const kms = new AWS.KMS();

const {
  SdkEnvironmentNames,
  getSdkEnvironment,
  createSdk
} = require("@archanova/sdk");

const { validAddress } = require("../util/address-auth");
const { omiPrivateKey } = require("../util/secret");
const {
  getUnclaimedAccounts,
  getClaimedAccounts,
  updateRecord
} = require("../util/dyanamo-queries");

module.exports.signup = async (event, context) => {
  const reqData = JSON.parse(event.body);
  const timestamp = new Date().getTime();

  const authorized = validAddress(reqData.userDeviceAddress);

  if (!reqData || !reqData.userDeviceAddress || !authorized) {
    console.error("Validation Failed");
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": process.env.ORIGIN
      },
      body: JSON.stringify({ error: "missing values" })
    };
  }

  try {
    const claimedAccounts = await getClaimedAccounts();
    const deviceAssigned = claimedAccounts.Items.find(account => {
      account.appDeviceId == reqData.userDeviceAddress;
    });

    if (deviceAssigned) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify(deviceAssigned)
      };
    }

    const privateKey = await omiPrivateKey();
    const sdkEnv = getSdkEnvironment(SdkEnvironmentNames.Sokol);
    const sdk = new createSdk(sdkEnv);

    await sdk.initialize({
      device: { privateKey }
    });

    const unclaimedAccounts = await getUnclaimedAccounts();
    const account = unclaimedAccounts.Items[0];

    if (account) {
      const connectRes = await sdk.connectAccount(account.accountAddress);
      console.log("connectRes");
      console.log(connectRes);

      const deviceRes = await sdk.createAccountDevice(
        reqData.userDeviceAddress
      );
      console.log(deviceRes);

      const updateParams = {
        TableName: process.env.DYNAMODB_ACCOUNT_TABLE,
        Key: {
          accountAddress: account.accountAddress
        },
        ExpressionAttributeValues: {
          ":claimed": true,
          ":appDeviceId": reqData.userDeviceAddress,
          ":updatedAt": timestamp
        },
        UpdateExpression: `SET claimed = :claimed, appDeviceId = :appDeviceId, updatedAt = :updatedAt`,
        ReturnValues: "ALL_NEW"
      };

      const updateRes = await updateRecord(updateParams);
      console.log("updateRes");
      console.log(updateRes);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify(account)
      };
    } else {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify({ error: "There are no available accounts" })
      };
    }
  } catch (err) {
    console.log(err);
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "text/plain",
        "Access-Control-Allow-Origin": process.env.ORIGIN
      },
      body: JSON.stringify({ error: err })
    };
  }
};
