require("dotenv").config();

const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
AWS.config.credentials = credentials;
AWS.config.update({ region: "us-east-1" });
const kms = new AWS.KMS();

const { writeFileSync } = require("fs");
const { ethers } = require("ethers");
const {
  getSdkEnvironment,
  SdkEnvironmentNames,
  createSdk
} = require("@archanova/sdk");
const { addRecord } = require("../util/dyanamo-queries");

module.exports.batchDeploy = async (event, context) => {
  const timestamp = new Date().getTime();
  let output = [];

  try {
    const decryptedData = await kms
      .decrypt({
        CiphertextBlob: Buffer.from(process.env.OMI_PK, "base64")
      })
      .promise();
    const guardianPK = String(decryptedData.Plaintext);

    const provider = new ethers.providers.JsonRpcProvider(
      "https://sokol.poa.network/"
    );
    const guardian = new ethers.Wallet(guardianPK, provider);
    const sdk = createSdk(getSdkEnvironment(SdkEnvironmentNames.Sokol));

    for (let count = 0; count < event.count; count++) {
      await sdk.initialize({ device: { privateKey: guardianPK } });
      console.log("creating account");
      let account = await sdk.createAccount();
      console.log(account);

      let gasPrice = 1000000000;
      let gasLimit = 21000;
      let wei = ethers.utils.parseEther("0.01");

      // const nonce = await guardian.getTransactionCount();
      // console.log(nonce);
      console.log("sending gas");
      await guardian.sendTransaction({
        gasLimit: gasLimit,
        gasPrice: gasPrice,
        to: account.address,
        value: wei
      });

      let estimate = await sdk.estimateAccountDeployment();

      output.push({ address: account.address });
      writeFileSync(
        `./addresses/output_${timestamp}.txt`,
        JSON.stringify(output)
      );

      function wait() {
        return new Promise((resolve, reject) => {
          setTimeout(() => resolve("hola"), 1500);
        });
      }

      console.log("waiting");
      await wait();

      console.log("deploying");
      await sdk.deployAccount(estimate);
      console.log("deployed", account.address);

      const newAccountParams = {
        TableName: process.env.DYNAMODB_ACCOUNT_TABLE,
        Item: {
          accountAddress: account.address,
          appDeviceId: "0x0",
          claimed: false,
          createdAt: timestamp
        }
      };

      console.log("adding record");
      await addRecord(newAccountParams);
    }
  } catch (err) {
    console.log(err);
  }
};
