require("dotenv").config();

const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
AWS.config.credentials = credentials;
AWS.config.update({ region: "us-east-1" });

const {
  getUnclaimedAccounts,
  getClaimedAccounts,
  updateRecord
} = require("../util/dyanamo-queries");

const test = async () => {
  let userDeviceAddress = "0xb2809e4624bE41D15349C76482B575a64eb1B8B8";

  const claimedAccounts = await getClaimedAccounts();
  console.log(claimedAccounts.Items);
  const deviceAssigned = claimedAccounts.Items.find(account => {
    return account.appDeviceId == userDeviceAddress;
  });

  console.log(deviceAssigned);
};

test();
