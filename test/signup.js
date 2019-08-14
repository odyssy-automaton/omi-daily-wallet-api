require("dotenv").config();
const { signup } = require("../links/signup");

const req = {
  body: JSON.stringify({
    userDeviceAddress: "0xF78e0535314e7053B302bD42F53e6d6eF5977eB8"
  })
};

const test = async () => {
  const res = await signup(req);
  console.log("res", res);
};

test();
