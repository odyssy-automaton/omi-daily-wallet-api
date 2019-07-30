"use strict";

const { getById } = require("../util/dyanamo-queries");

module.exports.get = async (event, context) => {
	try {
		const getRes = await getById(event.pathParameters.linkId);
		const link = getRes.Items[0];

		if (link) {
			return {
				statusCode: 200,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": process.env.ORIGIN
				},
				body: JSON.stringify(link)
			};
		} else {
			return {
				statusCode: 200,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": process.env.ORIGIN
				},
				body: "bot not found"
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
			body: err
		};
	}
};
