"use strict";

const { ethers } = require("ethers");

const validAddress = reqAddress => {
  try {
    ethers.utils.getAddress(reqAddress);
    return true;
  } catch (e) {
    console.error("invalid ethereum address", e.message);
    return false;
  }
};

module.exports = {
  validAddress
};
