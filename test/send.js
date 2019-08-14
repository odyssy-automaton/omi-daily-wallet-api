require("dotenv").config();
const { send } = require("../links/send");

const req = {
  body: JSON.stringify({
    amount: "15",
    senderAddress: "0x83aB8e31df35AA3281d630529C6F4bf5AC7f7aBF"
  })
};

const res = send(req);

console.log("res", res);
