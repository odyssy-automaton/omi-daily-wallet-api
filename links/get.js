"use strict";

const { getLinkById } = require("../util/dyanamo-queries");

module.exports.get = async (event, context) => {
  try {
    const getRes = await getLinkById(event.pathParameters.linkId);
    const link = getRes.Items[0];

    if (!link) {
      throw "invalid link";
    }

    const linkRes = {
      linkId: link.linkId,
      redeemed: link.redeemed,
      amount: link.amount
    };

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": process.env.ORIGIN
      },
      body: JSON.stringify(linkRes)
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
