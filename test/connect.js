require("dotenv").config();
const { connect } = require("../jobs/connect");

const test = async () => {
  const res = await connect();
  console.log("res", res);
};

test();
