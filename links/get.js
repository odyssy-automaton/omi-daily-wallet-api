"use strict";

const { getByLinkId } = require("../util/dyanamo-queries");

module.exports.get = async (event, context) => {
  try {
    const getRes = await getByLinkId(event.pathParameters.linkId);
    const link = getRes.Items[0];

    const linkRes = {
      linkId: link.linkId,
      redeemed: link.redeemed,
      amount: link.amount
    };

    if (link) {
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify(linkRes)
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
