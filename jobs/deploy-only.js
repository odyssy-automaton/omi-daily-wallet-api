"use strict";

require("dotenv").config();
const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
AWS.config.credentials = credentials;
AWS.config.update({ region: "us-east-1" });
const kms = new AWS.KMS();

const Web3 = require("web3");
const Tx = require("ethereumjs-tx");
const shortid = require("shortid");

const {
  SdkEnvironmentNames,
  getSdkEnvironment,
  createSdk,
  sdkConstants
} = require("@archanova/sdk");

const { addRecord, updateRecord } = require("../util/dyanamo-queries");

const StorageAdaptor = require("../util/storage-adaptor");

module.exports.deployOnly = async (event, context) => {
  const reqData = JSON.parse(event.body);
  const timestamp = new Date().getTime();

  //todo - loop based on reqData.accountCount
  console.log(reqData);

  try {
    const decryptedData = await kms
      .decrypt({
        CiphertextBlob: Buffer.from(process.env.TEST_SECRET, "base64")
      })
      .promise();
    const privateKey = String(decryptedData.Plaintext);

    console.log(privateKey);

    const storageAdaptor = new StorageAdaptor(privateKey);

    const sdkEnv = getSdkEnvironment(SdkEnvironmentNames.Sokol);
    const sdk = new createSdk(
      sdkEnv.setConfig("storageAdapter", storageAdaptor)
    );

    const initRes = await sdk.initialize({
      device: { privateKey }
    });

    const ensUuid = shortid.generate();
    const newAccount = await sdk.createAccount(ensUuid);
    console.log(newAccount);

    const newAccountParams = {
      TableName: process.env.DYNAMODB_ACCOUNT_TABLE,
      Item: {
        accountAddress: newAccount.address,
        ensName: newAccount.ensName,
        appDeviceId: "0x0",
        claimed: false,
        createdAt: timestamp
      }
    };

    await addRecord(newAccountParams);

    const accounts = await sdk.getConnectedAccounts();
    console.log("accounts.length");
    console.log(accounts.items.length);
    console.log(accounts);

    // const connectRes = await sdk.connectAccount(reqData.accountAddress);
    // console.log("connectRes");
    // console.log(connectRes);

    // const estimate = await sdk.estimateAccountDeployment(
    //   sdkConstants.GasPriceStrategies.Avg
    // );
    // console.log("estimate");
    // console.log(estimate);

    // const deployRes = await sdk.deployAccount(estimate);

    // console.log("deployRes");
    // console.log(deployRes);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": process.env.ORIGIN
      },
      body: JSON.stringify(initRes)
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
