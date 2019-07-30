"use strict";

const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

const uuidRand = function() {
	return crypto.randomBytes(16).toString("hex");
};

const getById = function(linkId) {
	const params = {
		TableName: process.env.DYNAMODB_TABLE,
		KeyConditionExpression: "linkId = :hkey",
		ExpressionAttributeValues: {
			":hkey": linkId
		}
	};

	return new Promise((res, rej) => {
		dynamoDb.query(params, function(err, data) {
			if (err) {
				console.log("Error", err);
				rej(err);
			} else {
				console.log("Success", data);
				res(data);
			}
		});
	});
};

const addLink = function(params) {
	return new Promise((res, rej) => {
		dynamoDb.put(params, function(err, data) {
			if (err) {
				console.log("Error", err);
				rej(err);
			} else {
				console.log("Success", data);
				res(data);
			}
		});
	});
};

const updateLink = function(params) {
	return new Promise((res, rej) => {
		dynamoDb.update(params, function(err, data) {
			if (err) {
				console.log("Error", err);
				rej(err);
			} else {
				console.log("Success", data);
				res(data);
			}
		});
	});
};

module.exports = {
	uuidRand,
	getById,
	addLink,
	updateLink
};
