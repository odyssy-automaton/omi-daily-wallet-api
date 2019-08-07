const { txStatus } = require("../util/poa-api");

const test = async txHash => {
  try {
    const res = await txStatus(txHash);
    console.log(res);
    return res;
  } catch (err) {
    console.log("err", err);
  }
};

const successTx =
  "0xaa5481f19aec5686f97cf3af3de212ebf5cb38c1809a76349f01eb89f7ef1d4f";
const pendingTx =
  "0xfc58f4031ef9f3dfa1f5292e9a0ec924cf98bfdcf9b2331aa4dfcd18686edf7b";
const invalidTx =
  "0xfc58f4031ef9f3dfa1f5292e9a0ec924cf98bfdcf9b2331ag4dfcd18686edf7b";

test(successTx);
test(pendingTx);
test(invalidTx);
