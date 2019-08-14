"use strict";

const kms = new AWS.KMS();
const Web3 = require("web3");
const Tx = require("ethereumjs-tx");
const {
  SdkEnvironmentNames,
  getSdkEnvironment,
  createSdk
} = require("@archanova/sdk");
const ethToWei = require("@netgum/utils");

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

    const invalidRedeemer = reqData.redeemAddress === link.senderAddress;

    if (!link.redeemed && !invalidRedeemer) {
      const privateKey = await omiPrivateKey();
      const sdkEnv = getSdkEnvironment(SdkEnvironmentNames.Xdai);
      const sdk = new createSdk(sdkEnv);
      await sdk.initialize({
        device: { privateKey }
      });

      // intialize withomi pk
      // connect to alice
      // send gas from OMI hot to alice //
      // send to bob

      const senderAccount = await sdk.connectAccount(link.senderAddress);

      //todo: bigint conversion
      if (senderAccount.balance.real >= link.amount) {
        const estimate = await sdk.estimateAccountTransaction(
          reqData.redeemAddress,
          ethToWei(link.amount),
          null
        );

        // {
        //   nonce: "BN: 0x0";
        //   data: Array(1);
        //   fixedGas: "BN: 0x1d4c0";
        //   totalGas: "BN: 0x22f18";
        //   totalCost: "BN: 0xef5042f87000";
        //   gasPrice: "BN: 0x3b9aca00";
        //   guardianSignature: "Buffer: 0x9c59c3b7c7091dcb0ec6d3fb27e60634f134eb295fe73812d3dbec4e9ec82da35cc1751ebb35be7e0825654cb7d85c5dac32d3e0f00f422daadf8800a94e377d1c";
        // }

        if (link.senderAccount !== process.env.OMI_WALLET) {
          const decryptedData = await kms
            .decrypt({
              CiphertextBlob: Buffer.from(process.env.TEST_SECRET, "base64")
            })
            .promise();

          const privateKey = new Buffer(String(decryptedData.Plaintext));

          //what is needed here?
          const rawTx = {
            // nonce: '0x00',
            // gasPrice: '0x09184e72a000',
            // gasLimit: '0x2710',
            to: reqData.redeemAddress,
            value: estimate.totalGas
          };

          const tx = new Tx(rawTx);
          tx.sign(privateKey);
          const serializedTx = tx.serialize();

          const tx = await web3.eth.sendSignedTransaction(
            "0x" + serializedTx.toString("hex")
          );
        }

        const txHash = await sdk.submitAccountTransaction(estimated);
        console.log("txHash");
        console.log(txHash);

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

        const updateRes = await updateRecord(updateParams);

        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": process.env.ORIGIN
          },
          body: JSON.stringify(updateRes)
        };
      } else {
        return {
          statusCode: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": process.env.ORIGIN
          },
          body: JSON.stringify({ error: "Balance is less than send amount" })
        };
      }
    } else {
      const errorMessage = invalidRedeemer
        ? "sender and redeemer cannot be the same"
        : "link has already been redeemed";
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": process.env.ORIGIN
        },
        body: JSON.stringify({ message: errorMessage })
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
