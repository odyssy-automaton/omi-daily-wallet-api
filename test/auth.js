const { validAddress } = require("../util/address-auth");

const test = address => {
  return validAddress(address);
};

const addr = "0x1419dba6141fc497FD69A66a6cb45bA57949D55f";
const res = test(addr);

console.log(res);
