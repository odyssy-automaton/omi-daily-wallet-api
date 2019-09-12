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
  console.log(process.env.SDK_ENV);
  const sdk = createSdk(
    getSdkEnvironment(SdkEnvironmentNames[process.env.SDK_ENV])
  );
  try {
    const res = await getAllAccounts();
    // const res = await getUnclaimedAccounts();
    const allAccounts = res.Items;

    console.log("account count", allAccounts.length);

    const decryptedData = await kms
      .decrypt({
        CiphertextBlob: Buffer.from(process.env.OMI_PK, "base64")
      })
      .promise();
    const guardianPK = String(decryptedData.Plaintext);
    await sdk.initialize({ device: { privateKey: guardianPK } });

    for (let i = 0; i <= allAccounts.length; i++) {
      const account = await sdk.connectAccount(allAccounts[i].accountAddress);

      // if (account.address == "0xf9a71B322D16E99209De794B223721de23382fb4") {
      //   console.log(account.address);
      //   console.log(account.state);
      //   console.log(account);
      // }

      // if (account.address == "0xA9dEC5a9E6B8942cC627899A7b42eaEd78a62298") {
      //   console.log("find me");
      //   console.log(account);

      //   let estimate = await sdk.estimateAccountDeployment();
      //   let res = await sdk.deployAccount(estimate);
      //   console.log("deployed", account.address);
      //   console.log(res);
      // }

      // if (account.state !== "Deployed") {
      // }

      if (account.state !== "Deployed") {
        console.log("*******************************");
        console.log("account");
        // console.log(account.address);
        // console.log(account.state);
        console.log(account);
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
