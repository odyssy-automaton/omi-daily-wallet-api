require("dotenv").config();

const {
  getSdkEnvironment,
  SdkEnvironmentNames,
  createSdk
} = require("@archanova/sdk");

const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
AWS.config.credentials = credentials;
AWS.config.update({ region: "us-east-1" });
const kms = new AWS.KMS();

const {
  getAllAccounts,
  getUnclaimedAccounts
} = require("../util/dyanamo-queries");

const connect = async () => {
  const sdk = createSdk(getSdkEnvironment(SdkEnvironmentNames.Sokol));
  try {
    // const res = await getAllAccounts();
    const res = await getUnclaimedAccounts();
    const allAccounts = res.Items;

    const decryptedData = await kms
      .decrypt({
        CiphertextBlob: Buffer.from(process.env.OMI_PK, "base64")
      })
      .promise();
    const guardianPK = String(decryptedData.Plaintext);
    await sdk.initialize({ device: { privateKey: guardianPK } });

    for (let i = 0; i <= allAccounts.length; i++) {
      const account = await sdk.connectAccount(allAccounts[0].accountAddress);

      console.log("account");
      console.log(account.address);
      console.log(account.state);

      if (account.state !== "Deployed") {
        console.log("*******************************");
      }
    }

    console.log("complete");
    process.exit();
  } catch (err) {
    console.log(err);
    process.exit();
  }
};

connect();
