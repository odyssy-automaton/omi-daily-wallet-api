const { validAddress } = require("../util/address-auth");

const test = address => {
  return validAddress(address);
};

const addr = "0xD662C44e9f1EF99D05877c7cD5142C5A91A9f4c7";
const res = test(addr);

console.log(res);
