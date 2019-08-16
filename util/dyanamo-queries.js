"use strict";

const AWS = require("aws-sdk");
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const crypto = require("crypto");

const uuidRand = function() {
  return crypto.randomBytes(16).toString("hex");
};

const getLinkById = function(linkId) {
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
        res(data);
      }
    });
  });
};

const getAccountById = function(accountAddress) {
  const params = {
    TableName: process.env.DYNAMODB_ACCOUNT_TABLE,
    KeyConditionExpression: "accountAddress = :hkey",
    ExpressionAttributeValues: {
      ":hkey": accountAddress
    }
  };

  return new Promise((res, rej) => {
    dynamoDb.query(params, function(err, data) {
      if (err) {
        console.log("Error", err);
        rej(err);
      } else {
        res(data);
      }
    });
  });
};

const addRecord = function(params) {
  return new Promise((res, rej) => {
    dynamoDb.put(params, function(err, data) {
      if (err) {
        console.log("Error", err);
        rej(err);
      } else {
        res(data);
      }
    });
  });
};

const updateRecord = function(params) {
  return new Promise((res, rej) => {
    dynamoDb.update(params, function(err, data) {
      if (err) {
        console.log("Error", err);
        rej(err);
      } else {
        res(data);
      }
    });
  });
};

const getAllAccounts = function() {
  const params = {
    TableName: process.env.DYNAMODB_ACCOUNT_TABLE
  };

  return new Promise((res, rej) => {
    dynamoDb.scan(params, function(err, data) {
      if (err) {
        console.log("Error", err);
        rej(err);
      } else {
        res(data);
      }
    });
  });
};

const getUnclaimedAccounts = function() {
  const params = {
    TableName: process.env.DYNAMODB_ACCOUNT_TABLE,
    FilterExpression: "#claimed = :claimed",
    ExpressionAttributeNames: {
      "#claimed": "claimed"
    },
    ExpressionAttributeValues: {
      ":claimed": false
    }
  };

  return new Promise((res, rej) => {
    dynamoDb.scan(params, function(err, data) {
      if (err) {
        console.log("Error", err);
        rej(err);
      } else {
        res(data);
      }
    });
  });
};

const getClaimedAccounts = function() {
  const params = {
    TableName: process.env.DYNAMODB_ACCOUNT_TABLE,
    FilterExpression: "#claimed = :claimed",
    ExpressionAttributeNames: {
      "#claimed": "claimed"
    },
    ExpressionAttributeValues: {
      ":claimed": true
    }
  };

  return new Promise((res, rej) => {
    dynamoDb.scan(params, function(err, data) {
      if (err) {
        console.log("Error", err);
        rej(err);
      } else {
        res(data);
      }
    });
  });
};

module.exports = {
  uuidRand,
  getAccountById,
  getLinkById,
  addRecord,
  updateRecord,
  getAllAccounts,
  getUnclaimedAccounts,
  getClaimedAccounts
};
