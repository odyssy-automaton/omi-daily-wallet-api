require("dotenv").config();
const AWS = require("aws-sdk");
var credentials = new AWS.SharedIniFileCredentials({ profile: "default" });
AWS.config.credentials = credentials;
AWS.config.update({ region: "us-east-1" });
var kms = new AWS.KMS();

const showSecret = () => {
  kms
    .decrypt({
      CiphertextBlob: Buffer.from(process.env.TEST_SECRET, "base64")
    })
    .promise()
    .then(data => {
      const decrypted = String(data.Plaintext);

      console.log("decrypted");
      console.log(decrypted);
    })
    .catch(err => {
      console.log("err", err);
    });
};

showSecret();
