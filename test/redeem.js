require("dotenv").config();
const { redeem } = require("../links/redeem");

const test = async () => {
  const req = {
    body: JSON.stringify({
      redeemAddress: "0x5E71d3F649a7Bc11E8E7b6197A306282B4f182a4",
      linkId: "907c4c5df24289b2276cd41cbba296e5"
    })
  };

  const res = await redeem(req);
  console.log("res", res);
};

test();
