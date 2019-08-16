"use strict";

const { validAddress } = require("../util/address-auth");
const { uuidRand, addRecord } = require("../util/dyanamo-queries");

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
