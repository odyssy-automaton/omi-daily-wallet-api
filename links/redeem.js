"use strict";

///remove before DEPLOY
// const AWS = require("aws-sdk");
// var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
// AWS.config.credentials = credentials;
// AWS.config.update({ region: "us-east-1" });

const {
  SdkEnvironmentNames,
  getSdkEnvironment,
  createSdk
} = require("@archanova/sdk");
const { ethers } = require("ethers");
const { anyToHex, ethToWei } = require("@netgum/utils");

const { validAddress } = require("../util/address-auth");
const { getLinkById, updateRecord } = require("../util/dyanamo-queries");
const { omiPrivateKey } = require("../util/secret");

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
    const getRes = await getLinkById(reqData.linkId);
    const link = getRes.Items[0];

    if (!link) {
      throw "link not found";
    }

    if (reqData.redeemAddress === link.senderAddress) {
      throw "invalid redeemer";
    }

    if (link.redeemed) {
      throw "link already redeemed";
    }

    const provider = new ethers.providers.JsonRpcProvider(
      process.env.POA_NETWORK
    );

    const balance = await provider.getBalance(address);
    let etherString = ethers.utils.formatEther(balance);

    if (parseFloat(etherString) < parseFloat(link.amount)) {
      throw "sender balance is too low";
    }

    const guardianPK = await omiPrivateKey();
    const guardian = new ethers.Wallet(guardianPK, provider);
    const sdkEnv = getSdkEnvironment(SdkEnvironmentNames[process.env.SDK_ENV]);
    const sdk = new createSdk(sdkEnv);

    await sdk.initialize({ device: { privateKey: guardianPK } });

    if (link.senderAddress === process.env.OMI_ADDRESS) {
      let gasPrice = 1000000000;
      let gasLimit = 25000;
      let wei = ethers.utils.parseEther(link.amount);

      let txRes = await guardian.sendTransaction({
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        to: reqData.redeemAddress,
        value: wei
      });

      let updateParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          linkId: reqData.linkId
        },
        ExpressionAttributeValues: {
          ":redeemed": true,
          ":redeemAddress": reqData.redeemAddress,
          ":txHash": txRes.hash,
          ":updatedAt": timestamp
        },
        UpdateExpression: `SET redeemed = :redeemed, redeemAddress = :redeemAddress, txHash = :txHash, updatedAt = :updatedAt`,
        ReturnValues: "ALL_NEW"
      };

      await updateRecord(updateParams);

      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify({
          success: "transaction started"
        })
      };
    } else {
      const senderAccount = await sdk.connectAccount(link.senderAddress);
      // TODO: const hasBalance = senderAccount.balance.real >= link.amount;
      console.log("senderAccount", senderAccount.address);

      if (senderAccount.state !== "Deployed") {
        throw "Account not deployed";
      }
      const hasBalance = true;

      if (!hasBalance) {
        throw "sender balance too low";
      }

      console.log("estimating");
      const estimate = await sdk.estimateAccountTransaction(
        reqData.redeemAddress,
        ethToWei(link.amount),
        null
      );

      let gasPrice = 1000000000;
      let gasLimit = 25000;
      let wei = `0x${anyToHex(estimate.totalGas)}`;

      console.log("sending gas");
      await guardian.sendTransaction({
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        to: link.senderAddress,
        value: wei
      });

      function wait() {
        return new Promise((resolve, reject) => {
          setTimeout(() => resolve("hola"), 6000);
        });
      }

      console.log("waiting");
      await wait();

      console.log("starting tx");
      const txRes = await sdk.submitAccountTransaction(estimate);
      console.log("txRes", txRes);

      const updateParams = {
        TableName: process.env.DYNAMODB_TABLE,
        Key: {
          linkId: reqData.linkId
        },
        ExpressionAttributeValues: {
          ":redeemed": true,
          ":redeemAddress": reqData.redeemAddress,
          ":txHash": txRes,
          ":updatedAt": timestamp
        },
        UpdateExpression: `SET redeemed = :redeemed, redeemAddress = :redeemAddress, txHash = :txHash, updatedAt = :updatedAt`,
        ReturnValues: "ALL_NEW"
      };

      console.log("updating record");
      await updateRecord(updateParams);

      console.log("returning");
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify({
          success: "transaction started"
        })
      };
    }
  } catch (err) {
    console.log(err);

    if (typeof err !== "string") {
      err = "something went very wrong. probably the blockchain";
    }

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
