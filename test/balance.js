require("dotenv").config();

const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
AWS.config.credentials = credentials;
AWS.config.update({ region: "us-east-1" });

const { ethers } = require("ethers");

const { getLinkById } = require("../util/dyanamo-queries");

const test = async () => {
  const provider = new ethers.providers.JsonRpcProvider(
    "https://sokol.poa.network/"
  );
  const address = "0x5c52e30d8612d4087dd362467a67cb6dd58b52e4";
  const balance = await provider.getBalance(address);
  console.log(balance);
  let etherString = ethers.utils.formatEther(balance);
  console.log(parseFloat(etherString));

  const linkId = "44d9e3da0c432a81bd70547d22ba4988";
  const getRes = await getLinkById(linkId);
  const link = getRes.Items[0];
  console.log(parseFloat(link.amount));

  console.log("etherString < link.amount");
  console.log(parseFloat(etherString) < parseFloat(link.amount));
};

test();
