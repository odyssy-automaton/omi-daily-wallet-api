"use strict";

const AWS = require("aws-sdk");
const kms = new AWS.KMS();

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

    if (link.senderAccount !== process.env.OMI_WALLET) {
      // send gas from OMI hot to alice
      // send to bob

      let gasPrice = 1000000000;
      let gasLimit = 21000;
      let wei = ethers.utils.parseEther("0.01");

      await guardian.sendTransaction({
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        to: account.address,
        value: wei
      });

      setTimeout(async () => {
        await sdk.submitAccountTransaction(estimate);
        console.log("sent transaction from sender to redeemer");
      }, 15000);
    } else {
      let gasPrice = 1000000000;
      let gasLimit = 21000;
      let wei = ethers.utils.parseEther(link.amount);

      await guardian.sendTransaction({
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        to: account.address,
        value: wei
      });
    }

    const updateParams = {
      TableName: process.env.DYNAMODB_TABLE,
      Key: {
        linkId: reqData.linkId
      },
      ExpressionAttributeValues: {
        ":redeemed": true,
        ":redeemAddress": reqData.redeemAddress,
        ":txHash": txHash,
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
      body: JSON.stringify(updateRes)
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
