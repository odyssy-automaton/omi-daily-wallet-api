require("dotenv").config();
const { get } = require("../links/get");

const test = async () => {
  const req = {
    pathParameters: {
      linkId: "907c4c5df24289b2276cd41cbba296e"
    }
  };

  const res = await get(req);
  console.log("res", res);
};

test();
