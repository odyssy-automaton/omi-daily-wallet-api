const axios = require("axios");

const baseUrl = "https://blockscout.com/poa/dai/api";

const txStatus = async txHash => {
  const res = await axios.get(
    `${baseUrl}?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`
  );

  if (res.data.result) {
    return res.data.result.status === "1" ? "success" : "pending";
  } else {
    return "invalid";
  }
};

module.exports = {
  txStatus
};
