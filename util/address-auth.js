"use strict";

var Web3 = require("web3");
const web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");

const validAddress = reqAddress => {
  console.log(reqAddress);

  try {
    const address = web3.utils.toChecksumAddress(reqAddress);
    console.log(address);
    return true;
  } catch (e) {
    console.error("invalid ethereum address", e.message);
    return false;
  }
};

module.exports = {
  validAddress
};
