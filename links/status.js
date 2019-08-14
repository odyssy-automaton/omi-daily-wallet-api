"use strict";

const { getById } = require("../util/dyanamo-queries");
const { txStatus } = require("../util/poa-api");

module.exports.status = async (event, context) => {
  try {
    const action = event.pathParameters.action;
    const getRes = await getById(event.pathParameters.linkId);
    const link = getRes.Items[0];

    const txHash = action === "send" ? link.sendTx : link.redeemTx;
    const status = await txStatus(txHash);

    //if status === 'success', update the recortd

    if (status === "success") {
      const updateParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          linkId: reqData.linkId
        },
        ExpressionAttributeValues: {
          ":redeemed": true,
          ":updatedAt": timestamp
        },
        UpdateExpression: `SET redeemed = :redeemed, redeemAddress = :redeemAddress, updatedAt = :updatedAt`,
        ReturnValues: "ALL_NEW"
      };
    }

    const statusRes = {
      ...link
    };

    if (link) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify(statusRes)
      };
    } else {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify({ message: "invalid link" })
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
