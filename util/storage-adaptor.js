class StorageAdaptor {
  constructor(pk) {
    this.omiPk = pk;
  }

  async getItem(key) {
    console.log("getItem", key);

    if (key === "@archanova:sokol:device:private_key") {
      return this.omiPk;
    }
    // return { type: "Buffer", data: this.omiPk };
    // return this.omiPk
  }

  async setItem(key, value) {
    console.log("setitem key", key);
    console.log("setiem value", value);
  }
}

module.exports = StorageAdaptor;
