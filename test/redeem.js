require("dotenv").config();
const { redeem } = require("../links/redeem");

const test = async () => {
  const req = {
    body: JSON.stringify({
      redeemAddress: "0x6cA268be3D38687C7f744bB9C9051dAB3C9BB179",
      // redeemAddress: "0x5E71d3F649a7Bc11E8E7b6197A306282B4f182a4",
      // redeemAddress: "0x962E624dCfA8CfB220015A5292C15d4006c42a85",
      linkId: "2d972b453e9606223a4e9467c32c6bc0"
    })
  };

  const res = await redeem(req);
  console.log("res", res);
};

test();
