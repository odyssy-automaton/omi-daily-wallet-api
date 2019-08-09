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
      let account = await sdk.createAccount();
      console.log(account);

      const newAccountParams = {
        TableName: process.env.DYNAMODB_ACCOUNT_TABLE,
        Item: {
          accountAddress: account.address,
          appDeviceId: "0x0",
          claimed: false,
          createdAt: timestamp
        }
      };

      await addRecord(newAccountParams);

      let gasPrice = 1000000000;
      let gasLimit = 21000;
      let wei = ethers.utils.parseEther("0.01");

      // const nonce = await guardian.getTransactionCount();
      // console.log(nonce);
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

      setTimeout(async () => {
        await sdk.deployAccount(estimate);
        console.log("deployed", account.address);
      }, 15000);
    }

    return {
      statusCode: 200,
      body: "ok"
    };
  } catch (err) {
    console.log(err);
    return {
      statusCode: 400,
      body: err
    };
  }
};
