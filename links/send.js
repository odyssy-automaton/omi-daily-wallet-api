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
    const guardianPK = await omiPrivateKey();
    const sdkEnv = getSdkEnvironment(SdkEnvironmentNames.Xdai);
    const sdk = new createSdk(sdkEnv);
    await sdk.initialize({ device: { privateKey: guardianPK } });

    const senderAccount = await sdk.connectAccount(reqData.senderAddress);

    // const canSend = senderAccount && senderAccount.balance.real >= reqData.amount;
    // need to figure out the comparison
    // senderAccount won't connect on omi airdrop links
    // maybe just do this on the FE
    const canSend = true;

    if (!canSend) {
      throw "Balance is less than send amount";
    }

    const linkId = await uuidRand();

    const newLinkParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        linkId,
        url: `${process.env.APP_URL}?id=${linkId}`,
        senderAddress: senderAccount.address,
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
