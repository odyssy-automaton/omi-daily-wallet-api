"use strict";

const { uuidRand, addLink } = require("../util/dyanamo-queries");

module.exports.send = async (event, context) => {
  const timestamp = new Date().getTime();
  const reqData = JSON.parse(event.body);

  if (!reqData || !reqData.senderAddress || !reqData.amount) {
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
    //TODO: SKD interaction
    const linkId = await uuidRand();

    const newLinkParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        linkId,
        url: `${process.env.APP_URL}?id=${linkId}`,
        senderAddres: reqData.senderAddress,
        amount: reqData.amount,
        redeemed: false,
        createdAt: timestamp
      }
    };

    await addLink(newLinkParams);

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
