const {
  getSdkEnvironment,
  SdkEnvironmentNames,
  createSdk
} = require("@archanova/sdk");

const guardianPK = "";

module.exports.connect = async (event, context) => {
  const sdk = createSdk(getSdkEnvironment(SdkEnvironmentNames.Sokol));
  // const sdk = createSdk(getSdkEnvironment(SdkEnvironmentNames.Kovan));
  try {
    await sdk.initialize({ device: { privateKey: guardianPK } });

    const account = await sdk.connectAccount("");

    console.log("account");
    console.log(account);

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
