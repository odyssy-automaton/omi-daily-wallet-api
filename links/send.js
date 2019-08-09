"use strict";

const { validAddress } = require("../util/address-auth");
const { uuidRand, addRecord } = require("../util/dyanamo-queries");
const { omiPrivateKey } = require("../util/secret");
const {
  SdkEnvironmentNames,
  getSdkEnvironment,
  createSdk
} = require("@archanova/sdk");

module.exports.send = async (event, context) => {
  const timestamp = new Date().getTime();
  const reqData = JSON.parse(event.body);

  const authorized = validAddress(reqData.senderAddress);

  if (!reqData || !reqData.senderAddress || !reqData.amount || !authorized) {
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
    const privateKey = await omiPrivateKey();
    const sdkEnv = getSdkEnvironment(SdkEnvironmentNames.Xdai);
    const sdk = new createSdk(sdkEnv);
    await sdk.initialize({
      device: { privateKey }
    });

    // const senderAccount = await sdk.connectAccount(reqData.senderAddress);

    // const canSend = senderAccount && senderAccount.balance.real >= reqData.amount;
    const canSend = true;

    //validate good senderAccount here
    //todo: compate bigint and amount
    //how do we go from bigInt ot xdai amount?

    if (canSend) {
      const linkId = await uuidRand();

      const newLinkParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
          linkId,
          url: `${process.env.APP_URL}?id=${linkId}`,
          senderAddress: reqData.senderAddress,
          amount: reqData.amount,
          redeemed: false,
          createdAt: timestamp
        }
      };

      await addRecord(newLinkParams);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify(newLinkParams.Item)
      };
    } else {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify({ error: "Balance is less than send amount" })
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
