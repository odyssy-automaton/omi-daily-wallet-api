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
const { anyToHex } = require("@netgum/utils");
const { addRecord } = require("../util/dyanamo-queries");

const batchDeploy = async count => {
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
      process.env.POA_NETWORK
    );
    const guardian = new ethers.Wallet(guardianPK, provider);
    const sdk = createSdk(
      getSdkEnvironment(SdkEnvironmentNames[process.env.SDK_ENV])
    );

    for (let i = 0; i < count; i++) {
      await sdk.initialize({ device: { privateKey: guardianPK } });
      console.log("creating account");
      let account = await sdk.createAccount();
      console.log(account);

      let gasPrice = 1000000000;
      let gasLimit = 25000;
      let wei = ethers.utils.parseEther("0.009");

      let nonce = await guardian.getTransactionCount();
      console.log("nonce", nonce);
      let nextNonce = "0x" + anyToHex(nonce + 1);
      console.log("nextNonce", nextNonce);
      console.log("sending gas");

      await guardian.sendTransaction({
        // nonce: nextNonce,
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
          setTimeout(() => resolve("hola"), 15000);
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

    console.log("complete");
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

batchDeploy(15);
