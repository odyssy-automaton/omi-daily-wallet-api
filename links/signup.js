"use strict";

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
      return account.appDeviceId == reqData.userDeviceAddress;
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

    const guardianPK = await omiPrivateKey();
    const sdkEnv = getSdkEnvironment(SdkEnvironmentNames[process.env.SDK_ENV]);
    const sdk = new createSdk(sdkEnv);

    await sdk.initialize({ device: { privateKey: guardianPK } });

    const unclaimedAccounts = await getUnclaimedAccounts();
    const account = unclaimedAccounts.Items[0];

    if (account) {
      const connectRes = await sdk.connectAccount(account.accountAddress);
      console.log("connectRes");
      console.log(connectRes);

      if (connectRes) {
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

        await updateRecord(updateParams);

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
          body: JSON.stringify({ error: "No connection" })
        };
      }
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
