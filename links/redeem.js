"use strict";

const { validAddress } = require("../util/address-auth");
const { getById, updateLink } = require("../util/dyanamo-queries");

module.exports.redeem = async (event, context) => {
  const timestamp = new Date().getTime();
  const reqData = JSON.parse(event.body);

  const authorized = validAddress(reqData.redeemAddress);

  if (!reqData.redeemAddress || !reqData.linkId || !authorized) {
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

    const invalidRedeemer = reqData.redeemAddress === link.senderAddress;

    if (!link.redeemed && !invalidRedeemer) {
      //TODO: SDK interaction

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
      const errorMessage = invalidRedeemer
        ? "sender and redeemer cannot be the same"
        : "link has already been redeemed";
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify({ message: errorMessage })
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
