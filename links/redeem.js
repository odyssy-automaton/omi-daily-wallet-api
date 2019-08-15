"use strict";

const AWS = require("aws-sdk");

///remove before DEPLOY
// var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
// AWS.config.credentials = credentials;
// AWS.config.update({ region: "us-east-1" });

const {
  SdkEnvironmentNames,
  getSdkEnvironment,
  createSdk
} = require("@archanova/sdk");
const ethToWei = require("@netgum/utils");
const { ethers } = require("ethers");

const { validAddress } = require("../util/address-auth");
const { getById, updateRecord } = require("../util/dyanamo-queries");
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
    const getRes = await getById(reqData.linkId);
    const link = getRes.Items[0];
    console.log("link", link);

    if (!link) {
      throw "link not found";
    }

    if (reqData.redeemAddress === link.senderAddress) {
      throw "invalid redeemer";
    }

    if (link.redeemed) {
      throw "link already redeemed";
    }

    const guardianPK = await omiPrivateKey();
    const provider = new ethers.providers.JsonRpcProvider(
      "https://sokol.poa.network/"
    );
    const guardian = new ethers.Wallet(guardianPK, provider);
    const sdkEnv = getSdkEnvironment(SdkEnvironmentNames.Sokol);
    const sdk = new createSdk(sdkEnv);

    await sdk.initialize({ device: { privateKey: guardianPK } });

    //is the sender === OMI
    if (link.senderAccount === process.env.OMI_WALLET) {
      let gasPrice = 1000000000;
      let gasLimit = 21000;
      let wei = ethers.utils.parseEther(link.amount);

      let txRes = await guardian.sendTransaction({
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        to: reqData.redeemAddress,
        value: wei
      });

      console.log.log("txRes");
      console.log.log(txRes);
    } else {
      const senderAccount = await sdk.connectAccount(link.senderAddress);

      // TODO: const hasBalance = senderAccount.balance.real >= link.amount;
      const hasBalance = true;

      if (!hasBalance) {
        throw "sender balance too low";
      }

      const estimate = await sdk.estimateAccountTransaction(
        reqData.redeemAddress,
        ethToWei(link.amount),
        null
      );
      console.log("estimate");
      console.log(estimate);

      let gasPrice = 1000000000;
      let gasLimit = 21000;
      let wei = ethers.utils.parseEther(estimate.totalGas);

      await guardian.sendTransaction({
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        to: link.senderAddress,
        value: wei
      });

      setTimeout(async () => {
        const txRes = await sdk.submitAccountTransaction(estimate);

        console.log("sdkTxRes");
        console.log(txRes);
        console.log("sent transaction from sender to redeemer");
      }, 15000);
    }

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

    await updateRecord(updateParams);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": process.env.ORIGIN
      },
      body: JSON.stringify({
        success: "transaction started",
        tx: txRes
      })
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
