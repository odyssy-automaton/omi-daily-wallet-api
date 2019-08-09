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

module.exports.deploy = async (event, context) => {
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

    const web3 = new Web3("https://sokol.poa.network/");
    const sdkEnv = getSdkEnvironment(SdkEnvironmentNames.Sokol);
    const sdk = new createSdk(sdkEnv);

    await sdk.initialize({
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

    const connectRes = await sdk.connectAccount(newAccount.address);
    console.log("connectRes");
    console.log(connectRes);

    const estimate = await sdk.estimateAccountDeployment(
      sdkConstants.GasPriceStrategies.Avg
    );
    console.log("estimate");
    console.log(estimate);

    const rawTx = {
      // gasPrice: web3.utils.toWei("40", "Gwei"),
      // gasLimit: web3.utils.toWei("2200", "Gwei"),
      nonce: "0x16",
      // gasPrice: "0x2540BE400",
      // gasPrice: "0x" + estimate.totalGas.toString("hex"),
      gasPrice: web3.utils.toHex(1000000000),
      // gasLimit: web3.utils.toHex(21000000000000),
      gasLimit: "0x5208",
      to: newAccount.address,
      value: "0x" + estimate.totalGas.toString("hex")
    };
    console.log(rawTx);

    const pk = Buffer.from(privateKey, "hex");

    const tx = new Tx(rawTx);
    tx.sign(pk);
    const serializedTx = tx.serialize();

    console.log("filling gas tank");
    web3.eth
      .sendSignedTransaction("0x" + serializedTx.toString("hex"))
      .on("transactionHash", hash => {
        const updateParams = {
          TableName: process.env.DYNAMODB_ACCOUNT_TABLE,
          Key: {
            accountAddress: newAccount.address
          },
          ExpressionAttributeValues: {
            ":gasFillTx": hash,
            ":updatedAt": timestamp
          },
          UpdateExpression: `SET gasFillTx = :gasFillTx, updatedAt = :updatedAt`,
          ReturnValues: "ALL_NEW"
        };

        updateRecord(updateParams).then(updateRes => {
          console.log("updateRes");
          console.log(updateRes);
        });
      })
      .on("receipt", res => {
        console.log("deploying");
        ///maybe wait and do this with another job?
        sdk
          .deployAccount(estimate)
          .then(hash => {
            console.log("hash");
            console.log(hash);

            return {
              statusCode: 200,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": process.env.ORIGIN
              },
              body: JSON.stringify(newAccount)
            };
          })
          .catch(err => {
            console.log("err", err);

            return {
              statusCode: 400,
              headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": process.env.ORIGIN
              },
              body: JSON.stringify({ error: err })
            };
          });
      });
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
