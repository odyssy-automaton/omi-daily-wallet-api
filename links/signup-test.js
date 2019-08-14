"use strict";

const { validAddress } = require("../util/address-auth");
const {
  getUnclaimedAccounts,
  getClaimedAccounts,
  updateRecord
} = require("../util/dyanamo-queries");

module.exports.signupTest = async (event, context) => {
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
      return account.appDeviceId === reqData.userDeviceAddress;
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

    const unclaimedAccounts = await getUnclaimedAccounts();
    const account = unclaimedAccounts.Items[0];

    if (account) {
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
