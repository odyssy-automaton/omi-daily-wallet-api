"use strict";

const { getById, updateLink } = require("../util/dyanamo-queries");

module.exports.redeem = async (event, context) => {
  const timestamp = new Date().getTime();
  const reqData = JSON.parse(event.body);

  if (!reqData.redeemAddress || !reqData.linkId) {
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
    const getRes = await getById(reqData.linkId);
    const link = getRes.Items[0];

    if (!link) {
      throw "link not found";
    }

    if (!link.redeemed) {
      //TODO: SKD interaction

      const updateParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          linkId: reqData.linkId
        },
        ExpressionAttributeValues: {
          ":redeemed": true,
          ":redeemAddress": reqData.redeemAddress,
          ":updatedAt": timestamp
        },
        UpdateExpression: `SET redeemed = :redeemed, redeemAddress = :redeemAddress, updatedAt = :updatedAt`,
        ReturnValues: "ALL_NEW"
      };

      const updateRes = await updateLink(updateParams);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify(updateRes)
      };
    } else {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify({ data: "link has already been redeemed" })
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
